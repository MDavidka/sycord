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

    // Return 'installedPlugins' for consistency with the client-side component
    const installedPlugins = user?.plugins || []

    return NextResponse.json({ installedPlugins })
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

    const body = await request.json()
    const { pluginId, action } = body // Expecting 'action' field

    if (!pluginId || !action) {
      return NextResponse.json({ error: "Plugin ID and action are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection<User>("users")
    const pluginsCollection = db.collection<Plugin>("plugins")

    const user = await usersCollection.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (action === "install") {
      const plugin = await pluginsCollection.findOne({ _id: new ObjectId(pluginId) })

      if (!plugin) {
        return NextResponse.json({ error: "Plugin not found" }, { status: 404 })
      }

      const isPluginInstalled = user.plugins?.some((p) => p.pluginId === pluginId)

      if (isPluginInstalled) {
        return NextResponse.json({ message: "Plugin already installed" }, { status: 200 })
      }

      const newUserPlugin = {
        pluginId: plugin._id.toString(),
        name: plugin.name,
        description: plugin.description,
        installed_at: new Date().toISOString(),
        iconUrl: plugin.iconUrl,
        thumbnailUrl: plugin.thumbnailUrl,
      }

      await usersCollection.updateOne(
        { email: session.user.email },
        { $push: { plugins: newUserPlugin } }, // Use 'plugins' array
      )

      await pluginsCollection.updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: 1 } })

      return NextResponse.json({ message: "Plugin installed successfully" })
    } else if (action === "uninstall") {
      const isPluginInstalled = user.plugins?.some((p) => p.pluginId === pluginId)

      if (!isPluginInstalled) {
        return NextResponse.json({ message: "Plugin not installed" }, { status: 200 })
      }

      await usersCollection.updateOne(
        { email: session.user.email },
        { $pull: { plugins: { pluginId: pluginId } } }, // Use 'plugins' array
      )

      await pluginsCollection.updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: -1 } })

      return NextResponse.json({ message: "Plugin uninstalled successfully" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error managing user plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// The DELETE route is no longer needed as POST handles uninstall
export async function DELETE() {
  return NextResponse.json({ error: "This endpoint is deprecated. Use POST with action 'uninstall'." }, { status: 405 })
}
