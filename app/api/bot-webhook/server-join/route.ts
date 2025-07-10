import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

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

    const { db } = await connectToDatabase()

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
    const updateResult = await db.collection("users").updateMany(
      { "servers.serverId": serverId },
      {
        $set: {
          "servers.$.isBotAdded": true,
          "servers.$.rolesAndNames": rolesAndNames,
          "servers.$.channels": channelsObject,
          "servers.$.serverStats": {
            totalMembers: memberCount || 0,
            totalBots: botCount || 0,
            totalAdmins: adminCount || 0,
          },
          "servers.$.serverName": serverName || undefined,
          "servers.$.serverIcon": serverIcon || undefined,
          "servers.$.lastUpdated": new Date(),
        },
      },
    )

    // Also update server_configs collection
    await db.collection("server_configs").updateMany(
      { serverId },
      {
        $set: {
          isBotAdded: true,
          rolesAndNames: rolesAndNames,
          channels: channelsObject,
          serverStats: {
            totalMembers: memberCount || 0,
            totalBots: botCount || 0,
            totalAdmins: adminCount || 0,
          },
          serverName: serverName || undefined,
          serverIcon: serverIcon || undefined,
          lastUpdated: new Date(),
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
