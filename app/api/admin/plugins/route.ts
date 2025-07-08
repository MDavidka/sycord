import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const plugins = db.collection("plugins")

    const result = await plugins.find({}).toArray()

    return NextResponse.json({ plugins: result })
  } catch (error) {
    console.error("Error fetching plugins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, version, author, category, enabled } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const plugins = db.collection("plugins")

    const newPlugin = {
      name,
      description,
      version,
      author,
      category,
      enabled: enabled || true,
      createdAt: new Date(),
    }

    await plugins.insertOne(newPlugin)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const plugins = db.collection("plugins")

    await plugins.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
