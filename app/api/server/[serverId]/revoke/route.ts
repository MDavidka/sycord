import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function POST(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const body = await request.json()
    const { email } = body

    await client.connect()
    const db = client.db("sycord")

    const server = await db.collection("servers").findOne({ serverId })
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    // Check if current user is owner or admin
    const isOwner = server.userId === session.user.email
    const isAdmin = session.user.email === "dmarton336@gmail.com"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Only server owners can revoke access" }, { status: 403 })
    }

    const emailToRevoke = email || session.user.email
    await db.collection("servers").updateOne({ serverId }, { $pull: { contributors: { email: emailToRevoke } } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking access:", error)
    return NextResponse.json({ error: "Failed to revoke access" }, { status: 500 })
  } finally {
    await client.close()
  }
}
