
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("desh-bot")
    const nodesCollection = db.collection("nodes")

    // Fetch all server nodes
    const nodes = await nodesCollection.find({}).toArray()

    return NextResponse.json({ nodes })
  } catch (error) {
    console.error("Error fetching server nodes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nodeName, cpuLoad, status } = await request.json()

    const client = await clientPromise
    const db = client.db("desh-bot")
    const nodesCollection = db.collection("nodes")

    // Update or insert node data
    await nodesCollection.updateOne(
      { nodeName },
      {
        $set: {
          nodeName,
          cpuLoad,
          status,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating server node:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
