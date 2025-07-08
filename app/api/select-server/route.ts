import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId, serverName, serverIcon } = await request.json()

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Update or create user with new server
    await users.updateOne(
      { discordId: session.user.id },
      {
        $setOnInsert: {
          discordId: session.user.id,
          username: session.user.name,
          avatar: session.user.image,
          createdAt: new Date(),
        },
        $addToSet: {
          servers: {
            server_id: serverId,
            server_name: serverName,
            server_icon: serverIcon,
            is_bot_added: false,
            last_updated: new Date(),
          },
        },
        $set: {
          lastLogin: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error selecting server:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
