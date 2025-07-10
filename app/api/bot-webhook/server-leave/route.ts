import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { serverId, botId } = await request.json()

    if (!serverId || !botId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Update server config to mark bot as removed
    await db.collection("server_configs").updateOne(
      { serverId },
      {
        $set: {
          isBotAdded: false,
          botLeftAt: new Date(),
        },
      },
    )

    // Update all users who have this server
    await db.collection("users").updateMany(
      { "servers.serverId": serverId },
      {
        $set: {
          "servers.$.isBotAdded": false,
        },
      },
    )

    console.log(`Bot left server: ${serverId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error handling bot server leave:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
