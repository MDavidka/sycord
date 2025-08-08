import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ServerConfig, User } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection<User>("users")
    const serverSettingsCollection = db.collection<ServerConfig>("server_settings")
    const botServersCollection = db.collection("bot_servers")

    // Fetch user data
    const user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch server configuration
    let serverConfig = await serverSettingsCollection.findOne({ server_id: params.serverId })

    // If server config doesn't exist, create a dummy one
    if (!serverConfig) {
      serverConfig = {
        server_id: params.serverId,
        server_name: "Unknown Server", // This should ideally come from Discord API
        is_bot_added: false,
        moderation_level: "off",
        roles_and_names: {},
        channels: {},
        server_stats: {
          total_members: 0,
          total_bots: 0,
          total_admins: 0,
        },
        welcome: { enabled: false },
        moderation: {
          link_filter: { enabled: false, config: "all_links" },
          bad_word_filter: { enabled: false },
          raid_protection: { enabled: false },
          suspicious_accounts: { enabled: false },
          auto_role: { enabled: false },
          permission_abuse: { enabled: false, notify_owner_on_role_change: false, monitor_admin_actions: false },
          malicious_bot_detection: { enabled: false, new_bot_notifications: false, bot_activity_monitoring: false, bot_timeout_threshold: 100 },
          token_webhook_abuse: { enabled: false, webhook_creation_monitor: false, webhook_auto_revoke: false, webhook_verification_timeout: 30, leaked_webhook_scanner: false },
          invite_hijacking: { enabled: false, invite_link_monitor: false, vanity_url_watcher: false },
          mass_ping_protection: { enabled: false, anti_mention_flood: false, mention_rate_limit: 10, message_cooldown_on_raid: false, cooldown_duration: 60 },
          malicious_file_scanner: { enabled: false, suspicious_attachment_blocker: false, auto_file_filter: false },
        },
        support: {
          staff: [],
          reputation_enabled: false,
          max_reputation_score: 20,
          ticket_system: {
            enabled: false,
            embed: { title: "Support Ticket", description: "Click the button below to create a support ticket.", color: "#5865F2", footer: "Support Team" },
            settings: {
              autoAnswer: { enabled: false, qa_pairs: "" },
              blockedUsers: { enabled: false, userIds: [] },
              inactivityClose: { enabled: false, timeoutMinutes: 30 },
              logging: { enabled: false },
            },
          },
        },
        giveaway: { enabled: false },
        logs: { enabled: false, message_edits: false, mod_actions: false, member_joins: false, member_leaves: false },
        invite_tracking: { enabled: false, track_joins: false, track_leaves: false },
        automatic_tasks: { enabled: false, tasks: [] },
        last_updated: new Date().toISOString(),
      }
      // Insert the newly created dummy config
      await serverSettingsCollection.insertOne(serverConfig);
    }

    // Check if the bot is added to this server based on the bot_servers collection
    const botServerStatus = await botServersCollection.findOne({ serverId: params.serverId, isActive: true });
    serverConfig.is_bot_added = !!botServerStatus;

    // Return the user data and server configuration
    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        joined_since: user.joined_since,
      },
      server: serverConfig,
    })
  } catch (error) {
    console.error("Error fetching user and server config:", error)
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
    const serverSettingsCollection = db.collection<ServerConfig>("server_settings")

    const body = await request.json()
    const { server: updatedServerConfig } = body

    if (!updatedServerConfig) {
      return NextResponse.json({ error: "Missing server configuration" }, { status: 400 })
    }

    // Update the server configuration in the database
    const result = await serverSettingsCollection.updateOne(
      { server_id: params.serverId },
      { $set: { ...updatedServerConfig, last_updated: new Date().toISOString() } },
      { upsert: true } // Create if not exists
    )

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      return NextResponse.json({ error: "Server configuration not found or not updated" }, { status: 404 })
    }

    return NextResponse.json({ message: "Server configuration updated successfully", server: updatedServerConfig })
  } catch (error) {
    console.error("Error updating server configuration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
