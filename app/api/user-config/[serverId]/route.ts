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

    // Get user document with the specific server
    const user = await db.collection("users").findOne(
      {
        discordId: session.user.id,
        "servers.serverId": serverId,
      },
      {
        projection: {
          "servers.$": 1,
          username: 1,
          email: 1,
          avatar: 1,
          createdAt: 1,
        },
      },
    )

    if (!user || !user.servers || user.servers.length === 0) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    const server = user.servers[0]

    // Format the response
    const userData = {
      name: user.username,
      email: user.email,
      joined_since: user.createdAt?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json({
      user: userData,
      server: {
        server_id: server.serverId,
        server_name: server.serverName,
        server_icon: server.serverIcon,
        is_bot_added: server.isBotAdded || false,
        added_at: server.addedAt,
        settings: server.settings,
      },
      isBotAdded: server.isBotAdded || false,
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
    const body = await request.json()
    const { db } = await connectToDatabase()

    // Update the server settings in the user document
    const updateResult = await db.collection("users").updateOne(
      {
        discordId: session.user.id,
        "servers.serverId": serverId,
      },
      {
        $set: {
          "servers.$.settings": body.settings,
          "servers.$.lastUpdated": new Date(),
        },
      },
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
