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
    const user = await db.collection("users").findOne({ discordId: session.user.id })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const serverIndex = user.servers?.findIndex((server: any) => server.serverId === serverId)

    if (serverIndex === -1) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    const currentStatus = user.servers[serverIndex].isBotAdded

    await db.collection("users").updateOne(
      {
        discordId: session.user.id,
        "servers.serverId": serverId,
      },
      {
        $set: {
          "servers.$.isBotAdded": !currentStatus,
          "servers.$.updatedAt": new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      isBotAdded: !currentStatus,
    })
  } catch (error) {
    console.error("Error toggling bot status:", error)
    return NextResponse.json({ error: "Failed to toggle bot status" }, { status: 500 })
  }
}
