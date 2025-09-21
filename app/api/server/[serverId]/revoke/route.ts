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
    await client.connect()
    const db = client.db("sycord")

    // Remove user from contributors array
    await db.collection("servers").updateOne({ serverId }, { $pull: { contributors: { email: session.user.email } } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking access:", error)
    return NextResponse.json({ error: "Failed to revoke access" }, { status: 500 })
  } finally {
    await client.close()
  }
}
