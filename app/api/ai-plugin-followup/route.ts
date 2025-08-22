import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { AIPluginSession } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const sessionsCollection = db.collection<AIPluginSession>("ai_plugin_sessions")

    // Find incomplete sessions that need follow-up
    const incompleteSessions = await sessionsCollection
      .find({
        userId: session.user.email,
        status: { $in: ["active", "abandoned"] },
        followUpEnforced: { $ne: false },
      })
      .sort({ last_updated: -1 })
      .toArray()

    // Calculate follow-up urgency
    const sessionsWithUrgency = incompleteSessions.map((pluginSession) => {
      const lastUpdated = new Date(pluginSession.last_updated)
      const now = new Date()
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

      let urgency: "low" | "medium" | "high" | "critical"
      if (hoursSinceUpdate < 1) urgency = "low"
      else if (hoursSinceUpdate < 6) urgency = "medium"
      else if (hoursSinceUpdate < 24) urgency = "high"
      else urgency = "critical"

      return {
        ...pluginSession,
        urgency,
        hoursSinceUpdate: Math.round(hoursSinceUpdate),
        completionPercentage: Math.round((pluginSession.currentStep / pluginSession.totalSteps) * 100),
      }
    })

    return NextResponse.json({
      incompleteSessions: sessionsWithUrgency,
      totalIncomplete: sessionsWithUrgency.length,
      criticalSessions: sessionsWithUrgency.filter((s) => s.urgency === "critical").length,
      shouldEnforceFollowUp: sessionsWithUrgency.length > 0,
    })
  } catch (error) {
    console.error("Error fetching follow-up sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, sessionId, reason } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const sessionsCollection = db.collection<AIPluginSession>("ai_plugin_sessions")

    if (action === "enforceFollowUp") {
      // Enable follow-up enforcement for a session
      const result = await sessionsCollection.updateOne(
        {
          sessionId,
          userId: session.user.email,
        },
        {
          $set: {
            followUpEnforced: true,
            followUpReason: reason || "Session requires completion",
            followUpStarted: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          },
        },
      )

      return NextResponse.json({ message: "Follow-up enforcement enabled", updated: result.modifiedCount > 0 })
    }

    if (action === "abandonSession") {
      // Mark session as abandoned (requires confirmation)
      const result = await sessionsCollection.updateOne(
        {
          sessionId,
          userId: session.user.email,
        },
        {
          $set: {
            status: "abandoned",
            abandonedAt: new Date().toISOString(),
            abandonReason: reason || "User abandoned session",
            last_updated: new Date().toISOString(),
          },
        },
      )

      return NextResponse.json({ message: "Session marked as abandoned", updated: result.modifiedCount > 0 })
    }

    if (action === "resumeSession") {
      // Resume an abandoned session
      const result = await sessionsCollection.updateOne(
        {
          sessionId,
          userId: session.user.email,
        },
        {
          $set: {
            status: "active",
            resumedAt: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          },
          $unset: {
            abandonedAt: "",
            abandonReason: "",
          },
        },
      )

      return NextResponse.json({ message: "Session resumed successfully", updated: result.modifiedCount > 0 })
    }

    if (action === "generateReminder") {
      // Generate personalized reminder message
      const pluginSession = await sessionsCollection.findOne({
        sessionId,
        userId: session.user.email,
      })

      if (!pluginSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      const reminder = generateFollowUpReminder(pluginSession)

      return NextResponse.json({ reminder })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error handling follow-up action:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateFollowUpReminder(session: AIPluginSession): {
  title: string
  message: string
  urgency: string
  actions: Array<{ label: string; action: string }>
} {
  const completionPercentage = Math.round((session.currentStep / session.totalSteps) * 100)
  const lastUpdated = new Date(session.last_updated)
  const hoursSinceUpdate = Math.round((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60))

  let urgency: string
  let title: string
  let message: string

  if (hoursSinceUpdate < 1) {
    urgency = "low"
    title = "Continue Your Plugin Development"
    message = `Your "${session.name}" plugin is ${completionPercentage}% complete. You're making great progress!`
  } else if (hoursSinceUpdate < 6) {
    urgency = "medium"
    title = "Don't Lose Your Progress"
    message = `Your "${session.name}" plugin has been waiting for ${hoursSinceUpdate} hours. Let's finish what you started!`
  } else if (hoursSinceUpdate < 24) {
    urgency = "high"
    title = "Your Plugin Needs Attention"
    message = `It's been ${hoursSinceUpdate} hours since you worked on "${session.name}". Your ${completionPercentage}% progress is waiting for you.`
  } else {
    urgency = "critical"
    title = "Complete Your Abandoned Plugin"
    message = `Your "${session.name}" plugin has been abandoned for ${Math.round(hoursSinceUpdate / 24)} days. Don't let your hard work go to waste!`
  }

  const actions = [
    { label: "Resume Session", action: "resume" },
    { label: "View Progress", action: "view" },
  ]

  if (urgency === "critical") {
    actions.push({ label: "Start Over", action: "restart" })
  }

  return { title, message, urgency, actions }
}
