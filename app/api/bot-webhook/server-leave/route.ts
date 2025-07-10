import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverId } = body

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Update the server to mark bot as removed
    const result = await db.collection("servers").updateOne(
      { serverId },
      {
        $set: {
          isBotAdded: false,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      console.log(`Bot left server ${serverId} but server not found in database`)
    }

    return NextResponse.json({
      success: true,
      message: "Bot leave status updated",
    })
  } catch (error) {
    console.error("Error updating bot leave status:", error)
    return NextResponse.json({ error: "Failed to update bot status" }, { status: 500 })
  }
}
