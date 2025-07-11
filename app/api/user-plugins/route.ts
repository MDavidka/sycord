import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne({ email: session.user.email }, { projection: { plugins: 1 } })

    const plugins = user?.plugins || []

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error("Error fetching user plugins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pluginId, action } = await request.json()
    const { db } = await connectToDatabase()

    if (action === "install") {
      const plugin = await db.collection("plugins").findOne({ _id: new ObjectId(pluginId) })

      if (!plugin) {
        return NextResponse.json({ error: "Plugin not found" }, { status: 404 })
      }

      await db.collection("users").updateOne(
        { email: session.user.email },
        {
          $addToSet: {
            plugins: {
              pluginId,
              name: plugin.name,
              description: plugin.description,
              installed_at: new Date().toISOString(),
              iconUrl: plugin.iconUrl || null,
              thumbnailUrl: plugin.thumbnailUrl || null,
            },
          },
        },
      )

      await db.collection("plugins").updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: 1 } })
    } else if (action === "uninstall") {
      await db.collection("users").updateOne({ email: session.user.email }, { $pull: { plugins: { pluginId } } })

      await db.collection("plugins").updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: -1 } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error managing user plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
