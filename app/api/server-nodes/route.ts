
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const nodes = await db.collection("nodes").find({}).toArray()

    // If no nodes exist, create a dummy node
    if (nodes.length === 0) {
      const dummyNode = {
        name: "Node-01-US-East",
        status: "online",
        cpuLoad: 24.5,
        memoryUsage: 45.2,
        region: "us-east-1",
        createdAt: new Date()
      }
      
      await db.collection("nodes").insertOne(dummyNode)
      return NextResponse.json({ nodes: [dummyNode] })
    }

    return NextResponse.json({ nodes })
  } catch (error) {
    console.error("Error fetching server nodes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
