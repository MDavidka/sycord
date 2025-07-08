import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const announcements = db.collection("announcements")

    const result = await announcements.find({ active: true }).sort({ createdAt: -1 }).limit(5).toArray()

    return NextResponse.json({ announcements: result })
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return NextResponse.json({ announcements: [] })
  }
}
