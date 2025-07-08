import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const botServers = db.collection("bot_servers")

    // Get all servers where the bot is added
    const servers = await botServers.find({ isActive: true }).toArray()

    return NextResponse.json({ servers })
  } catch (error) {
    console.error("Error fetching bot servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
