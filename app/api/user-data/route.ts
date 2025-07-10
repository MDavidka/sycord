import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user's servers from database
    const user = await db.collection("users").findOne({ discordId: session.user.id })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userServers = user.servers || []

    // Return mock available servers for demo purposes
    const mockAvailableServers = [
      {
        id: "123456789",
        name: "My Discord Server",
        icon: null,
        owner: true,
        permissions: "8",
        approximate_member_count: 150,
      },
      {
        id: "987654321",
        name: "Gaming Community",
        icon: null,
        owner: false,
        permissions: "32",
        approximate_member_count: 500,
      },
    ]

    return NextResponse.json({
      availableGuilds: mockAvailableServers,
      userServers,
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
