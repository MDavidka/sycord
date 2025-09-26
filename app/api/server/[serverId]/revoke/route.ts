import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params

    const client = await clientPromise
    const db = client.db("dash-bot")

    // A user can revoke their own contributor access
    const result = await db.collection("server_contributors").deleteOne({
      serverId,
      userId: session.user.id,
      role: "contributor",
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Could not revoke access or you are not a contributor." }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}