import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { User, Plugin } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection<User>("users")

    const user = await usersCollection.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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
    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection<User>("users")
    const pluginsCollection = db.collection<Plugin>("plugins")

    if (action === "install") {
      // Get plugin details
      const plugin = await pluginsCollection.findOne({ _id: new ObjectId(pluginId) })

      if (!plugin) {
        return NextResponse.json({ error: "Plugin not found" }, { status: 404 })
      }

      // Add plugin to user's installed plugins
      await db.collection("users").updateOne(
        { email: session.user.email },
        {
          $addToSet: {
            plugins: {
              pluginId: pluginId,
              name: plugin.name,
              description: plugin.description,
              installed_at: new Date().toISOString(),
              iconUrl: plugin.iconUrl,
              thumbnailUrl: plugin.thumbnailUrl,
            },
          },
        },
      )

      // Increment install count
      await db.collection("plugins").updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: 1 } })
    } else if (action === "uninstall") {
      // Remove plugin from user's installed plugins
      await db
        .collection("users")
        .updateOne({ email: session.user.email }, { $pull: { plugins: { pluginId: pluginId } } })

      // Decrement install count
      await db.collection("plugins").updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: -1 } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error managing user plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pluginId } = body

    if (!pluginId) {
      return NextResponse.json({ error: "Plugin ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection<User>("users")
    const pluginsCollection = db.collection<Plugin>("plugins")

    const user = await usersCollection.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isPluginInstalled = user.plugins?.some((p) => p.pluginId === pluginId)

    if (!isPluginInstalled) {
      return NextResponse.json({ message: "Plugin not installed" }, { status: 200 })
    }

    await usersCollection.updateOne({ email: session.user.email }, { $pull: { plugins: { pluginId: pluginId } } })

    // Decrement install count
    await pluginsCollection.updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: -1 } })

    return NextResponse.json({ message: "Plugin uninstalled successfully" })
  } catch (error) {
    console.error("Error uninstalling plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
