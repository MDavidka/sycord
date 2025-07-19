
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
    const db = client.db("dash-bot")
    const nodes = db.collection("nodes")

    // Get all server nodes with their current stats
    const serverNodes = await nodes.find({}).toArray()

    // If no nodes exist, create some dummy data
    if (serverNodes.length === 0) {
      const dummyNodes = [
        {
          nodeId: "node-01-us-east",
          nodeName: "Node-01-US-East",
          region: "US-East",
          status: "online",
          cpuLoad: Math.random() * 30 + 10, // 10-40%
          memoryUsage: Math.random() * 40 + 20, // 20-60%
          lastUpdated: new Date(),
          createdAt: new Date()
        },
        {
          nodeId: "node-02-eu-west",
          nodeName: "Node-02-EU-West",
          region: "EU-West",
          status: "warning",
          cpuLoad: Math.random() * 20 + 70, // 70-90%
          memoryUsage: Math.random() * 30 + 60, // 60-90%
          lastUpdated: new Date(),
          createdAt: new Date()
        },
        {
          nodeId: "node-03-asia-pacific",
          nodeName: "Node-03-Asia-Pacific",
          region: "Asia-Pacific",
          status: "critical",
          cpuLoad: Math.random() * 10 + 90, // 90-100%
          memoryUsage: Math.random() * 20 + 80, // 80-100%
          lastUpdated: new Date(),
          createdAt: new Date()
        }
      ]

      await nodes.insertMany(dummyNodes)
      return NextResponse.json({ nodes: dummyNodes })
    }

    return NextResponse.json({ nodes: serverNodes })
  } catch (error) {
    console.error("Error fetching server monitoring data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const nodes = db.collection("nodes")

    // Update all nodes with new random stats to simulate real-time monitoring
    const updates = await Promise.all([
      nodes.updateOne(
        { nodeId: "node-01-us-east" },
        {
          $set: {
            cpuLoad: Math.random() * 30 + 10,
            memoryUsage: Math.random() * 40 + 20,
            status: Math.random() > 0.8 ? "warning" : "online",
            lastUpdated: new Date()
          }
        }
      ),
      nodes.updateOne(
        { nodeId: "node-02-eu-west" },
        {
          $set: {
            cpuLoad: Math.random() * 20 + 70,
            memoryUsage: Math.random() * 30 + 60,
            status: Math.random() > 0.7 ? "critical" : "warning",
            lastUpdated: new Date()
          }
        }
      ),
      nodes.updateOne(
        { nodeId: "node-03-asia-pacific" },
        {
          $set: {
            cpuLoad: Math.random() * 10 + 90,
            memoryUsage: Math.random() * 20 + 80,
            status: Math.random() > 0.9 ? "offline" : "critical",
            lastUpdated: new Date()
          }
        }
      )
    ])

    // Get updated nodes
    const updatedNodes = await nodes.find({}).toArray()

    return NextResponse.json({ 
      message: "Node stats updated successfully",
      nodes: updatedNodes,
      updatedCount: updates.reduce((acc, update) => acc + update.modifiedCount, 0)
    })
  } catch (error) {
    console.error("Error updating server monitoring data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
