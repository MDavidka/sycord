import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user's saved servers from database
    const user = await db.collection("users").findOne({ discordId: session.user.id })
    const userServers = user?.servers || []

    // Fetch real Discord guilds
    let availableGuilds = []
    try {
      const discordResponse = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })

      if (discordResponse.ok) {
        const guilds = await discordResponse.json()
        // Filter guilds where user has admin permissions
        availableGuilds = guilds.filter((guild: any) => {
          const permissions = Number.parseInt(guild.permissions)
          return (permissions & 0x8) === 0x8 || guild.owner // Administrator permission or owner
        })
      }
    } catch (error) {
      console.error("Error fetching Discord guilds:", error)
    }

    return NextResponse.json({
      availableGuilds,
      userServers,
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
