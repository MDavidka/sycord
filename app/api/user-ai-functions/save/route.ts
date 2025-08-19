import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pluginName, code, serverId, usageInstructions, isComplexTask, files } = await request.json()

    if (!pluginName || !serverId) {
      return NextResponse.json({ error: "Plugin name and server ID are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const userFolder = session.user.email.split("@")[0] // Use email prefix as user folder
    const pluginData = {
      name: pluginName,
      code: code || "",
      usageInstructions: usageInstructions || "",
      isComplexTask: isComplexTask || false,
      files: files || [],
      serverId,
      userFolder,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save to MongoDB with folder structure path
    const result = await db.collection("saved-plugins").insertOne({
      ...pluginData,
      folderPath: `dash-bot/users/${userFolder}/servers/${serverId}/saved-plugins`,
    })

    return NextResponse.json({
      success: true,
      pluginId: result.insertedId,
      message: "Plugin saved successfully",
    })
  } catch (error) {
    console.error("Save Plugin Error:", error)
    return NextResponse.json({ error: "Failed to save plugin" }, { status: 500 })
  }
}
