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
    const { serverId } = params

    // Get user folder structure: users/[userId]/servers/[serverId]/
    const userCollection = db.collection("users")
    let userData = await userCollection.findOne({ userId: session.user.id })

    if (!userData) {
      // Create user folder structure
      userData = {
        userId: session.user.id,
        servers: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await userCollection.insertOne(userData)
    }

    // Check if server exists in user's folder
    if (!userData.servers || !userData.servers[serverId]) {
      // Create default server settings in user folder structure
      const defaultServerData = {
        serverName: `Server ${serverId}`,
        botStatus: "online",
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
        moderation: {
          moderationLevel: "off",
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
            minAgeDays: 30,
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
            keywords: [
              { word: "hello", reaction: "👋" },
              { word: "thanks", reaction: "❤️" },
            ],
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
          available: [],
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Update user document with new server
      await userCollection.updateOne(
        { userId: session.user.id },
        {
          $set: {
            [`servers.${serverId}`]: defaultServerData,
            updatedAt: new Date(),
          },
        },
      )

      userData.servers = userData.servers || {}
      userData.servers[serverId] = defaultServerData
    }

    return NextResponse.json({
      serverId,
      userId: session.user.id,
      ...userData.servers[serverId],
    })
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
    const { serverId } = params
    const body = await request.json()

    // Remove userId and serverId from body to avoid overwriting
    const { userId, serverId: _, ...serverData } = body

    // Update server settings in user folder structure
    const userCollection = db.collection("users")
    const result = await userCollection.updateOne(
      { userId: session.user.id },
      {
        $set: {
          [`servers.${serverId}`]: {
            ...serverData,
            updatedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
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
