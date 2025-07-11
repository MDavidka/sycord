import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { Announcement } from "@/lib/types"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcementsCollection = db.collection<Announcement>("announcements")

    const announcements = await announcementsCollection.find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow specific admin user to create announcements
    if (!session?.user || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcementsCollection = db.collection<Announcement>("announcements")

    const newAnnouncement: Announcement = {
      message,
      createdAt: new Date(),
    }

    const result = await announcementsCollection.insertOne(newAnnouncement)

    return NextResponse.json({ message: "Announcement created", announcementId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow specific admin user to delete announcements
    if (!session?.user || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcementsCollection = db.collection<Announcement>("announcements")

    const result = await announcementsCollection.deleteOne({ _id: new (await import("mongodb")).ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Announcement deleted" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
