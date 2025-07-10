"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Users, BarChart3, LogOut, Bell, Zap, Crown, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ServerCard } from "@/components/server-card"
import { PluginsTab } from "@/components/plugins-tab"

interface Server {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
  features: string[]
  member_count?: number
  bot_in_server?: boolean
}

interface UserData {
  servers: Server[]
  user_plugins: any[]
  announcements: any[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData()
    }
  }, [status])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user-data")
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addBotToServer = async (serverId: string) => {
    try {
      const response = await fetch("/api/add-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      })
      if (response.ok) {
        fetchUserData()
      }
    } catch (error) {
      console.error("Error adding bot to server:", error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md border border-border">
          <CardHeader className="text-center">
            <Bot className="h-12 w-12 text-foreground mx-auto mb-4" />
            <CardTitle className="text-foreground">Access Required</CardTitle>
            <CardDescription className="text-muted-foreground">Please sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full bg-foreground text-background hover:bg-foreground/90">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const serversWithBot = userData?.servers?.filter((server) => server.bot_in_server) || []
  const serversWithoutBot = userData?.servers?.filter((server) => !server.bot_in_server) || []
  const activeAnnouncements = userData?.announcements?.filter((a) => a.active) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-foreground" />
                <span className="text-xl font-bold text-foreground">Dash Bot</span>
              </Link>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                Dashboard
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-muted text-foreground">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Announcements */}
      {activeAnnouncements.length > 0 && (
        <div className="bg-muted/50 border-b border-border">
          <div className="container mx-auto px-4 py-3">
            {activeAnnouncements.slice(0, 1).map((announcement) => (
              <Alert key={announcement._id} className="border-0 bg-transparent p-0">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  <strong>{announcement.title}:</strong> {announcement.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Manage your Discord servers and bot configurations from your dashboard.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Servers</p>
                  <p className="text-2xl font-bold text-foreground">{serversWithBot.length}</p>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Bot className="h-6 w-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Servers</p>
                  <p className="text-2xl font-bold text-foreground">{userData?.servers?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Plugins</p>
                  <p className="text-2xl font-bold text-foreground">{userData?.user_plugins?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Premium Status</p>
                  <p className="text-2xl font-bold text-foreground">Free</p>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Crown className="h-6 w-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="servers" className="space-y-6">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger
              value="servers"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Bot className="h-4 w-4 mr-2" />
              Servers
            </TabsTrigger>
            <TabsTrigger
              value="plugins"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Zap className="h-4 w-4 mr-2" />
              Plugins
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servers" className="space-y-6">
            {/* Active Servers */}
            {serversWithBot.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Active Servers</h2>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    {serversWithBot.length} servers
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serversWithBot.map((server) => (
                    <ServerCard
                      key={server.id}
                      server={server}
                      onManage={() => setSelectedServer(server.id)}
                      hasBot={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available Servers */}
            {serversWithoutBot.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Available Servers</h2>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {serversWithoutBot.length} servers
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serversWithoutBot.map((server) => (
                    <ServerCard
                      key={server.id}
                      server={server}
                      onAddBot={() => addBotToServer(server.id)}
                      hasBot={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Servers */}
            {(!userData?.servers || userData.servers.length === 0) && (
              <Card className="border border-border">
                <CardContent className="p-12 text-center">
                  <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No servers found</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have access to any Discord servers, or you need to refresh your permissions.
                  </p>
                  <Button
                    onClick={fetchUserData}
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted/50 bg-transparent"
                  >
                    Refresh Servers
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plugins">
            <PluginsTab userPlugins={userData?.user_plugins || []} />
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Analytics Dashboard</CardTitle>
                <CardDescription className="text-muted-foreground">
                  View detailed analytics for your servers and bot usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and insights will be available in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
