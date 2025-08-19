import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { MongoClient } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, code, files, serverId, pluginType = "single" } = await request.json()

    if (!name || (!code && !files)) {
      return NextResponse.json({ error: "Name and code/files are required" }, { status: 400 })
    }

    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db("dash-bot")

    const userFolder = session.user.email.replace(/[^a-zA-Z0-9]/g, "_")
    const pluginData = {
      name,
      description,
      code: pluginType === "single" ? code : null,
      files: pluginType === "complex" ? files : null,
      pluginType,
      userEmail: session.user.email,
      userFolder,
      serverId: serverId || "default",
      status: "deployed",
      created_at: new Date(),
      updated_at: new Date(),
    }

    const result = await db
      .collection(`users.${userFolder}.servers.${serverId || "default"}.saved-plugins`)
      .insertOne(pluginData)

    await client.close()

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
