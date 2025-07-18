import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

interface ServerMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_io: {
    bytes_sent: number
    bytes_received: number
  }
  active_connections: number
  database_connections: number
  response_time: number
  uptime: number
  status: "healthy" | "warning" | "critical"
  last_updated: string
}

// Mock function to simulate database query for server metrics
function getServerMetricsFromDB(serverId: string): ServerMetrics {
  // In a real implementation, this would query your database
  // For now, we'll return realistic mock data with some randomization
  
  const baseTime = Date.now()
  const cpuUsage = Math.random() * 100
  const memoryUsage = Math.random() * 100
  const diskUsage = Math.random() * 100
  
  // Determine status based on resource usage
  let status: "healthy" | "warning" | "critical" = "healthy"
  if (cpuUsage > 80 || memoryUsage > 80 || diskUsage > 90) {
    status = "critical"
  } else if (cpuUsage > 60 || memoryUsage > 60 || diskUsage > 70) {
    status = "warning"
  }
  
  return {
    cpu_usage: cpuUsage,
    memory_usage: memoryUsage,
    disk_usage: diskUsage,
    network_io: {
      bytes_sent: Math.floor(Math.random() * 1000000000), // Random bytes sent
      bytes_received: Math.floor(Math.random() * 1000000000), // Random bytes received
    },
    active_connections: Math.floor(Math.random() * 1000) + 50, // 50-1050 connections
    database_connections: Math.floor(Math.random() * 100) + 10, // 10-110 DB connections
    response_time: Math.floor(Math.random() * 500) + 50, // 50-550ms response time
    uptime: Math.floor(Math.random() * 2592000) + 86400, // 1-30 days uptime in seconds
    status,
    last_updated: new Date().toISOString(),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    // Check if user has admin+ access (only for specific email)
    if (session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Access denied. Admin+ required." }, { status: 403 })
    }

    // Get server metrics from database
    const metrics = getServerMetricsFromDB(serverId)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error fetching server metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Optional: Add POST endpoint to update metrics (for real-time monitoring systems)
export async function POST(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    
    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    // Check if user has admin+ access
    if (session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Access denied. Admin+ required." }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate the metrics data
    const requiredFields = [
      'cpu_usage', 'memory_usage', 'disk_usage', 'network_io',
      'active_connections', 'database_connections', 'response_time', 'uptime'
    ]
    
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // In a real implementation, you would save this to your database
    // For now, we'll just return success
    console.log(`Received metrics update for server ${serverId}:`, body)

    return NextResponse.json({ 
      success: true, 
      message: "Metrics updated successfully",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error updating server metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
