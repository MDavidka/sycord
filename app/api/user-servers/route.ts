import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user servers from database
    const userServers = await db.collection("servers").find({ userId: session.user.id }).toArray()

    // Transform the data to match the expected format
    const formattedServers = userServers.map((server) => ({
      serverId: server.serverId,
      serverName: server.serverName,
      serverIcon: server.serverIcon,
      isBotAdded: server.isBotAdded || false,
      addedAt: server.addedAt || server.createdAt,
    }))

    return NextResponse.json({
      userServers: formattedServers,
    })
  } catch (error) {
    console.error("Error fetching user servers:", error)
    return NextResponse.json({ error: "Failed to fetch user servers" }, { status: 500 })
  }
}
