
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const nodes = db.collection("nodes")

    // Fetch all server nodes
    const serverNodes = await nodes.find({}).toArray()

    // If no nodes exist, create a dummy node
    if (serverNodes.length === 0) {
      const dummyNode = {
        name: "Node-01-Default",
        status: "online",
        cpuLoad: Math.floor(Math.random() * 50) + 10, // Random load between 10-60%
        region: "US-East",
        lastUpdated: new Date(),
        createdAt: new Date(),
      }

      const insertResult = await nodes.insertOne(dummyNode)
      
      return NextResponse.json({
        nodes: [{
          _id: insertResult.insertedId,
          ...dummyNode
        }]
      })
    }

    return NextResponse.json({ nodes: serverNodes })
  } catch (error) {
    console.error("Error fetching server nodes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update server node data (for real-time updates)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { nodeId, cpuLoad, status } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const nodes = db.collection("nodes")

    await nodes.updateOne(
      { _id: nodeId },
      {
        $set: {
          cpuLoad: cpuLoad,
          status: status,
          lastUpdated: new Date(),
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating server node:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
