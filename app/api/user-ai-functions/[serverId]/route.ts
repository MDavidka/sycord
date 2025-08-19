import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { MongoClient } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db("dash-bot")

    const userFolder = session.user.email.replace(/[^a-zA-Z0-9]/g, "_")
    const plugins = await db
      .collection(`users.${userFolder}.servers.${serverId}.saved-plugins`)
      .find({ userEmail: session.user.email })
      .sort({ created_at: -1 })
      .toArray()

    await client.close()

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error("Get Saved Plugins Error:", error)
    return NextResponse.json({ error: "Failed to get saved plugins" }, { status: 500 })
  }
}
