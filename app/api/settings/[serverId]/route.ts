import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { serverId } = params

    // Get server settings from database
    let serverSettings = await db.collection("serverSettings").findOne({
      serverId,
      userId: session.user.id,
    })

    // If no settings exist, create default ones
    if (!serverSettings) {
      const defaultSettings = {
        serverId,
        userId: session.user.id,
        serverName: `Server ${serverId}`,
        settings: {
          moderationLevel: "off",
          linkFilter: {
            enabled: false,
            config: "all_links",
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
            message: "Welcome {user} to {server}!",
            dmEnabled: false,
          },
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

      await db.collection("serverSettings").insertOne(defaultSettings)
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

    const { db } = await connectToDatabase()
    const { serverId } = params
    const body = await request.json()

    // Update server settings
    const result = await db.collection("serverSettings").updateOne(
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
