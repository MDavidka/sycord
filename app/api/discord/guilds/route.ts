import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch guilds")
    }

    const guilds = await response.json()

    // Filter guilds where user has manage server permission
    const manageableGuilds = guilds.filter((guild: any) => {
      const permissions = Number.parseInt(guild.permissions)
      return (permissions & 0x20) === 0x20 || guild.owner // MANAGE_GUILD permission or owner
    })

    return NextResponse.json({ guilds: manageableGuilds })
  } catch (error) {
    console.error("Error fetching Discord guilds:", error)
    return NextResponse.json({ guilds: [] })
  }
}
