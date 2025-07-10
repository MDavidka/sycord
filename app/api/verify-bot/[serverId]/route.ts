import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if bot is added to this server in our database
    const server = await db.collection("servers").findOne({ serverId, userId: session.user.id })

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    // For now, we'll check our database record
    // In a real implementation, you might want to check with Discord API
    const botAdded = server.isBotAdded || false

    return NextResponse.json({
      botAdded,
      serverId,
      serverName: server.serverName,
    })
  } catch (error) {
    console.error("Error verifying bot:", error)
    return NextResponse.json({ error: "Failed to verify bot status" }, { status: 500 })
  }
}
