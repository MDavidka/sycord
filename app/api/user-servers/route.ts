import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
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

    if (!user || !user.servers) {
      return NextResponse.json({ servers: [] })
    }

    // Transform the servers array to match the expected format
    const servers = user.servers.map((server: any) => ({
      serverId: server.server_id,
      serverName: server.server_name,
      serverIcon: server.server_icon,
      isBotAdded: server.is_bot_added,
      lastConfigUpdate: server.last_updated,
    }))

    return NextResponse.json({ servers })
  } catch (error) {
    console.error("Error fetching user servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
