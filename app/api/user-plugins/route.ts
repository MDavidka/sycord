import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Plugin, UserPlugin } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Assuming user.plugins is an array of UserPlugin
    const installedPlugins: UserPlugin[] = user.plugins || []

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

    const { pluginId } = await request.json()

    if (!pluginId) {
      return NextResponse.json({ error: "Plugin ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection("users")
    const pluginsCollection = db.collection<Plugin>("plugins")

    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const pluginToInstall = await pluginsCollection.findOne({ _id: new ObjectId(pluginId) })
    if (!pluginToInstall) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 })
    }

    // Check if plugin is already installed
    if (user.plugins && user.plugins.some((p: UserPlugin) => p.pluginId === pluginId)) {
      return NextResponse.json({ error: "Plugin already installed" }, { status: 409 })
    }

    const newUserPlugin: UserPlugin = {
      pluginId: pluginToInstall._id.toHexString(),
      name: pluginToInstall.name,
      description: pluginToInstall.description,
      installed_at: new Date().toISOString(),
      iconUrl: pluginToInstall.iconUrl, // Include iconUrl
      thumbnailUrl: pluginToInstall.thumbnailUrl, // Include thumbnailUrl
    }

    await usersCollection.updateOne(
      { email: session.user.email },
      {
        $push: { plugins: newUserPlugin },
      },
    )

    // Increment install count for the plugin
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

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pluginId } = await request.json()

    if (!pluginId) {
      return NextResponse.json({ error: "Plugin ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const usersCollection = db.collection("users")
    const pluginsCollection = db.collection<Plugin>("plugins")

    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await usersCollection.updateOne(
      { email: session.user.email },
      {
        $pull: { plugins: { pluginId: pluginId } },
      },
    )

    // Decrement install count for the plugin
    await pluginsCollection.updateOne({ _id: new ObjectId(pluginId) }, { $inc: { installs: -1 } })

    return NextResponse.json({ message: "Plugin uninstalled successfully" })
  } catch (error) {
    console.error("Error uninstalling plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
