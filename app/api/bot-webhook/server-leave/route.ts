import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverId, botSecret } = body

    // Verify bot secret
    if (botSecret !== process.env.BOT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!serverId) {
      return NextResponse.json({ error: "Missing serverId" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const userServers = db.collection("user_servers")

    // Update all user server entries for this server to mark bot as removed
    const updateResult = await userServers.updateMany(
      { serverId: serverId },
      {
        $set: {
          isBotAdded: false,
          botJoinedAt: null,
        },
      },
    )

    console.log(`Updated ${updateResult.modifiedCount} user server entries for server ${serverId} (bot left)`)

    return NextResponse.json({
      message: "Server status updated successfully",
      modifiedCount: updateResult.modifiedCount,
    })
  } catch (error) {
    console.error("Error updating server status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
