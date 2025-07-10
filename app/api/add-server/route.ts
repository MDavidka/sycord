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

    const { serverId, serverName, serverIcon } = await request.json()

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Server ID and name are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if server already exists for user
    const user = await db.collection("users").findOne({ discordId: session.user.id })

    if (user?.servers?.some((server: any) => server.serverId === serverId)) {
      return NextResponse.json({ error: "Server already added" }, { status: 400 })
    }

    // Add server to user's servers
    const newServer = {
      serverId,
      serverName,
      serverIcon,
      isBotAdded: false, // Default to false
      addedAt: new Date(),
    }

    await db.collection("users").updateOne(
      { discordId: session.user.id },
      {
        $push: { servers: newServer },
        $set: { updatedAt: new Date() },
      },
    )

    return NextResponse.json({
      success: true,
      server: newServer,
      isBotAdded: false,
    })
  } catch (error) {
    console.error("Error adding server:", error)
    return NextResponse.json({ error: "Failed to add server" }, { status: 500 })
  }
}
