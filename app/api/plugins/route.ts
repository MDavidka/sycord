import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { Plugin } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const pluginsCollection = db.collection<Plugin>("plugins")

    const plugins = await pluginsCollection.find({}).toArray()

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error("Error fetching plugins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email === "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, iconUrl, thumbnailUrl } = body

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const pluginsCollection = db.collection<Plugin>("plugins")

    const newPlugin: Plugin = {
      name,
      description,
      created_by: session.user.email,
      created_at: new Date().toISOString(),
      installs: 0,
      active: true,
      iconUrl: iconUrl || "",
      thumbnailUrl: thumbnailUrl || "",
    }

    const result = await pluginsCollection.insertOne(newPlugin)

    return NextResponse.json({ message: "Plugin created successfully", pluginId: result.insertedId })
  } catch (error) {
    console.error("Error creating plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email === "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { _id, name, description, active, iconUrl, thumbnailUrl } = body

    if (!_id) {
      return NextResponse.json({ error: "Plugin ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const pluginsCollection = db.collection<Plugin>("plugins")

    const updateDoc: Partial<Plugin> = {
      name,
      description,
      active,
      iconUrl,
      thumbnailUrl,
    }

    const result = await pluginsCollection.updateOne(
      { _id: new (await import("mongodb")).ObjectId(_id) },
      { $set: updateDoc },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Plugin updated successfully" })
  } catch (error) {
    console.error("Error updating plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
