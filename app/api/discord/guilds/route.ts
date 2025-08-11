import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Add more detailed logging
    console.log("Fetching Discord guilds for user:", session.user.id)

    // Fetch user's Discord guilds with better error handling
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "User-Agent": "DiscordBot (https://discord.com, 1.0)",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Discord API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })

      // Handle specific Discord API errors
      if (response.status === 401) {
        return NextResponse.json({ error: "Discord token expired. Please log in again." }, { status: 401 })
      }

      throw new Error(`Discord API returned ${response.status}: ${response.statusText}`)
    }

    const guilds = await response.json()

    // Validate the response
    if (!Array.isArray(guilds)) {
      console.error("Invalid guilds response:", guilds)
      throw new Error("Invalid response from Discord API")
    }

    // Filter guilds where user has admin permissions (permission & 0x8)
    const adminGuilds = guilds.filter((guild: any) => {
      // Check if user is owner or has administrator permission
      const hasAdminPerms = (Number.parseInt(guild.permissions) & 0x8) === 0x8
      return guild.owner || hasAdminPerms
    })

    console.log(`Found ${adminGuilds.length} admin guilds out of ${guilds.length} total guilds`)

    return NextResponse.json({ guilds: adminGuilds })
  } catch (error) {
    console.error("Error fetching Discord guilds:", error)

    // Return more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to fetch servers",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 })
  }
}
