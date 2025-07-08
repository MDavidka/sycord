import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("system_settings")

    const result = await settings.findOne({ key: "maintenance" })

    return NextResponse.json({ enabled: result?.enabled || false })
  } catch (error) {
    console.error("Error fetching maintenance status:", error)
    return NextResponse.json({ enabled: false })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("system_settings")

    await settings.updateOne(
      { key: "maintenance" },
      { $set: { key: "maintenance", enabled, updatedAt: new Date() } },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating maintenance status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
