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

    // Check if user owns this server
    const server = await db.collection("servers").findOne({
      serverId,
      ownerId: session.user.id,
    })

    if (!server) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Get bot settings
    const botSettings = await db.collection("bot_settings").findOne({ serverId })

    const defaultSettings = {
      name: "Dash",
      avatar: "/bot-icon.png",
      status: "online",
      version: "2.1.0",
    }

    return NextResponse.json({
      settings: botSettings || defaultSettings,
    })
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
    const { settings } = await request.json()
    const { db } = await connectToDatabase()

    // Check if user owns this server
    const server = await db.collection("servers").findOne({
      serverId,
      ownerId: session.user.id,
    })

    if (!server) {
      return NextResponse.json({ error: "Server not found or access denied" }, { status: 404 })
    }

    // Update bot settings
    await db.collection("bot_settings").updateOne(
      { serverId },
      {
        $set: {
          ...settings,
          serverId,
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
