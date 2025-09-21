import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const client = await clientPromise
    const db = client.db("dash-bot")

    const [serverMembers, contributors] = await Promise.all([
      db
        .collection("server_members")
        .find({
          serverId: serverId,
          hasAdminAccess: true,
        })
        .toArray(),
      db
        .collection("server_contributors")
        .find({
          serverId: serverId,
        })
        .toArray(),
    ])

    return NextResponse.json({
      members: serverMembers,
      contributors: contributors,
    })
  } catch (error) {
    console.error("Error fetching server members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
