
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const nodes = await db.collection("nodes").find({}).toArray()

    return NextResponse.json({ nodes })
  } catch (error) {
    console.error("Error fetching server nodes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, status, cpuLoad } = await request.json()
    const { db } = await connectToDatabase()

    const result = await db.collection("nodes").insertOne({
      name,
      status: status || "online",
      cpuLoad: cpuLoad || Math.floor(Math.random() * 30) + 10, // Default random load
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error("Error creating server node:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nodeId, status } = await request.json()
    const { db } = await connectToDatabase()

    await db.collection("nodes").updateOne(
      { _id: new ObjectId(nodeId) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating server node:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
