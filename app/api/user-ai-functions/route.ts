import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { UserAIFunction } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const functionsCollection = db.collection<UserAIFunction>("user_ai_functions")

    const userFunctions = await functionsCollection
      .find({ created_by: session.user.email })
      .sort({ created_at: -1 })
      .toArray()

    return NextResponse.json({ functions: userFunctions })
  } catch (error) {
    console.error("Error fetching user AI functions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, code, thumbnailUrl, profileUrl } = body

    if (!name || !description || !code) {
      return NextResponse.json({ error: "Name, description, and code are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const functionsCollection = db.collection<UserAIFunction>("user_ai_functions")

    const newFunction: UserAIFunction = {
      name,
      description,
      code,
      created_by: session.user.email,
      created_at: new Date().toISOString(),
      thumbnailUrl: thumbnailUrl || "",
      profileUrl: profileUrl || "",
    }

    const result = await functionsCollection.insertOne(newFunction)

    return NextResponse.json({
      message: "AI function saved successfully",
      function: { ...newFunction, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error saving AI function:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { _id } = body

    if (!_id) {
      return NextResponse.json({ error: "Function ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const functionsCollection = db.collection<UserAIFunction>("user_ai_functions")

    const result = await functionsCollection.deleteOne({
      _id: new (await import("mongodb")).ObjectId(_id),
      created_by: session.user.email,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Function not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "AI function deleted successfully" })
  } catch (error) {
    console.error("Error deleting AI function:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
