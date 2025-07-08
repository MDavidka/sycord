import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized - No access token" }, { status: 401 })
    }

    console.log("Fetching Discord guilds for user:", session.user.id)

    // Fetch user's Discord guilds using the access token from session
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "User-Agent": "Dash-Bot/1.0",
      },
    })

    if (!response.ok) {
      console.error("Discord API error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Discord API error details:", errorText)
      return NextResponse.json({ error: "Failed to fetch Discord guilds", details: errorText }, { status: 500 })
    }

    const guilds = await response.json()
    console.log("Fetched guilds count:", guilds.length)

    // Filter guilds where user has admin permissions (ADMINISTRATOR or MANAGE_GUILD)
    const adminGuilds = guilds.filter((guild: any) => {
      const permissions = BigInt(guild.permissions)
      const hasAdmin = (permissions & BigInt(0x8)) === BigInt(0x8) // ADMINISTRATOR
      const hasManageGuild = (permissions & BigInt(0x20)) === BigInt(0x20) // MANAGE_GUILD
      return guild.owner || hasAdmin || hasManageGuild
    })

    console.log("Admin guilds count:", adminGuilds.length)

    return NextResponse.json({ guilds: adminGuilds })
  } catch (error) {
    console.error("Error fetching Discord guilds:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
