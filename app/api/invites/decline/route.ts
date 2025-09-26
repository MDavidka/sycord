import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = await request.json()

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")

    await db.collection("server_contributors").deleteOne({
      serverId,
      userId: session.user.id,
      status: "pending",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error declining invite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}