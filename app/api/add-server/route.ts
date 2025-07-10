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

    const { serverId, serverName, serverIcon } = await request.json()

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if server already exists in server_configs
    const existingConfig = await db.collection("server_configs").findOne({ serverId })

    let isBotAdded = false

    if (existingConfig) {
      // Server config exists, check if bot is added
      isBotAdded = existingConfig.isBotAdded || false
    } else {
      // Create new server config
      await db.collection("server_configs").insertOne({
        serverId,
        serverName,
        serverIcon,
        isBotAdded: false,
        createdAt: new Date(),
        settings: {
          welcomeChannel: null,
          welcomeMessage: "Welcome to the server!",
          autoRole: null,
          modLogChannel: null,
          prefix: "!",
          enabledPlugins: [],
        },
      })
    }

    // Add server to user's servers list
    const serverData = {
      serverId,
      serverName,
      serverIcon,
      isBotAdded,
      addedAt: new Date(),
    }

    await db.collection("users").updateOne(
      { discordId: session.user.id },
      {
        $addToSet: {
          servers: serverData,
        },
      },
    )

    return NextResponse.json({
      success: true,
      isBotAdded,
      message: isBotAdded ? "Server added and bot is ready!" : "Server added. Please invite the bot to continue.",
    })
  } catch (error) {
    console.error("Error adding server:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
