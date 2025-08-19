import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pluginName, code, serverId, usageInstructions } = body

    if (!pluginName || !code) {
      return NextResponse.json({ error: "Plugin name and code are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")

    const userFolder = session.user.email.replace("@", "_at_").replace(".", "_dot_")
    const folderPath = `users/${userFolder}/servers/${serverId || "default"}/saved-plugins`

    const savedPlugin = {
      name: pluginName,
      code,
      usageInstructions: usageInstructions || "",
      folderPath,
      created_by: session.user.email,
      created_at: new Date().toISOString(),
      serverId: serverId || "default",
    }

    const pluginsCollection = db.collection("saved_plugins")
    const result = await pluginsCollection.insertOne(savedPlugin)

    return NextResponse.json({
      message: "Plugin saved successfully",
      pluginId: result.insertedId,
      folderPath,
    })
  } catch (error) {
    console.error("Error saving plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
