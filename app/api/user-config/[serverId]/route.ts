import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Find user and their server configuration
    const user = await users.findOne({ discordId: session.user.id })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the specific server configuration
    const servers = user.servers || []
    const serverConfig = servers.find((s: any) => s.server_id === params.serverId)

    if (!serverConfig) {
      return NextResponse.json({ error: "Server configuration not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        joined_since: user.joined_since,
      },
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

    const { server } = await request.json()

    if (!server) {
      return NextResponse.json({ error: "Server configuration is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Update the server configuration
    const result = await users.updateOne(
      {
        discordId: session.user.id,
        "servers.server_id": params.serverId,
      },
      {
        $set: {
          "servers.$": {
            ...server,
            last_updated: new Date().toISOString(),
          },
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Server configuration not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
