
  'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Server, Activity, Users, Settings, Shield, Zap } from 'lucide-react'

interface ServerInfo {
  id: string
  name: string
  icon?: string
  memberCount?: number
  isOnline?: boolean
}

interface NodePerformance {
  _id: string
  serverName: string
  loadPercentage: number
  lastUpdated: Date
  status: 'online' | 'offline' | 'warning'
}

interface UserPermissions {
  canViewServer: boolean
  canManageServer: boolean
  canViewPerformance: boolean
  isAdmin: boolean
}

export default function ServerDashboard() {
  const params = useParams()
  const { data: session, status } = useSession()
  const serverId = params?.serverId as string

  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [nodePerformance, setNodePerformance] = useState<NodePerformance[]>([])
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    canViewServer: false,
    canManageServer: false,
    canViewPerformance: false,
    isAdmin: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch server information
  useEffect(() => {
    const fetchServerInfo = async () => {
      if (!serverId || !session) return

      try {
        const response = await fetch(`/api/servers/${serverId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch server information')
        }

        const data = await response.json()
        setServerInfo(data)
      } catch (err) {
        console.error('Error fetching server info:', err)
        setError('Failed to load server information')
      }
    }

    fetchServerInfo()
  }, [serverId, session])

  // Fetch user permissions
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!serverId || !session) return

      try {
        const response = await fetch(`/api/user-config/${serverId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user permissions')
        }

        const data = await response.json()
        setUserPermissions({
          canViewServer: data.canViewServer || false,
          canManageServer: data.canManageServer || false,
          canViewPerformance: data.canViewPerformance || data.isAdmin || false,
          isAdmin: data.isAdmin || false
        })
      } catch (err) {
        console.error('Error fetching user permissions:', err)
        setUserPermissions({
          canViewServer: true, // Default fallback
          canManageServer: false,
          canViewPerformance: true,
          isAdmin: false
        })
      }
    }

    fetchUserPermissions()
  }, [serverId, session])

  // Fetch nodes performance data
  useEffect(() => {
    const fetchNodesPerformance = async () => {
      if (!serverId || !session || !userPermissions.canViewPerformance) return

      try {
        const response = await fetch(`/api/nodes-performance/${serverId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch nodes performance')
        }

        const data = await response.json()
        setNodePerformance(data.nodes || [])
      } catch (err) {
        console.error('Error fetching nodes performance:', err)
        setError('Failed to load performance data')
      } finally {
        setLoading(false)
      }
    }

    fetchNodesPerformance()
  }, [serverId, session, userPermissions.canViewPerformance])

  // Auto-refresh performance data every 30 seconds
  useEffect(() => {
    if (!userPermissions.canViewPerformance) return

    const interval = setInterval(async () => {
      if (!serverId || !session) return

      try {
        const response = await fetch(`/api/nodes-performance/${serverId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setNodePerformance(data.nodes || [])
        }
      } catch (err) {
        console.error('Error refreshing performance data:', err)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [serverId, session, userPermissions.canViewPerformance])

  const getLoadColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getLoadBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'default'
      case 'warning': return 'secondary'
      case 'offline': return 'destructive'
      default: return 'outline'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userPermissions.canViewServer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Insufficient Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to view this server dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Server Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {serverInfo?.icon && (
            <img 
              src={serverInfo.icon} 
              alt={serverInfo.name} 
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{serverInfo?.name || 'Server Dashboard'}</h1>
            <p className="text-muted-foreground">
              Server ID: {serverId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={serverInfo?.isOnline ? 'default' : 'secondary'}>
            {serverInfo?.isOnline ? 'Online' : 'Offline'}
          </Badge>
          {serverInfo?.memberCount && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {serverInfo.memberCount} members
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Nodes Performance
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Overview
          </TabsTrigger>
          {userPermissions.canManageServer && (
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Nodes Performance Monitor
              </CardTitle>
              <CardDescription>
                Real-time performance metrics for server nodes. Data refreshes every 30 seconds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!userPermissions.canViewPerformance ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">
                    You don't have permission to view performance data.
                  </p>
                </div>
              ) : nodePerformance.length === 0 ? (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
                  <p className="text-muted-foreground">
                    No nodes are currently reporting performance metrics.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {nodePerformance.map((node) => (
                    <Card key={node._id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium">
                            {node.serverName}
                          </CardTitle>
                          <Badge variant={getStatusBadgeVariant(node.status)}>
                            {node.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Load</span>
                            <span className={`text-sm font-bold ${getLoadColor(node.loadPercentage)}`}>
                              {node.loadPercentage}%
                            </span>
                          </div>
                          <Progress 
                            value={node.loadPercentage} 
                            className="h-2"
                          />
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Last updated: {new Date(node.lastUpdated).toLocaleString()}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            node.status === 'online' ? 'bg-green-500' :
                            node.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs capitalize">{node.status}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Server Overview</CardTitle>
              <CardDescription>
                General information about your server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Server Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Server Name:</span>
                      <span>{serverInfo?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Server ID:</span>
                      <span className="font-mono">{serverId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={serverInfo?.isOnline ? 'default' : 'secondary'}>
                        {serverInfo?.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    {serverInfo?.memberCount && (
                      <div className="flex justify-between">
                        <span>Members:</span>
                        <span>{serverInfo.memberCount}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Your Permissions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>View Server:</span>
                      <Badge variant={userPermissions.canViewServer ? 'default' : 'secondary'}>
                        {userPermissions.canViewServer ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Manage Server:</span>
                      <Badge variant={userPermissions.canManageServer ? 'default' : 'secondary'}>
                        {userPermissions.canManageServer ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>View Performance:</span>
                      <Badge variant={userPermissions.canViewPerformance ? 'default' : 'secondary'}>
                        {userPermissions.canViewPerformance ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Admin:</span>
                      <Badge variant={userPermissions.isAdmin ? 'default' : 'secondary'}>
                        {userPermissions.isAdmin ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userPermissions.canManageServer && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Server Settings</CardTitle>
                <CardDescription>
                  Configure your server settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Server settings panel will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
