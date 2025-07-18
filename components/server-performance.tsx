"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Activity, 
  Database, 
  Users, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"

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

interface ServerPerformanceProps {
  serverId: string
}

export default function ServerPerformance({ serverId }: ServerPerformanceProps) {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/server-metrics/${serverId}`)
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
        } else {
          setError("Failed to load server metrics")
        }
      } catch (err) {
        setError("Error fetching server metrics")
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [serverId])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-400"
      case "warning": return "text-yellow-400"
      case "critical": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-4 w-4" />
      case "warning": return <AlertTriangle className="h-4 w-4" />
      case "critical": return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Server className="h-6 w-6 mr-3" />
            Server Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !metrics) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Server className="h-6 w-6 mr-3" />
            Server Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error || "Failed to load server metrics"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center text-xl">
              <Server className="h-6 w-6 mr-3" />
              Server Performance
            </CardTitle>
            <CardDescription className="text-gray-400">
              Real-time server metrics and performance data
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(metrics.status)} border-current`}
            >
              {getStatusIcon(metrics.status)}
              <span className="ml-1 capitalize">{metrics.status}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-blue-400" />
                <span className="text-white text-sm font-medium">CPU</span>
              </div>
              <span className="text-white text-sm">{metrics.cpu_usage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metrics.cpu_usage} 
              className="h-2 bg-gray-800"
              indicatorClassName={
                metrics.cpu_usage > 80 ? "bg-red-500" :
                metrics.cpu_usage > 60 ? "bg-yellow-500" : "bg-green-500"
              }
            />
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-white text-sm font-medium">Memory</span>
              </div>
              <span className="text-white text-sm">{metrics.memory_usage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metrics.memory_usage} 
              className="h-2 bg-gray-800"
              indicatorClassName={
                metrics.memory_usage > 80 ? "bg-red-500" :
                metrics.memory_usage > 60 ? "bg-yellow-500" : "bg-green-500"
              }
            />
          </div>

          {/* Disk Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-purple-400" />
                <span className="text-white text-sm font-medium">Disk</span>
              </div>
              <span className="text-white text-sm">{metrics.disk_usage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metrics.disk_usage} 
              className="h-2 bg-gray-800"
              indicatorClassName={
                metrics.disk_usage > 80 ? "bg-red-500" :
                metrics.disk_usage > 60 ? "bg-yellow-500" : "bg-green-500"
              }
            />
          </div>
        </div>

        {/* Network and Connections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Connections */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Connections</p>
                  <p className="text-2xl font-bold text-white">{metrics.active_connections}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* Database Connections */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">DB Connections</p>
                  <p className="text-2xl font-bold text-white">{metrics.database_connections}</p>
                </div>
                <Database className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Response Time</p>
                  <p className="text-2xl font-bold text-white">{metrics.response_time}ms</p>
                </div>
                <MessageSquare className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          {/* Uptime */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Uptime</p>
                  <p className="text-2xl font-bold text-white">{formatUptime(metrics.uptime)}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network I/O */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-white text-sm font-medium">Network Sent</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatBytes(metrics.network_io.bytes_sent)}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-white text-sm font-medium">Network Received</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatBytes(metrics.network_io.bytes_received)}</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400">
            Last updated: {new Date(metrics.last_updated).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}