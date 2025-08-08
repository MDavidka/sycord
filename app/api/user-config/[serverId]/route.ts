import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Find user by discordId
    const user = await users.findOne({ discordId: session.user.id })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the specific server in the user's servers array
    const server = user.servers?.find((s: any) => s.server_id === params.serverId)

    if (!server) {
      // Create default server configuration if not found
      const defaultServer = {
        server_id: params.serverId,
        server_name: "Unknown Server",
        server_icon: null,
        is_bot_added: false,
        moderation_level: "off",
        roles_and_names: {},
        channels: {},
        server_stats: {
          total_members: 0,
          total_bots: 0,
          total_admins: 0,
        },
        welcome: {
          enabled: false,
          channel_id: null,
          message: null,
          dm_enabled: false,
        },
        moderation: {
          link_filter: {
            enabled: false,
            config: "phishing_only"
          },
          bad_word_filter: {
            enabled: false,
            custom_words: []
          },
          raid_protection: {
            enabled: false,
            threshold: 10
          },
          suspicious_accounts: {
            enabled: false,
            min_age_days: 30
          },
          auto_role: {
            enabled: false,
            role_id: null
          },
          permission_abuse: {
            enabled: false,
            notify_owner_on_role_change: false,
            monitor_admin_actions: false
          },
          malicious_bot_detection: {
            enabled: false,
            new_bot_notifications: false,
            bot_activity_monitoring: false,
            bot_timeout_threshold: 10
          },
          token_webhook_abuse: {
            enabled: false,
            webhook_creation_monitor: false,
            webhook_auto_revoke: false,
            webhook_verification_timeout: 300,
            leaked_webhook_scanner: false
          },
          invite_hijacking: {
            enabled: false,
            invite_link_monitor: false,
            vanity_url_watcher: false
          },
          mass_ping_protection: {
            enabled: false,
            anti_mention_flood: false,
            mention_rate_limit: 5,
            message_cooldown_on_raid: false,
            cooldown_duration: 60
          },
          malicious_file_scanner: {
            enabled: false,
            suspicious_attachment_blocker: false,
            auto_file_filter: false,
            allowed_file_types: []
          }
        },
        support: {
          staff: [],
          reputation_enabled: false,
          max_reputation_score: 20,
          ticket_system: {
            enabled: false,
            channel_id: null,
            priority_role_id: null,
            embed: {
              title: "Support Ticket",
              description: "Click the button below to create a support ticket.",
              color: "#5865F2",
              footer: "Support Team"
            },
            settings: {
              autoAnswer: { enabled: false, qa_pairs: "" },
              blockedUsers: { enabled: false, userIds: [] },
              inactivityClose: { enabled: false, timeoutMinutes: 30 },
              logging: { enabled: false }
            }
          }
        },
        giveaway: {
          enabled: false,
          default_channel_id: null
        },
        logs: {
          enabled: false,
          channel_id: null,
          message_edits: false,
          mod_actions: false,
          member_joins: false,
          member_leaves: false
        },
        invite_tracking: {
          enabled: false,
          channel_id: null,
          track_joins: false,
          track_leaves: false
        },
        automatic_tasks: {
          enabled: false,
          tasks: []
        },
        last_updated: new Date().toISOString(),
        botProfilePictureUrl: "",
        customBotName: "",
        botToken: ""
      }

      // Add the default server to user's servers array
      await users.updateOne(
        { discordId: session.user.id },
        { $push: { servers: defaultServer } }
      )

      return NextResponse.json({
        user: {
          name: user.name,
          email: user.email,
          joined_since: user.joined_since,
        },
        server: defaultServer,
        isBotAdded: false,
      })
    }

    // Ensure server_stats exists with default values if not present
    if (!server.server_stats) {
      server.server_stats = {
        total_members: 0,
        total_bots: 0,
        total_admins: 0,
      }
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        joined_since: user.joined_since,
      },
      server,
      isBotAdded: server.is_bot_added,
    })
  } catch (error) {
    console.error("Error fetching user config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Update the specific server configuration in the user's servers array
    const updateResult = await users.updateOne(
      {
        discordId: session.user.id,
        "servers.server_id": params.serverId,
      },
      {
        $set: {
          "servers.$": {
            ...body.server,
            last_updated: new Date().toISOString(),
          },
        },
      },
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update configuration or server not found" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
