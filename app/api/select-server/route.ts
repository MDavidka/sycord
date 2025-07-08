import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId, serverName, serverIcon } = await request.json()

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if server already exists
    const existingServer = await db.collection("servers").findOne({ serverId })

    if (existingServer) {
      return NextResponse.json({ error: "Server already exists" }, { status: 400 })
    }

    // Create server record
    const serverData = {
      serverId,
      serverName,
      serverIcon: serverIcon || null,
      ownerId: session.user.id,
      isBotAdded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("servers").insertOne(serverData)

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
        message: null,
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
      lastUpdated: new Date(),
    }

    await db.collection("server_configs").insertOne(defaultConfig)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error selecting server:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
