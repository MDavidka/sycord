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

    // Check if user owns this server
    const server = await db.collection("servers").findOne({
      serverId,
      ownerId: session.user.id,
    })

    if (!server) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Get server configuration
    const config = await db.collection("server_configs").findOne({ serverId })

    if (!config) {
      return NextResponse.json({ error: "Server configuration not found" }, { status: 404 })
    }

    // Format the response to match the expected interface
    const serverConfig = {
      server_id: config.serverId,
      server_name: config.serverName,
      server_icon: config.serverIcon,
      is_bot_added: config.isBotAdded,
      moderation_level: config.moderationLevel,
      roles_and_names: config.rolesAndNames || {},
      channels: config.channels || {},
      welcome: config.welcome,
      moderation: {
        link_filter: config.moderation.linkFilter,
        bad_word_filter: config.moderation.badWordFilter,
        raid_protection: config.moderation.raidProtection,
        suspicious_accounts: config.moderation.suspiciousAccounts,
        auto_role: config.moderation.autoRole,
        permission_abuse: config.moderation.permissionAbuse,
        malicious_bot_detection: config.moderation.maliciousBotDetection,
        token_webhook_abuse: config.moderation.tokenWebhookAbuse,
        invite_hijacking: config.moderation.inviteHijacking,
        mass_ping_protection: config.moderation.massPingProtection,
        malicious_file_scanner: config.moderation.maliciousFileScanner,
      },
      support: config.support,
      giveaway: config.giveaway,
      logs: config.logs,
      server_stats: config.serverStats,
      last_updated: config.lastUpdated,
    }

    const userData = {
      name: session.user.name || "",
      email: session.user.email || "",
      joined_since: server.createdAt?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json({
      user: userData,
      server: serverConfig,
    })
  } catch (error) {
    console.error("Error fetching user config:", error)
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
    const { server } = await request.json()
    const { db } = await connectToDatabase()

    // Check if user owns this server
    const serverRecord = await db.collection("servers").findOne({
      serverId,
      ownerId: session.user.id,
    })

    if (!serverRecord) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Convert the server config back to database format
    const updateData = {
      serverId: server.server_id,
      serverName: server.server_name,
      serverIcon: server.server_icon,
      isBotAdded: server.is_bot_added,
      moderationLevel: server.moderation_level,
      rolesAndNames: server.roles_and_names,
      channels: server.channels,
      welcome: server.welcome,
      moderation: {
        linkFilter: server.moderation.link_filter,
        badWordFilter: server.moderation.bad_word_filter,
        raidProtection: server.moderation.raid_protection,
        suspiciousAccounts: server.moderation.suspicious_accounts,
        autoRole: server.moderation.auto_role,
        permissionAbuse: server.moderation.permission_abuse,
        maliciousBotDetection: server.moderation.malicious_bot_detection,
        tokenWebhookAbuse: server.moderation.token_webhook_abuse,
        inviteHijacking: server.moderation.invite_hijacking,
        massPingProtection: server.moderation.mass_ping_protection,
        maliciousFileScanner: server.moderation.malicious_file_scanner,
      },
      support: server.support,
      giveaway: server.giveaway,
      logs: server.logs,
      serverStats: server.server_stats,
      lastUpdated: new Date(),
    }

    await db.collection("server_configs").updateOne({ serverId }, { $set: updateData })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating server config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
