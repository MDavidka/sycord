import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.accessToken) {
      console.error("Unauthorized: No session or access token found.")
      return NextResponse.json({ error: "Unauthorized: Please log in again." }, { status: 401 })
    }

    console.log("Fetching Discord guilds for user:", session.user.id)
    console.log("Using access token (first 5 chars):", session.accessToken.substring(0, 5) + "...")

    // Fetch user's Discord guilds using the access token from session
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "User-Agent": "Dash-Bot/1.0", // Good practice to include a User-Agent
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Discord API error:", response.status, response.statusText, "Details:", errorText)
      // Check for specific Discord API errors, e.g., invalid token
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Discord API Unauthorized: Invalid or expired token. Please re-login." },
          { status: 401 },
        )
      }
      return NextResponse.json({ error: "Failed to fetch Discord guilds", details: errorText }, { status: 500 })
    }

    const guilds = await response.json()
    console.log("Fetched guilds count from Discord API:", guilds.length)

    // Filter guilds where user has admin permissions (ADMINISTRATOR or MANAGE_GUILD)
    const adminGuilds = guilds.filter((guild: any) => {
      const permissions = BigInt(guild.permissions)
      const hasAdmin = (permissions & BigInt(0x8)) === BigInt(0x8) // ADMINISTRATOR (1 << 3)
      const hasManageGuild = (permissions & BigInt(0x20)) === BigInt(0x20) // MANAGE_GUILD (1 << 5)
      return guild.owner || hasAdmin || hasManageGuild
    })

    console.log("Admin guilds count after filtering:", adminGuilds.length)

    return NextResponse.json({ guilds: adminGuilds })
  } catch (error) {
    console.error("Error fetching Discord guilds:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
