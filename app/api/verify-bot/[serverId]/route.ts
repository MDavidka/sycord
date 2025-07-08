import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const { db } = await connectToDatabase()

    // Check if bot is in the server
    // This would normally check against a bot API or database
    // For now, we'll simulate this check

    // First, check if user has this server
    const user = await db.collection("users").findOne({
      discordId: session.user.id,
      "servers.serverId": serverId,
    })

    if (!user) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Check if bot is in server (simulated)
    const botInServer = await db.collection("bot_servers").findOne({ serverId })

    if (!botInServer) {
      return NextResponse.json({ isBotInServer: false })
    }

    // Update user's server to mark bot as added
    await db.collection("users").updateOne(
      {
        discordId: session.user.id,
        "servers.serverId": serverId,
      },
      {
        $set: {
          "servers.$.isBotAdded": true,
        },
      },
    )

    return NextResponse.json({ isBotInServer: true })
  } catch (error) {
    console.error("Error verifying bot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
