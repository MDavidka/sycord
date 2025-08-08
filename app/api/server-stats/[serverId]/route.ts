
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Find the user and their server data
    const userData = await users.findOne({
      email: session.user.email
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the specific server in user's servers
    const server = userData.server?.find((s: any) => s.server_id === params.serverId)

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    // Return server stats or default values if not available
    const serverStats = {
      total_members: server.server_stats?.total_members || 0,
      total_bots: server.server_stats?.total_bots || 0,
      total_admins: server.server_stats?.total_admins || 0
    }

    return NextResponse.json({ serverStats })
  } catch (error) {
    console.error("Error fetching server stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
