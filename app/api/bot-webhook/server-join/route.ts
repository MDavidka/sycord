import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverId, serverName, serverIcon, roles, botSecret, channels, memberCount, botCount, adminCount } = body

    // Verify bot secret (you should set this as an environment variable)
    if (botSecret !== process.env.BOT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!serverId) {
      return NextResponse.json({ error: "Missing serverId" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Convert roles array to roles_and_names object
    const rolesAndNames: { [key: string]: string } = {}
    if (roles && Array.isArray(roles)) {
      roles.forEach((role: any) => {
        if (role.id && role.name && role.name !== "@everyone") {
          rolesAndNames[role.id] = role.name
        }
      })
    }

    // Convert channels array to channels object
    const channelsObject: { [key: string]: string } = {}
    if (channels && Array.isArray(channels)) {
      channels.forEach((channel: any) => {
        if (channel.id && channel.name && channel.type === 0) {
          // Text channels only
          channelsObject[channel.id] = channel.name
        }
      })
    }

    // Update all users who have this server
    const updateResult = await users.updateMany(
      { "servers.server_id": serverId },
      {
        $set: {
          "servers.$.is_bot_added": true,
          "servers.$.roles_and_names": rolesAndNames,
          "servers.$.channels": channelsObject,
          "servers.$.server_stats": {
            total_members: memberCount || 0,
            total_bots: botCount || 0,
            total_admins: adminCount || 0,
          },
          "servers.$.server_name": serverName || undefined,
          "servers.$.server_icon": serverIcon || undefined,
          "servers.$.last_updated": new Date().toISOString(),
        },
      },
    )

    console.log(`Updated ${updateResult.modifiedCount} user server entries for server ${serverId}`)

    return NextResponse.json({
      message: "Server status updated successfully",
      modifiedCount: updateResult.modifiedCount,
    })
  } catch (error) {
    console.error("Error updating server status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
