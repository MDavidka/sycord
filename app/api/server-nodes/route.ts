
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const nodes = db.collection("nodes")

    // Fetch all nodes
    const serverNodes = await nodes.find({}).toArray()

    return NextResponse.json({ nodes: serverNodes })
  } catch (error) {
    console.error("Error fetching server nodes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()
    const nodes = db.collection("nodes")

    // Create or update a node
    const result = await nodes.updateOne(
      { serverName: body.serverName },
      {
        $set: {
          serverName: body.serverName,
          cpuLoad: body.cpuLoad,
          region: body.region || "Unknown",
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error updating server node:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
