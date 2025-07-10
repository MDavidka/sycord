import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

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

    const { db } = await connectToDatabase()

    // Update all users who have this server
    const updateResult = await db.collection("users").updateMany(
      { "servers.serverId": serverId },
      {
        $set: {
          "servers.$.isBotAdded": false,
          "servers.$.lastUpdated": new Date(),
        },
      },
    )

    // Also update server_configs collection
    await db.collection("server_configs").updateMany(
      { serverId },
      {
        $set: {
          isBotAdded: false,
          lastUpdated: new Date(),
        },
      },
    )

    console.log(`Updated ${updateResult.modifiedCount} user server entries for server ${serverId} (bot left)`)

    return NextResponse.json({
      message: "Server bot status updated successfully",
      modifiedCount: updateResult.modifiedCount,
    })
  } catch (error) {
    console.error("Error updating server bot status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
