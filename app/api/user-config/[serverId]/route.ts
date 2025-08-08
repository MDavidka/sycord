import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ServerConfig, User } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot") // Your database name
    const usersCollection = db.collection<User>("users")
    const serverSettingsCollection = db.collection<ServerConfig>("server_settings")

    const user = await usersCollection.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch server settings from the server_settings collection
    let serverConfig = await serverSettingsCollection.findOne({
      serverId: params.serverId,
      ownerId: session.user.id, // Assuming ownerId is stored in server_settings
    })

    // If server settings don't exist, create default ones
    if (!serverConfig) {
      const defaultServerConfig: ServerConfig = {
        server_id: params.serverId,
        server_name: "Unknown Server", // Placeholder, ideally fetched from Discord API
        server_icon: undefined,
        is_bot_added: false, // Default to false, should be updated by bot webhook
        roles_and_names: {},
        channels: {},
        server_stats: {
          total_members: 0,
          total_bots: 0,
          total_admins: 0,
        },
        moderation_level: "off",
        welcome: {
          enabled: false,
        },
        moderation: {
          link_filter: { enabled: false, config: "phishing_only" },
          bad_word_filter: { enabled: false },
          raid_protection: { enabled: false },
          suspicious_accounts: { enabled: false },
          auto_role: { enabled: false },
          permission_abuse: { enabled: false, notify_owner_on_role_change: false, monitor_admin_actions: false },
          malicious_bot_detection: { enabled: false, new_bot_notifications: false, bot_activity_monitoring: false, bot_timeout_threshold: 10 },
          token_webhook_abuse: { enabled: false, webhook_creation_monitor: false, webhook_auto_revoke: false, webhook_verification_timeout: 300, leaked_webhook_scanner: false },
          invite_hijacking: { enabled: false, invite_link_monitor: false, vanity_url_watcher: false },
          mass_ping_protection: { enabled: false, anti_mention_flood: false, mention_rate_limit: 5, message_cooldown_on_raid: false, cooldown_duration: 60 },
          malicious_file_scanner: { enabled: false, suspicious_attachment_blocker: false, auto_file_filter: false },
        },
        support: {
          staff: [],
          ticket_system: { enabled: false, embed: { title: "Support Ticket", description: "Click the button below to create a support ticket.", color: "#5865F2", footer: "Support Team" } },
          auto_answer: { enabled: false },
        },
        giveaway: { enabled: false },
        logs: { enabled: false, message_edits: false, mod_actions: false, member_joins: false, member_leaves: false },
        last_updated: new Date().toISOString(),
        botProfilePictureUrl: "",
        customBotName: "",
        botToken: "",
      }
      await serverSettingsCollection.insertOne(defaultServerConfig as any) // Cast to any to avoid strict type issues with _id
      serverConfig = defaultServerConfig
    }

    return NextResponse.json({ user, server: serverConfig })
  } catch (error) {
    console.error("Error fetching user and server config:", error)
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
    const serverSettingsCollection = db.collection<ServerConfig>("server_settings")

    const updatedServerConfig = body.server as ServerConfig

    const result = await serverSettingsCollection.findOneAndUpdate(
      {
        serverId: params.serverId,
        ownerId: session.user.id,
      },
      {
        $set: {
          ...updatedServerConfig,
          last_updated: new Date().toISOString(),
        },
      },
      { returnDocument: "after", upsert: true },
    )

    if (!result.value) {
      return NextResponse.json({ error: "Failed to update server config" }, { status: 500 })
    }

    return NextResponse.json({ server: result.value })
  } catch (error) {
    console.error("Error updating server config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
