import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { DiscordGuild } from "@/lib/types"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      console.error("No access token found in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's Discord guilds
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      console.error(`Discord API error: ${response.status} ${response.statusText}`)

      if (response.status === 401) {
        return NextResponse.json({ error: "Discord token expired. Please log in again." }, { status: 401 })
      }

      return NextResponse.json({ error: "Failed to fetch Discord guilds" }, { status: response.status })
    }

    const guilds: DiscordGuild[] = await response.json()

    // Filter guilds where user has admin permissions
    // Permission 0x8 is ADMINISTRATOR, 0x20 is MANAGE_GUILD
    const adminGuilds = guilds.filter((guild) => {
      const permissions = BigInt(guild.permissions)
      return (
        guild.owner ||
        (permissions & BigInt(0x8)) === BigInt(0x8) || // ADMINISTRATOR
        (permissions & BigInt(0x20)) === BigInt(0x20) // MANAGE_GUILD
      )
    })

    return NextResponse.json(adminGuilds)
  } catch (error) {
    console.error("Error fetching Discord guilds:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
