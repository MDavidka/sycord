import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Count total servers across all users
    const result = await users.aggregate([{ $unwind: "$servers" }, { $count: "totalServers" }]).toArray()

    const count = result.length > 0 ? result[0].totalServers : 0

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error fetching server count:", error)
    return NextResponse.json({ count: 0 })
  }
}
