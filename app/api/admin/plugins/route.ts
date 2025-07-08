import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pluginId, name, description } = await request.json()

    if (!pluginId || !name || !description) {
      return NextResponse.json({ error: "Plugin ID, name and description are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    await db.collection("plugins").updateOne(
      { _id: new ObjectId(pluginId) },
      {
        $set: {
          name,
          description,
          updated_at: new Date().toISOString(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
