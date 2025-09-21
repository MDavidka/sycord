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

    // Get server members with admin access
    const serverMembers = await db
      .collection("server_members")
      .find({
        serverId: serverId,
        hasAdminAccess: true,
      })
      .toArray()

    return NextResponse.json({ members: serverMembers })
  } catch (error) {
    console.error("Error fetching server members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
