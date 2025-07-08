import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const client = await clientPromise
    const db = client.db("dash-bot")
    const botSettings = db.collection("bot_settings")

    const settings = await botSettings.findOne({ serverId })

    return NextResponse.json({
      settings: settings || {
        name: "Dash",
        avatar: "/bot-icon.png",
        status: "online",
        version: "2.1.0",
      },
    })
  } catch (error) {
    console.error("Error fetching bot settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const { settings } = await request.json()

    const client = await clientPromise
    const db = client.db("dash-bot")
    const botSettings = db.collection("bot_settings")

    await botSettings.updateOne(
      { serverId },
      { $set: { ...settings, serverId, updatedAt: new Date() } },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating bot settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
