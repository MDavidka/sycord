import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// This webhook simulates a Discord bot joining a server.
// In a real scenario, this would be an actual webhook endpoint
// configured on your bot to receive events from Discord.
// For demonstration, we'll accept a simple POST request.

export async function POST(request: Request) {
  try {
    const { serverId, serverName, serverIcon, memberCount, botCount, adminCount } = await request.json()

    if (!serverId || !serverName) {
      return NextResponse.json({ message: "Missing serverId or serverName" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const botServersCollection = db.collection("bot_servers")
    const serverSettingsCollection = db.collection("server_settings")

    // Update bot_servers collection to mark bot as added
    await botServersCollection.updateOne(
      { serverId: serverId },
      {
        $set: {
          serverId: serverId,
          serverName: serverName,
          serverIcon: serverIcon || null,
          isActive: true,
          joinedAt: new Date().toISOString(),
        },
      },
      { upsert: true } // Create if not exists, update if exists
    )

    // Update server_settings collection with bot status and initial stats
    await serverSettingsCollection.updateOne(
      { server_id: serverId },
      {
        $set: {
          server_id: serverId,
          server_name: serverName,
          server_icon: serverIcon || null,
          is_bot_added: true,
          last_updated: new Date().toISOString(),
          "server_stats.total_members": memberCount || 0,
          "server_stats.total_bots": botCount || 0,
          "server_stats.total_admins": adminCount || 0,
        },
        $setOnInsert: { // Only set these if the document is being inserted
          moderation_level: "off",
          roles_and_names: {},
          channels: {},
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
        }
      },
      { upsert: true } // Create if not exists, update if exists
    )

    return NextResponse.json({ message: "Bot joined server successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error handling server join webhook:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
