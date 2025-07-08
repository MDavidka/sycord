import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const servers = db.collection("bot_servers")

    const count = await servers.countDocuments()

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error fetching server count:", error)
    return NextResponse.json({ count: 0 })
  }
}
