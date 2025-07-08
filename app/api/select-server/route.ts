import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import type { ServerSettings } from "@/lib/types"

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

    // Get the user document
    const user = await db.collection("users").findOne({ discordId: session.user.id })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if server already exists in user's servers
    const existingServer = user.servers?.find((server: any) => server.serverId === serverId)

    if (existingServer) {
      return NextResponse.json({ error: "Server already added" }, { status: 400 })
    }

    // Create default server settings
    const defaultSettings: ServerSettings = {
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

    // Add server to user's servers array
    await db.collection("users").updateOne(
      { discordId: session.user.id },
      {
        $push: {
          servers: {
            serverId,
            serverName,
            serverIcon,
            isBotAdded: false,
            addedAt: new Date(),
            settings: defaultSettings,
          },
        },
      },
    )

    console.log(`Server ${serverName} (${serverId}) added for user ${session.user.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error selecting server:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
