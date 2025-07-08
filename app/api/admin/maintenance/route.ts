import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const settings = await db.collection("settings").findOne({ key: "maintenance" })

    return NextResponse.json({ maintenance: settings?.value || false })
  } catch (error) {
    console.error("Error fetching maintenance status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { maintenance } = await request.json()
    const { db } = await connectToDatabase()

    await db
      .collection("settings")
      .updateOne(
        { key: "maintenance" },
        { $set: { key: "maintenance", value: maintenance, updated_at: new Date().toISOString() } },
        { upsert: true },
      )

    return NextResponse.json({ success: true, maintenance })
  } catch (error) {
    console.error("Error updating maintenance status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
