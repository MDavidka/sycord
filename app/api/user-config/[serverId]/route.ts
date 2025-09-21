import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let server = user.servers?.find((s: any) => s.server_id === params.serverId)
    let userRole = "owner"

    if (!server) {
      const contributor = await db.collection("server_contributors").findOne({
        serverId: params.serverId,
        userId: session.user.id,
      })

      if (contributor) {
        // Find the server owner and get server config
        const serverOwner = await users.findOne({
          "servers.server_id": params.serverId,
        })

        if (serverOwner) {
          server = serverOwner.servers.find((s: any) => s.server_id === params.serverId)
          userRole = "contributor"
        }
      }
    }

    if (!server) {
      return NextResponse.json({ error: "Server configuration not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        joined_since: user.joined_since,
      },
      server,
      isBotAdded: server.is_bot_added,
      userRole, // Added user role to response
    })
  } catch (error) {
    console.error("Error fetching user config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    const contributor = await db.collection("server_contributors").findOne({
      serverId: params.serverId,
      userId: session.user.id,
    })

    if (contributor) {
      return NextResponse.json({ error: "Contributors cannot modify server configuration" }, { status: 403 })
    }

    // Update the specific server configuration in the user's servers array
    const updateResult = await users.updateOne(
      {
        discordId: session.user.id,
        "servers.server_id": params.serverId,
      },
      {
        $set: {
          "servers.$": {
            ...body.server,
            last_updated: new Date().toISOString(),
          },
        },
      },
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update configuration or server not found" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
