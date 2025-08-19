import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pluginName, code, serverId, complexFiles } = await request.json()

    if (!pluginName || (!code && !complexFiles)) {
      return NextResponse.json({ error: "Plugin name and code are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const userFolder = session.user.email.split("@")[0] // Use email prefix as user folder
    const folderPath = `dash-bot/users/${userFolder}/servers/${serverId || "default"}/saved-plugins`

    const savedPlugin = {
      pluginName,
      code,
      complexFiles,
      folderPath,
      userId: session.user.email,
      serverId: serverId || "default",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("saved_plugins").insertOne(savedPlugin)

    return NextResponse.json({
      success: true,
      pluginId: result.insertedId,
      folderPath,
    })
  } catch (error) {
    console.error("Error saving plugin:", error)
    return NextResponse.json({ error: "Failed to save plugin" }, { status: 500 })
  }
}
