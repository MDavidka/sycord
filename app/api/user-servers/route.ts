import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import type { UserServer } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const userServers = await db.collection<UserServer>("user_servers").find({ userId: session.user.id }).toArray()

    return NextResponse.json({ userServers })
  } catch (error) {
    console.error("Error fetching user servers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
