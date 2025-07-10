import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { serverId, serverName, serverIcon } = body

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Server ID and name are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if server already exists for this user
    const existingServer = await db.collection("servers").findOne({ serverId, userId: session.user.id })

    if (existingServer) {
      return NextResponse.json({ error: "Server already added" }, { status: 400 })
    }

    // Add server to database
    const serverData = {
      serverId,
      serverName,
      serverIcon: serverIcon || null,
      userId: session.user.id,
      isBotAdded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("servers").insertOne(serverData)

    return NextResponse.json({
      success: true,
      message: "Server added successfully",
    })
  } catch (error) {
    console.error("Error adding server:", error)
    return NextResponse.json({ error: "Failed to add server" }, { status: 500 })
  }
}
