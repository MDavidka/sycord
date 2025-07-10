import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("server_settings")

    const serverSettings = await settings.findOne({
      serverId: params.serverId,
      userId: session.user.id,
    })

    if (!serverSettings) {
      // Return default settings if none exist
      const defaultSettings = {
        serverId: params.serverId,
        serverName: "Server Configuration",
        userId: session.user.id,
        settings: {
          // General Settings
          moderationLevel: "off",

          // Moderation Settings
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

          // Welcome Settings
          welcome: {
            enabled: false,
            channelId: "",
            message: "Welcome {user} to {server}!",
            dmEnabled: false,
          },

          // Support Settings
          support: {
            ticketSystem: {
              enabled: false,
              channelId: "",
              priorityRoleId: "",
            },
            autoAnswer: {
              enabled: false,
              qaPairs: "",
            },
          },

          // Giveaway Settings
          giveaway: {
            enabled: false,
            defaultChannelId: "",
          },

          // Logging Settings
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
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(serverSettings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("server_settings")

    const updatedSettings = await settings.findOneAndUpdate(
      {
        serverId: params.serverId,
        userId: session.user.id,
      },
      {
        $set: {
          settings: body.settings,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after", upsert: true },
    )

    return NextResponse.json(updatedSettings.value)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
