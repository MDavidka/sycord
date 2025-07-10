import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = await request.json()

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Toggle bot status for the server
    const result = await db.collection("users").updateOne(
      {
        discordId: session.user.id,
        "servers.serverId": serverId,
      },
      {
        $set: {
          "servers.$.isBotAdded": true,
          "servers.$.updatedAt": new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling bot status:", error)
    return NextResponse.json({ error: "Failed to update bot status" }, { status: 500 })
  }
}
