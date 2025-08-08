import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const plugins = await db.collection("plugins").find({ active: true }).sort({ created_at: -1 }).toArray()

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error("Error fetching plugins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const plugin = {
      name,
      description,
      created_by: session.user.email,
      created_at: new Date().toISOString(),
      installs: 0,
      active: true,
    }

    const result = await db.collection("plugins").insertOne(plugin)

    return NextResponse.json({
      success: true,
      plugin: { ...plugin, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pluginId } = await request.json()
    const { db } = await connectToDatabase()

    // Delete the plugin
    await db.collection("plugins").deleteOne({ _id: new ObjectId(pluginId) })

    // Remove plugin from all users who have it installed
    await db.collection("users").updateMany({}, { $pull: { plugins: { pluginId: pluginId } } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
