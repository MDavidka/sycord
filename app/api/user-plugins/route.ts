import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { User, UserPlugin, Plugin } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection<User>("users")

    const user = await usersCollection.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ installedPlugins: user.downloaded_plugins || [] })
  } catch (error) {
    console.error("Error fetching user plugins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
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

    const plugin = await pluginsCollection.findOne({ _id: new ObjectId(pluginId) })

    if (!plugin) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 })
    }

    const user = await usersCollection.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isPluginInstalled = user.downloaded_plugins?.some((p) => p.pluginId === pluginId)

    if (isPluginInstalled) {
      return NextResponse.json({ message: "Plugin already installed" }, { status: 200 })
    }

    const newUserPlugin: UserPlugin = {
      pluginId: plugin._id.toString(),
      name: plugin.name,
      description: plugin.description,
      installed_at: new Date().toISOString(),
      iconUrl: plugin.iconUrl, // Save iconUrl
      thumbnailUrl: plugin.thumbnailUrl, // Save thumbnailUrl
    }

    await usersCollection.updateOne(
      { email: session.user.email },
      {
        $push: { downloaded_plugins: newUserPlugin },
        $inc: { "plugins.$[elem].installs": 1 }, // Increment installs count on the plugin itself
      },
      { arrayFilters: [{ "elem._id": new ObjectId(pluginId) }] },
    )

    // Increment installs count on the main plugins collection
    await pluginsCollection.updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: 1 } })

    return NextResponse.json({ message: "Plugin installed successfully" })
  } catch (error) {
    console.error("Error installing plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
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

    const isPluginInstalled = user.downloaded_plugins?.some((p) => p.pluginId === pluginId)

    if (!isPluginInstalled) {
      return NextResponse.json({ message: "Plugin not installed" }, { status: 200 })
    }

    await usersCollection.updateOne(
      { email: session.user.email },
      { $pull: { downloaded_plugins: { pluginId: pluginId } } },
    )

    // Decrement installs count on the main plugins collection
    await pluginsCollection.updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: -1 } })

    return NextResponse.json({ message: "Plugin uninstalled successfully" })
  } catch (error) {
    console.error("Error uninstalling plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
