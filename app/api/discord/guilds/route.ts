import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's access token from the database
    const { connectToDatabase } = await import("@/lib/mongodb")
    const { db } = await connectToDatabase()

    const account = await db.collection("accounts").findOne({
      userId: session.user.id,
      provider: "discord",
    })

    if (!account?.access_token) {
      return NextResponse.json({ error: "No Discord access token found" }, { status: 400 })
    }

    // Fetch user's Discord guilds
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch Discord guilds" }, { status: 500 })
    }

    const guilds = await response.json()

    // Filter guilds where user has admin permissions
    const adminGuilds = guilds.filter((guild: any) => {
      const permissions = Number.parseInt(guild.permissions)
      return (permissions & 0x8) === 0x8 || guild.owner // ADMINISTRATOR permission or owner
    })

    return NextResponse.json({ guilds: adminGuilds })
  } catch (error) {
    console.error("Error fetching Discord guilds:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
