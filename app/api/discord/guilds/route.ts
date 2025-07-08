import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's Discord guilds
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch Discord guilds")
    }

    const guilds = await response.json()

    // Filter guilds where user has admin permissions (permission & 0x8)
    const adminGuilds = guilds.filter((guild: any) => {
      return (guild.permissions & 0x8) === 0x8 || guild.owner
    })

    return NextResponse.json({ guilds: adminGuilds })
  } catch (error) {
    console.error("Error fetching Discord guilds:", error)
    return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 })
  }
}
