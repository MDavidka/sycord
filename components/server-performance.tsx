"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Server, 
  Plus
} from "lucide-react"

interface ServerNode {
  id: string
  name: string
  load: number // Percentage from 0 to 100
}

interface ServerPerformanceProps {
  serverId: string
}

export default function ServerPerformance({ serverId }: ServerPerformanceProps) {
  const [nodes, setNodes] = useState<ServerNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch("/api/server-nodes")
        if (response.ok) {
          const data = await response.json()
          setNodes(data)
        } else {
          setError("Failed to load server nodes")
        }
      } catch (err) {
        setError("Error fetching server nodes")
      } finally {
        setLoading(false)
      }
    }

    fetchNodes()
    
    // Refresh nodes every 30 seconds
    const interval = setInterval(fetchNodes, 30000)
    
    return () => clearInterval(interval)
  }, [serverId])

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Server className="h-6 w-6 mr-3 text-white" />
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

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Server className="h-6 w-6 mr-3 text-white" />
            Server Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
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
              <Server className="h-6 w-6 mr-3 text-white" />
              Server Performance
            </CardTitle>
            <CardDescription className="text-gray-400">
              Monitor server node status and load
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="border-white/20 text-white hover:bg-white hover:text-black bg-transparent"
          >
            <Plus className="h-4 w-4 mr-2 text-white" />
            Add Server
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {nodes.length === 0 ? (
          <div className="text-center py-8">
            <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No server nodes found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nodes.map((node) => (
              <div 
                key={node.id} 
                className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20"
              >
                <div className="flex items-center space-x-3">
                  <Server className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">{node.name}</span>
                </div>
                
                <div className="flex items-center space-x-3 min-w-[120px]">
                  <div className="flex-1">
                    <Progress 
                      value={node.load} 
                      className="h-2 bg-gray-800 w-20"
                      indicatorClassName="bg-white"
                    />
                  </div>
                  <span className="text-white text-sm font-mono min-w-[40px] text-right">
                    {node.load}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
