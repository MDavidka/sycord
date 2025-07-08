import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId, serverName, serverIcon } = await request.json()

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if server already exists for this user
    const existingServer = await db.collection("user_servers").findOne({
      userId: session.user.id,
      serverId: serverId,
    })

    if (existingServer) {
      return NextResponse.json({ error: "Server already added" }, { status: 400 })
    }

    // Add server to user's list
    await db.collection("user_servers").insertOne({
      userId: session.user.id,
      serverId: serverId,
      serverName: serverName,
      serverIcon: serverIcon,
      isBotAdded: false,
      addedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error selecting server:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
