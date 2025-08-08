import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const users = db.collection("users")

    // Find the user and their server data
    const user = await users.findOne({
      discordId: session.user.id,
      "servers.server_id": params.serverId
    })

    if (!user) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    // Find the specific server in the user's servers array
    const server = user.servers.find((s: any) => s.server_id === params.serverId)

    if (!server || !server.server_stats) {
      return NextResponse.json({
        server_stats: {
          total_members: 0,
          total_bots: 0,
          total_admins: 0
        }
      })
    }

    return NextResponse.json({
      server_stats: server.server_stats
    })
  } catch (error) {
    console.error("Error fetching server stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { server_stats } = body

    const { db } = await connectToDatabase()
    const users = db.collection("users")

    // Update the server stats for the specific server
    const result = await users.updateOne(
      {
        discordId: session.user.id,
        "servers.server_id": params.serverId
      },
      {
        $set: {
          "servers.$.server_stats": server_stats
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, server_stats })
  } catch (error) {
    console.error("Error updating server stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
