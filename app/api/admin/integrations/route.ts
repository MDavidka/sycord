import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const integrations = db.collection("integrations")

    const result = await integrations.find({}).toArray()

    return NextResponse.json({ integrations: result })
  } catch (error) {
    console.error("Error fetching integrations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, icon, enabled, config } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const integrations = db.collection("integrations")

    const newIntegration = {
      name,
      description,
      icon,
      enabled: enabled || true,
      config: config || {},
      createdAt: new Date(),
    }

    await integrations.insertOne(newIntegration)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating integration:", error)
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
    const integrations = db.collection("integrations")

    await integrations.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
