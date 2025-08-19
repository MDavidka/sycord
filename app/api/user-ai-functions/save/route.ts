import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, code, thumbnailUrl, profileUrl, serverId } = await request.json()

    const { db } = await connectToDatabase()

    const userFolder = session.user.email.split("@")[0] // Use email prefix as user folder
    const saveLocation = `dash-bot/users/${userFolder}/servers/${serverId || "default"}/saved-plugins`

    const result = await db.collection("user_ai_functions").insertOne({
      userId: session.user.email,
      name,
      description,
      code,
      thumbnailUrl,
      profileUrl,
      saveLocation,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      functionId: result.insertedId,
      saveLocation,
    })
  } catch (error) {
    console.error("Error saving AI function:", error)
    return NextResponse.json({ error: "Failed to save AI function" }, { status: 500 })
  }
}
