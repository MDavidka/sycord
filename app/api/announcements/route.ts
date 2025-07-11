import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcements = db.collection("announcements")

    const allAnnouncements = await announcements.find({}).sort({ createdAt: -1 }).limit(10).toArray()

    return NextResponse.json({ announcements: allAnnouncements })
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcements = db.collection("announcements")

    const newAnnouncement = {
      message: body.message,
      createdAt: new Date(),
      authorEmail: session.user.email,
    }

    const result = await announcements.insertOne(newAnnouncement)

    return NextResponse.json({
      _id: result.insertedId,
      ...newAnnouncement,
    })
  } catch (error) {
    console.error("Error creating announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
