import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
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

    let servers = []

    // Get user's own servers
    if (user && user.servers) {
      servers = user.servers.map((server: any) => ({
        serverId: server.server_id,
        serverName: server.server_name,
        serverIcon: server.server_icon,
        isBotAdded: server.is_bot_added,
        lastConfigUpdate: server.last_updated,
        role: "owner", // Added role field to distinguish ownership
      }))
    }

    const contributorServers = await db.collection("server_contributors").find({ userId: session.user.id }).toArray()

    // Get server details for contributor servers
    for (const contributor of contributorServers) {
      const serverOwner = await users.findOne({
        "servers.server_id": contributor.serverId,
      })

      if (serverOwner) {
        const serverData = serverOwner.servers.find((s: any) => s.server_id === contributor.serverId)

        if (serverData) {
          servers.push({
            serverId: serverData.server_id,
            serverName: serverData.server_name,
            serverIcon: serverData.server_icon,
            isBotAdded: serverData.is_bot_added,
            lastConfigUpdate: serverData.last_updated,
            role: "contributor", // Mark as contributor
          })
        }
      }
    }

    return NextResponse.json({ servers })
  } catch (error) {
    console.error("Error fetching user servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
