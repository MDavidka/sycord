import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const integrations = await db.collection("integrations").find({}).sort({ created_at: -1 }).toArray()

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error("Error fetching integrations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, webhook_url, api_key } = await request.json()

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const integration = {
      name,
      description,
      webhook_url: webhook_url || null,
      api_key: api_key || null,
      created_by: session.user.email,
      created_at: new Date().toISOString(),
      active: true,
    }

    const result = await db.collection("integrations").insertOne(integration)

    return NextResponse.json({
      success: true,
      integration: { ...integration, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
