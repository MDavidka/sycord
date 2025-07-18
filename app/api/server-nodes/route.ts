import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

interface ServerNode {
  id: string
  name: string
  load: number // Percentage from 0 to 100
}

// Mock function to simulate database query for server nodes
function getServerNodesFromDB(): ServerNode[] {
  // In a real implementation, this would query your database
  // For now, we'll return mock data
  return [
    {
      id: "main-server-1",
      name: "Main Server",
      load: Math.floor(Math.random() * 100) + 1, // 1-100%
    },
    {
      id: "beta-node-2",
      name: "Beta User Node",
      load: Math.floor(Math.random() * 100) + 1, // 1-100%
    },
    {
      id: "dev-server-3",
      name: "Development Server",
      load: Math.floor(Math.random() * 100) + 1, // 1-100%
    },
  ]
}

export async function GET(
  request: NextRequest
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin+ access (only for specific email)
    if (session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Access denied. Admin+ required." }, { status: 403 })
    }

    // Get server nodes from database
    const nodes = getServerNodesFromDB()

    return NextResponse.json(nodes)
  } catch (error) {
    console.error("Error fetching server nodes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

