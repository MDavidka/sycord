import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serverId = params.serverId

    // Fetch roles from Discord API
    const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}/roles`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })

    if (!response.ok) {
      // If bot token doesn't work, try with user token (limited permissions)
      const userResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}/roles`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error("Failed to fetch Discord roles")
      }

      const roles = await userResponse.json()
      return NextResponse.json({ roles })
    }

    const roles = await response.json()
    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching Discord roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles", roles: [] }, { status: 500 })
  }
}
