import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user document
    const user = await db.collection("users").findOne({
      discordId: session.user.id,
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's added servers
    const userServers = user.servers || []

    // Get available guilds (exclude already added servers)
    const addedServerIds = userServers.map((server: any) => server.serverId)
    const availableGuilds = (user.discordGuilds || []).filter((guild: any) => !addedServerIds.includes(guild.id))

    return NextResponse.json({
      availableGuilds,
      userServers,
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
