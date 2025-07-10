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
    const user = await db.collection("users").findOne({ _id: session.user.id })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's added servers
    const userServers = user.servers || []

    // Get available guilds from user's Discord data (stored during login)
    const availableGuilds = user.discordGuilds || []

    // Filter available guilds to exclude already added servers
    const addedServerIds = new Set(userServers.map((server: any) => server.serverId))
    const filteredAvailableGuilds = availableGuilds.filter(
      (guild: any) => !addedServerIds.has(guild.id) && (guild.permissions & 0x20) === 0x20, // MANAGE_GUILD permission
    )

    return NextResponse.json({
      userServers,
      availableGuilds: filteredAvailableGuilds,
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
