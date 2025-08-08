import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const serverSettingsCollection = db.collection("server_settings")
    const botServersCollection = db.collection("bot_servers")

    // Fetch server settings
    const serverSettings = await serverSettingsCollection.findOne({
      serverId: params.serverId,
      ownerId: session.user.id,
    })

    if (!serverSettings) {
      return NextResponse.json({ error: "Server not found or unauthorized" }, { status: 404 })
    }

    // Check if the bot is added to this server
    const botServerStatus = await botServersCollection.findOne({
      serverId: params.serverId,
      isActive: true,
    })

    // Combine server settings with bot added status
    const serverData = {
      ...serverSettings,
      is_bot_added: !!botServerStatus, // Ensure this boolean is correctly set
    }

    // In a real application, you might fetch more detailed user data
    const userData = {
      name: session.user.name || "User",
      email: session.user.email || "N/A",
      joined_since: "N/A", // Placeholder, fetch from Discord API if needed
    }

    return NextResponse.json({ server: serverData, user: userData })
  } catch (error) {
    console.error("Error fetching user config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const serverSettingsCollection = db.collection("server_settings")

    const body = await request.json()
    const { server: updatedServerConfig } = body

    // Remove _id from the update object to prevent immutable field error
    const { _id, ...updateData } = updatedServerConfig

    const result = await serverSettingsCollection.updateOne(
      { serverId: params.serverId, ownerId: session.user.id },
      { $set: updateData },
      { upsert: true } // Create if not exists
    )

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      return NextResponse.json({ error: "Failed to update server configuration" }, { status: 500 })
    }

    return NextResponse.json({ message: "Server configuration updated successfully" })
  } catch (error) {
    console.error("Error updating user config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
