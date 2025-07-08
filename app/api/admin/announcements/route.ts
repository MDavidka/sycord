import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcements = db.collection("announcements")

    const result = await announcements.find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ announcements: result })
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, message, type } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcements = db.collection("announcements")

    const newAnnouncement = {
      title,
      message,
      type,
      active: true,
      createdAt: new Date(),
    }

    await announcements.insertOne(newAnnouncement)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, active } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcements = db.collection("announcements")

    await announcements.updateOne({ _id: new ObjectId(id) }, { $set: { active } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
