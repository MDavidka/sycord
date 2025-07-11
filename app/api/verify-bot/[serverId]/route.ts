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
    const botServers = db.collection("bot_servers")

    // Check if bot is added to this server
    const botServer = await botServers.findOne({
      serverId: params.serverId,
      isActive: true,
    })

    return NextResponse.json({
      botAdded: !!botServer,
      serverInfo: botServer || null,
    })
  } catch (error) {
    console.error("Error verifying bot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
