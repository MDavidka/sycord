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

    // Check if user has access to this server
    const userServer = await db.collection("user_servers").findOne({
      userId: session.user.id,
      serverId: serverId,
    })

    if (!userServer) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Get bot settings for this server
    let botSettings = await db.collection("bot_settings").findOne({ serverId })

    if (!botSettings) {
      // Create default bot settings
      const defaultSettings = {
        serverId,
        name: "Dash Bot",
        avatar: "/bot-icon.png",
        status: "online",
        version: "1.0.0",
        updatedAt: new Date(),
      }

      await db.collection("bot_settings").insertOne(defaultSettings)
      botSettings = defaultSettings
    }

    return NextResponse.json({ settings: botSettings })
  } catch (error) {
    console.error("Error fetching bot settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const updates = await request.json()
    const { db } = await connectToDatabase()

    // Check if user has access to this server
    const userServer = await db.collection("user_servers").findOne({
      userId: session.user.id,
      serverId: serverId,
    })

    if (!userServer) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Update bot settings
    await db.collection("bot_settings").updateOne(
      { serverId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating bot settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
