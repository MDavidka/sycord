import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user document with servers array
    const user = await db
      .collection("users")
      .findOne({ discordId: session.user.id }, { projection: { servers: 1, username: 1, email: 1, avatar: 1 } })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Format the response
    const userServers = user.servers || []

    // Map to a simpler format for the frontend
    const servers = userServers.map((server: any) => ({
      id: server.serverId,
      name: server.serverName,
      icon: server.serverIcon,
      isBotAdded: server.isBotAdded || false,
      addedAt: server.addedAt,
    }))

    return NextResponse.json({
      user: {
        id: user.discordId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      servers,
    })
  } catch (error) {
    console.error("Error fetching user servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
