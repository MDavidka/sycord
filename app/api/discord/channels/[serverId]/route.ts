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

    // Fetch channels from Discord API
    const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })

    if (!response.ok) {
      // If bot token doesn't work, try with user token (limited permissions)
      const userResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error("Failed to fetch Discord channels")
      }

      const channels = await userResponse.json()
      // Filter to only text channels (type 0)
      const textChannels = channels.filter((channel: any) => channel.type === 0)
      return NextResponse.json({ channels: textChannels })
    }

    const channels = await response.json()
    // Filter to only text channels (type 0)
    const textChannels = channels.filter((channel: any) => channel.type === 0)
    return NextResponse.json({ channels: textChannels })
  } catch (error) {
    console.error("Error fetching Discord channels:", error)
    return NextResponse.json({ error: "Failed to fetch channels", channels: [] }, { status: 500 })
  }
}
