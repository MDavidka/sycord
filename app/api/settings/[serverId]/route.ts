import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { serverId } = params

    // Get user ID from session
    const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, "_")

    // Try to find existing settings in new structure
    const userDoc = await db.collection("users").findOne({ userId })
    const serverSettings = userDoc?.servers?.[serverId]

    if (serverSettings) {
      return NextResponse.json({
        serverId,
        serverName: serverSettings.serverName || "Unknown Server",
        userId,
        botStatus: serverSettings.botStatus || "online",
        serverStats: serverSettings.serverStats || {
          totalMembers: 0,
          totalBots: 0,
          totalAdmins: 0,
        },
        changelog: serverSettings.changelog || {
          visible: true,
          title: "Új funkciók érkeztek!",
          content: "Frissítettük a moderációs rendszert és hozzáadtunk új beállításokat.",
          version: "v2.1.0",
          date: "2024-01-15",
        },
        moderation: serverSettings.moderation || {
          moderationLevel: "basic",
          linkFilter: {
            enabled: false,
            config: "phishing_only",
            whitelist: [],
          },
          badWordFilter: {
            enabled: false,
            customWords: [],
          },
          raidProtection: {
            enabled: false,
            threshold: 10,
          },
          suspiciousAccounts: {
            enabled: false,
            minAgeDays: 7,
          },
          autoRole: {
            enabled: false,
            roleId: "",
          },
        },
        support: serverSettings.support || {
          welcome: {
            enabled: false,
            channelId: "",
            message: "Üdvözlünk {user} a {server} szerveren!",
            dmEnabled: false,
          },
          ticketSystem: {
            enabled: false,
            channelId: "",
            priorityRoleId: "",
            categories: ["Általános támogatás", "Technikai probléma", "Jelentés", "Egyéb"],
          },
          autoAnswer: {
            enabled: false,
            qaPairs: "",
          },
        },
        events: serverSettings.events || {
          dailyMessages: {
            enabled: false,
            time: "09:00",
            channelId: "",
            message: "Jó reggelt mindenkinek! 🌅",
          },
          joinLeave: {
            enabled: false,
            joinChannelId: "",
            leaveChannelId: "",
            joinMessage: "🎉 {user} csatlakozott a szerverhez!",
            leaveMessage: "👋 {user} elhagyta a szervert.",
          },
          keywordReactions: {
            enabled: false,
            keywords: [],
          },
        },
        integrations: serverSettings.integrations || {
          giveaway: {
            enabled: false,
            defaultChannelId: "",
          },
        },
        plugins: serverSettings.plugins || {
          enabled: [],
          available: ["Zene Bot", "Szavazás Rendszer", "Gazdasági Rendszer"],
        },
        settings: serverSettings.settings || {
          logs: {
            enabled: false,
            channelId: "",
            messageEdits: false,
            modActions: false,
            memberJoins: false,
            memberLeaves: false,
          },
        },
      })
    }

    // Return default settings if none found
    return NextResponse.json({
      serverId,
      serverName: "Unknown Server",
      userId,
      botStatus: "online",
      serverStats: {
        totalMembers: 0,
        totalBots: 0,
        totalAdmins: 0,
      },
      changelog: {
        visible: true,
        title: "Új funkciók érkeztek!",
        content: "Frissítettük a moderációs rendszert és hozzáadtunk új beállításokat.",
        version: "v2.1.0",
        date: "2024-01-15",
      },
      moderation: {
        moderationLevel: "basic",
        linkFilter: {
          enabled: false,
          config: "phishing_only",
          whitelist: [],
        },
        badWordFilter: {
          enabled: false,
          customWords: [],
        },
        raidProtection: {
          enabled: false,
          threshold: 10,
        },
        suspiciousAccounts: {
          enabled: false,
          minAgeDays: 7,
        },
        autoRole: {
          enabled: false,
          roleId: "",
        },
      },
      support: {
        welcome: {
          enabled: false,
          channelId: "",
          message: "Üdvözlünk {user} a {server} szerveren!",
          dmEnabled: false,
        },
        ticketSystem: {
          enabled: false,
          channelId: "",
          priorityRoleId: "",
          categories: ["Általános támogatás", "Technikai probléma", "Jelentés", "Egyéb"],
        },
        autoAnswer: {
          enabled: false,
          qaPairs: "",
        },
      },
      events: {
        dailyMessages: {
          enabled: false,
          time: "09:00",
          channelId: "",
          message: "Jó reggelt mindenkinek! 🌅",
        },
        joinLeave: {
          enabled: false,
          joinChannelId: "",
          leaveChannelId: "",
          joinMessage: "🎉 {user} csatlakozott a szerverhez!",
          leaveMessage: "👋 {user} elhagyta a szervert.",
        },
        keywordReactions: {
          enabled: false,
          keywords: [],
        },
      },
      integrations: {
        giveaway: {
          enabled: false,
          defaultChannelId: "",
        },
      },
      plugins: {
        enabled: [],
        available: ["Zene Bot", "Szavazás Rendszer", "Gazdasági Rendszer"],
      },
      settings: {
        logs: {
          enabled: false,
          channelId: "",
          messageEdits: false,
          modActions: false,
          memberJoins: false,
          memberLeaves: false,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching server settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { serverId } = params
    const settings = await request.json()

    // Get user ID from session
    const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, "_")

    // Update settings in new folder structure: users/[userId]/servers/[serverId]/
    const updateResult = await db.collection("users").updateOne(
      { userId },
      {
        $set: {
          [`servers.${serverId}`]: {
            ...settings,
            lastUpdated: new Date(),
          },
        },
      },
      { upsert: true },
    )

    if (updateResult.acknowledged) {
      return NextResponse.json({ success: true, message: "Settings updated successfully" })
    } else {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating server settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
