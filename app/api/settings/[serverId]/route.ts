import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("server_settings")
    const { serverId } = params

    // Get server settings from database
    let serverSettings = await settings.findOne({
      serverId,
      userId: session.user.id,
    })

    // If no settings exist, create default ones
    if (!serverSettings) {
      const defaultSettings = {
        serverId,
        userId: session.user.id,
        serverName: `Server ${serverId}`,
        botStatus: "online" as const,
        serverStats: {
          totalMembers: 156,
          totalBots: 3,
          totalAdmins: 8,
        },
        changelog: {
          visible: true,
          title: "Új Sentinel AI funkciók",
          content: "Fejlett moderációs algoritmusok, automatikus spam védelem és intelligens tartalom szűrés.",
          version: "v2.1.0",
          date: "2024. január 15.",
        },
        settings: {
          moderationLevel: "off" as const,
          linkFilter: {
            enabled: false,
            config: "phishing_only" as const,
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
            minAgeDays: 30,
          },
          autoRole: {
            enabled: false,
            roleId: "",
          },
          welcome: {
            enabled: false,
            channelId: "",
            message: "Üdvözlünk {user} a {server} szerveren!",
            dmEnabled: false,
          },
          support: {
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
              keywords: [
                { word: "hello", reaction: "👋" },
                { word: "thanks", reaction: "❤️" },
              ],
            },
          },
          giveaway: {
            enabled: false,
            defaultChannelId: "",
          },
          logs: {
            enabled: false,
            channelId: "",
            messageEdits: false,
            modActions: false,
            memberJoins: false,
            memberLeaves: false,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await settings.insertOne(defaultSettings)
      serverSettings = defaultSettings
    }

    return NextResponse.json(serverSettings)
  } catch (error) {
    console.error("Error fetching server settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("server_settings")
    const { serverId } = params
    const body = await request.json()

    // Update server settings
    const result = await settings.updateOne(
      { serverId, userId: session.user.id },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    if (result.acknowledged) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating server settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
