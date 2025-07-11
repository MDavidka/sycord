import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")
    const botServers = db.collection("bot_servers")

    // Find user
    const user = await users.findOne({ discordId: session.user.id })

    if (!user || !user.servers) {
      return NextResponse.json({ servers: [] })
    }

    // Check bot status for each server
    const serversWithBotStatus = await Promise.all(
      user.servers.map(async (server: any) => {
        const botServer = await botServers.findOne({
          serverId: server.server_id,
          isActive: true,
        })

        return {
          serverId: server.server_id,
          serverName: server.server_name,
          serverIcon: server.server_icon,
          isBotAdded: !!botServer,
          lastConfigUpdate: server.last_updated,
        }
      }),
    )

    return NextResponse.json({ servers: serversWithBotStatus })
  } catch (error) {
    console.error("Error fetching user servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
