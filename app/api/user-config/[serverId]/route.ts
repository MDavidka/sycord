import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const { db } = await connectToDatabase()

    // Check if user has access to this server
    const userServer = await db.collection("user_servers").findOne({
      userId: session.user.id,
      serverId: serverId,
    })

    if (!userServer) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Get server configuration
    let config = await db.collection("server_configs").findOne({ serverId })

    if (!config) {
      // Create default config if none exists
      const defaultConfig = {
        serverId,
        serverName: userServer.serverName,
        serverIcon: userServer.serverIcon,
        isBotAdded: false,
        moderationLevel: "off",
        rolesAndNames: {},
        channels: {},
        welcome: {
          enabled: false,
          channelId: "",
          message: "Welcome to the server!",
          dmEnabled: false,
        },
        moderation: {
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
          permissionAbuse: {
            enabled: false,
            notifyOwnerOnRoleChange: true,
            monitorAdminActions: true,
          },
          maliciousBotDetection: {
            enabled: false,
            newBotNotifications: true,
            botActivityMonitoring: true,
            botTimeoutThreshold: 300,
          },
          tokenWebhookAbuse: {
            enabled: false,
            webhookCreationMonitor: true,
            webhookAutoRevoke: true,
            webhookVerificationTimeout: 60,
            leakedWebhookScanner: true,
          },
          inviteHijacking: {
            enabled: false,
            inviteLinkMonitor: true,
            vanityUrlWatcher: true,
          },
          massPingProtection: {
            enabled: false,
            antiMentionFlood: true,
            mentionRateLimit: 5,
            messageCooldownOnRaid: true,
            cooldownDuration: 300,
          },
          maliciousFileScanner: {
            enabled: false,
            suspiciousAttachmentBlocker: true,
            autoFileFilter: true,
            allowedFileTypes: ["jpg", "jpeg", "png", "gif", "pdf", "txt"],
          },
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
          messageEdits: true,
          modActions: true,
          memberJoins: true,
          memberLeaves: true,
        },
        lastUpdated: new Date(),
      }

      await db.collection("server_configs").insertOne(defaultConfig)
      config = defaultConfig
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error fetching server config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const updates = await request.json()
    const { db } = await connectToDatabase()

    // Check if user has access to this server
    const userServer = await db.collection("user_servers").findOne({
      userId: session.user.id,
      serverId: serverId,
    })

    if (!userServer) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Update server configuration
    await db.collection("server_configs").updateOne(
      { serverId },
      {
        $set: {
          ...updates,
          lastUpdated: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating server config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
