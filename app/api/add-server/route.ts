import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { serverId, serverName, serverIcon } = body

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Server ID and name are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user exists
    const user = await db.collection("users").findOne({ _id: session.user.id })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if server already exists in user's servers
    const existingServer = user.servers?.find((server: any) => server.serverId === serverId)
    if (existingServer) {
      return NextResponse.json({ error: "Server already added" }, { status: 400 })
    }

    // Create default server configuration
    const defaultConfig = {
      serverId,
      serverName,
      serverIcon: serverIcon || null,
      isBotAdded: false,
      moderationLevel: "off",
      rolesAndNames: {},
      channels: {},
      welcome: {
        enabled: false,
        channelId: null,
        message: "Welcome {user} to {server}!",
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
          minAgeDays: 30,
        },
        autoRole: {
          enabled: false,
          roleId: null,
        },
        permissionAbuse: {
          enabled: false,
          notifyOwnerOnRoleChange: false,
          monitorAdminActions: false,
        },
        maliciousBotDetection: {
          enabled: false,
          newBotNotifications: false,
          botActivityMonitoring: false,
          botTimeoutThreshold: 300,
        },
        tokenWebhookAbuse: {
          enabled: false,
          webhookCreationMonitor: false,
          webhookAutoRevoke: false,
          webhookVerificationTimeout: 60,
          leakedWebhookScanner: false,
        },
        inviteHijacking: {
          enabled: false,
          inviteLinkMonitor: false,
          vanityUrlWatcher: false,
        },
        massPingProtection: {
          enabled: false,
          antiMentionFlood: false,
          mentionRateLimit: 5,
          messageCooldownOnRaid: false,
          cooldownDuration: 300,
        },
        maliciousFileScanner: {
          enabled: false,
          suspiciousAttachmentBlocker: false,
          autoFileFilter: false,
          allowedFileTypes: ["jpg", "png", "gif", "pdf"],
        },
      },
      support: {
        ticketSystem: {
          enabled: false,
          channelId: null,
          priorityRoleId: null,
        },
        autoAnswer: {
          enabled: false,
          qaPairs: null,
        },
      },
      giveaway: {
        enabled: false,
        defaultChannelId: null,
      },
      logs: {
        enabled: false,
        channelId: null,
        messageEdits: false,
        modActions: false,
        memberJoins: false,
        memberLeaves: false,
      },
      serverStats: {
        totalMembers: 0,
        totalBots: 0,
        totalAdmins: 0,
      },
      addedAt: new Date(),
      lastUpdated: new Date(),
    }

    // Add server to user's servers array
    await db.collection("users").updateOne(
      { _id: session.user.id },
      {
        $push: { servers: defaultConfig },
        $set: { updatedAt: new Date() },
      },
    )

    // Create server configuration document
    await db.collection("server_configs").insertOne({
      ...defaultConfig,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      message: "Server added successfully",
      isBotAdded: false,
    })
  } catch (error) {
    console.error("Error adding server:", error)
    return NextResponse.json({ error: "Failed to add server" }, { status: 500 })
  }
}
