import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId, serverName, serverIcon } = await request.json()

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Create the server configuration object that matches the expected structure
    const serverConfig = {
      server_id: serverId,
      server_name: serverName,
      server_icon: serverIcon || null,
      is_bot_added: false,
      moderation_level: "off",
      roles_and_names: {
        "1": "Member",
        "2": "Moderator",
        "3": "Admin",
      },
      channels: {
        "1": "general",
        "2": "announcements",
        "3": "moderation",
        "4": "tickets",
      },
      server_stats: {
        total_members: 0,
        total_bots: 0,
        total_admins: 0,
      },
      welcome: {
        enabled: false,
        channel_id: "",
        message: "Welcome {user} to {server}! Please read the rules and enjoy your stay.",
        dm_enabled: false,
      },
      moderation: {
        link_filter: {
          enabled: false,
          config: "phishing_only",
          whitelist: [],
        },
        bad_word_filter: {
          enabled: false,
          custom_words: [],
        },
        raid_protection: {
          enabled: false,
          threshold: 10,
        },
        suspicious_accounts: {
          enabled: false,
          min_age_days: 30,
        },
        auto_role: {
          enabled: false,
          role_id: "",
        },
        permission_abuse: {
          enabled: false,
          notify_owner_on_role_change: false,
          monitor_admin_actions: false,
        },
        malicious_bot_detection: {
          enabled: false,
          new_bot_notifications: false,
          bot_activity_monitoring: false,
          bot_timeout_threshold: 10,
        },
        token_webhook_abuse: {
          enabled: false,
          webhook_creation_monitor: false,
          webhook_auto_revoke: false,
          webhook_verification_timeout: 10,
          leaked_webhook_scanner: false,
        },
        invite_hijacking: {
          enabled: false,
          invite_link_monitor: false,
          vanity_url_watcher: false,
        },
        mass_ping_protection: {
          enabled: false,
          anti_mention_flood: false,
          mention_rate_limit: 5,
          message_cooldown_on_raid: false,
          cooldown_duration: 60,
        },
        malicious_file_scanner: {
          enabled: false,
          suspicious_attachment_blocker: false,
          auto_file_filter: false,
          allowed_file_types: ["jpg", "png", "gif", "pdf", "txt"],
        },
      },
      support: {
        ticket_system: {
          enabled: false,
          channel_id: "",
          priority_role_id: "",
        },
        auto_answer: {
          enabled: false,
          qa_pairs: "",
        },
      },
      giveaway: {
        enabled: false,
        default_channel_id: "",
      },
      logs: {
        enabled: false,
        channel_id: "",
        message_edits: false,
        mod_actions: false,
        member_joins: false,
        member_leaves: false,
      },
      last_updated: new Date().toISOString(),
    }

    // Check if user exists
    const existingUser = await users.findOne({ discordId: session.user.id })

    if (!existingUser) {
      // Create new user with the server configuration
      const newUser = {
        discordId: session.user.id,
        name: session.user.name || "Unknown",
        email: session.user.email || "",
        joined_since: new Date().toISOString(),
        servers: [serverConfig], // Add server to servers array
      }

      await users.insertOne(newUser)
      return NextResponse.json({ success: true, server: serverConfig })
    } else {
      // Check if server already exists in user's servers array
      const existingServerIndex = existingUser.servers?.findIndex((s: any) => s.server_id === serverId)

      if (existingServerIndex !== -1) {
        // Server already exists, return existing configuration
        return NextResponse.json({ success: true, server: existingUser.servers[existingServerIndex] })
      }

      // Add new server to existing user's servers array
      await users.updateOne(
        { discordId: session.user.id },
        {
          $push: { servers: serverConfig },
        },
      )

      return NextResponse.json({ success: true, server: serverConfig })
    }
  } catch (error) {
    console.error("Error selecting server:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
