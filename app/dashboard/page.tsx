"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ServerCard } from "@/components/server-card"
import { Plus, Bot, Users, Shield, MessageSquare, Info, Bell } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Announcement {
  _id: string
  title: string
  message: string
  type: "info" | "warning" | "success"
  createdAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [servers, setServers] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    try {
      // Load user servers
      const serversResponse = await fetch("/api/user-servers")
      if (serversResponse.ok) {
        const serversData = await serversResponse.json()
        setServers(serversData.servers)
      }

      // Load announcements
      const announcementsResponse = await fetch("/api/announcements")
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        setAnnouncements(announcementsData.announcements || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/bot-icon.png" alt="Dash Bot" width={32} height={32} className="rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dash</h1>
                <p className="text-sm text-gray-600">Discord Bot Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
              <div className="flex items-center space-x-2">
                <Image
                  src={session.user?.image || "/placeholder-user.jpg"}
                  alt={session.user?.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-gray-900">{session.user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Announcements
            </h2>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Alert
                  key={announcement._id}
                  className={`border-l-4 ${
                    announcement.type === "info"
                      ? "border-blue-500 bg-blue-50"
                      : announcement.type === "warning"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-green-500 bg-green-50"
                  }`}
                >
                  <Info className="h-4 w-4" />
                  <div>
                    <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                    <AlertDescription className="text-gray-700">{announcement.message}</AlertDescription>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Servers</p>
                  <p className="text-2xl font-bold text-gray-900">{servers.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Bots</p>
                  <p className="text-2xl font-bold text-gray-900">{servers.filter((s) => s.is_bot_added).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bot className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Protected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {servers.filter((s) => s.moderation_level !== "off").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Support Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {servers.filter((s) => s.support?.ticket_system?.enabled).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servers Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Servers</h2>
          <Link href="/invite-server">
            <Button className="bg-gray-900 text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </Link>
        </div>

        {servers.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-12 text-center">
              <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No servers yet</h3>
              <p className="text-gray-600 mb-6">Add Dash to your Discord server to get started</p>
              <Link href="/invite-server">
                <Button className="bg-gray-900 text-white hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Server
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <ServerCard key={server.serverId} server={server} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
