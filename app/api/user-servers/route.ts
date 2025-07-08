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

    // Fetch user's servers
    const servers = await db.collection("servers").find({ ownerId: session.user.id }).sort({ createdAt: -1 }).toArray()

    const formattedServers = servers.map((server) => ({
      serverId: server.serverId,
      serverName: server.serverName,
      serverIcon: server.serverIcon,
      isBotAdded: server.isBotAdded,
    }))

    return NextResponse.json({ servers: formattedServers })
  } catch (error) {
    console.error("Error fetching user servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
