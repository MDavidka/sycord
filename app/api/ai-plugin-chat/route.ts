import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { AIPluginSession, AIPluginMessage, PipelineStep } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    const client = await clientPromise
    const db = client.db("dash-bot")
    const sessionsCollection = db.collection<AIPluginSession>("ai_plugin_sessions")

    if (sessionId) {
      // Get specific session
      const pluginSession = await sessionsCollection.findOne({
        sessionId,
        userId: session.user.email,
      })

      if (!pluginSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      return NextResponse.json({ session: pluginSession })
    } else {
      // Get all user sessions
      const sessions = await sessionsCollection
        .find({ userId: session.user.email })
        .sort({ last_updated: -1 })
        .toArray()

      return NextResponse.json({ sessions })
    }
  } catch (error) {
    console.error("Error fetching AI plugin sessions:", error)
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
    const { action, sessionId, message, stepUpdate } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const sessionsCollection = db.collection<AIPluginSession>("ai_plugin_sessions")

    if (action === "createSession") {
      // Create new AI plugin generation session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const initialPipeline: PipelineStep[] = [
        { id: "information", name: "Information", status: "pending", progress: 0 },
        { id: "planning", name: "Planning", status: "pending", progress: 0 },
        { id: "generation", name: "Code Generation", status: "pending", progress: 0 },
        { id: "debugging", name: "Bug Finding", status: "pending", progress: 0 },
        { id: "finishing", name: "Finishing", status: "pending", progress: 0 },
      ]

      const newSession: AIPluginSession = {
        sessionId: newSessionId,
        userId: session.user.email,
        name: body.name || "New Plugin",
        description: body.description || "",
        status: "active",
        currentStep: 0,
        totalSteps: 5,
        pipeline: initialPipeline,
        messages: [],
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        followUpEnforced: false,
      }

      const result = await sessionsCollection.insertOne(newSession)

      return NextResponse.json({
        message: "Session created successfully",
        session: { ...newSession, _id: result.insertedId },
      })
    }

    if (action === "addMessage") {
      // Add message to existing session
      const newMessage: AIPluginMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: message.role,
        content: message.content,
        marks: message.marks || [],
        timestamp: new Date().toISOString(),
        stepId: message.stepId,
      }

      const result = await sessionsCollection.updateOne(
        {
          sessionId,
          userId: session.user.email,
        },
        {
          $push: { messages: newMessage },
          $set: { last_updated: new Date().toISOString() },
        },
      )

      return NextResponse.json({
        message: "Message added successfully",
        messageId: newMessage.id,
      })
    }

    if (action === "updatePipeline") {
      // Update pipeline step status
      const result = await sessionsCollection.updateOne(
        {
          sessionId,
          userId: session.user.email,
          "pipeline.id": stepUpdate.stepId,
        },
        {
          $set: {
            "pipeline.$.status": stepUpdate.status,
            "pipeline.$.progress": stepUpdate.progress,
            "pipeline.$.startTime": stepUpdate.startTime,
            "pipeline.$.endTime": stepUpdate.endTime,
            currentStep: stepUpdate.currentStep,
            last_updated: new Date().toISOString(),
          },
        },
      )

      return NextResponse.json({ message: "Pipeline updated successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error handling AI plugin chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, action, data } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const sessionsCollection = db.collection<AIPluginSession>("ai_plugin_sessions")

    if (action === "completeSession") {
      // Mark session as completed and save generated code
      const result = await sessionsCollection.updateOne(
        {
          sessionId,
          userId: session.user.email,
        },
        {
          $set: {
            status: "completed",
            generatedCode: data.code,
            pluginMetadata: data.metadata,
            last_updated: new Date().toISOString(),
          },
        },
      )

      return NextResponse.json({ message: "Session completed successfully" })
    }

    if (action === "enforceFollowUp") {
      // Enable follow-up enforcement for session continuation
      const result = await sessionsCollection.updateOne(
        {
          sessionId,
          userId: session.user.email,
        },
        {
          $set: {
            followUpEnforced: true,
            last_updated: new Date().toISOString(),
          },
        },
      )

      return NextResponse.json({ message: "Follow-up enforcement enabled" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating AI plugin session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
