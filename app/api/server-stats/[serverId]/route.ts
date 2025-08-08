
import { NextRequest, NextResponse } from "next/server"
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

    // Find the user and their server data
    const user = await users.findOne(
      { 
        email: session.user.email,
        "servers.server_id": params.serverId 
      },
      {
        projection: {
          "servers.$": 1
        }
      }
    )

    if (!user || !user.servers || user.servers.length === 0) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    const server = user.servers[0]
    const serverStats = server.server_stats || {
      total_members: 0,
      total_bots: 0,
      total_admins: 0
    }

    return NextResponse.json({
      server_stats: serverStats,
      server_name: server.server_name,
      server_icon: server.server_icon
    })
  } catch (error) {
    console.error("Error fetching server stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
