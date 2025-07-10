import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverId, serverName, serverIcon } = body

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Update the server to mark bot as added
    const result = await db.collection("servers").updateOne(
      { serverId },
      {
        $set: {
          isBotAdded: true,
          serverName: serverName || undefined,
          serverIcon: serverIcon || undefined,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      // Server not found in our database, this might be a new server
      // We could optionally create it here, but for now just return success
      console.log(`Bot joined server ${serverId} but server not found in database`)
    }

    return NextResponse.json({
      success: true,
      message: "Bot join status updated",
    })
  } catch (error) {
    console.error("Error updating bot join status:", error)
    return NextResponse.json({ error: "Failed to update bot status" }, { status: 500 })
  }
}
