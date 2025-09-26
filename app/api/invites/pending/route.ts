import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")

    const pendingInvites = await db
      .collection("server_contributors")
      .find({
        userId: session.user.id,
        status: "pending",
      })
      .toArray()

    const invitesWithDetails = await Promise.all(
      pendingInvites.map(async (invite) => {
        const server = await db.collection("servers").findOne({ serverId: invite.serverId })
        const inviter = await db.collection("users").findOne({ discordId: invite.invitedBy })
        return {
          ...invite,
          serverName: server?.serverName || "Unknown Server",
          invitedBy: inviter?.username || "Unknown User",
        }
      }),
    )

    return NextResponse.json({ invites: invitesWithDetails })
  } catch (error) {
    console.error("Error fetching pending invites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}