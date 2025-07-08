import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user's servers
    const userServers = await db.collection("user_servers").find({ userId: session.user.id }).toArray()

    // Get bot servers to check which ones have the bot added
    const botServers = await db.collection("bot_servers").find({}).toArray()

    const botServerIds = new Set(botServers.map((server) => server.serverId))

    // Map user servers with bot status
    const servers = userServers.map((server) => ({
      serverId: server.serverId,
      serverName: server.serverName,
      serverIcon: server.serverIcon,
      isBotAdded: botServerIds.has(server.serverId),
      addedAt: server.addedAt,
    }))

    return NextResponse.json({ servers })
  } catch (error) {
    console.error("Error fetching user servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
