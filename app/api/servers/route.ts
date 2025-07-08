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
    const settings = db.collection("server_settings")

    // In a real implementation, you'd fetch the user's Discord guilds
    // For now, we'll return mock data
    const userServers = [
      {
        id: "123456789",
        name: "My Awesome Server",
        icon: null,
        owner: true,
        permissions: "8",
      },
    ]

    const serverSettings = await settings
      .find({
        ownerId: session.user.id,
      })
      .toArray()

    return NextResponse.json({
      servers: userServers,
      settings: serverSettings,
    })
  } catch (error) {
    console.error("Error fetching servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
