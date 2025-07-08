"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users, Crown, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface DiscordGuild {
  id: string
  name: string
  icon?: string
  owner: boolean
  permissions: string
  approximate_member_count?: number
}

interface UserServer {
  serverId: string
  serverName: string
  serverIcon?: string
  isBotAdded: boolean
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [availableGuilds, setAvailableGuilds] = useState<DiscordGuild[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      // Fetch user's configured servers
      const userServersResponse = await fetch("/api/user-servers")
      if (userServersResponse.ok) {
        const userServersData = await userServersResponse.json()
        setUserServers(userServersData.servers || [])
      }

      // Fetch available Discord guilds
      const guildsResponse = await fetch("/api/discord/guilds")
      if (guildsResponse.ok) {
        const guildsData = await guildsResponse.json()
        setAvailableGuilds(guildsData.guilds || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectServer = async (guild: DiscordGuild) => {
    try {
      const response = await fetch("/api/select-server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverId: guild.id,
          serverName: guild.name,
          serverIcon: guild.icon,
        }),
      })

      if (response.ok) {
        await fetchData()
        setShowAddModal(false)
        router.push(`/dashboard/server/${guild.id}`)
      }
    } catch (error) {
      console.error("Error selecting server:", error)
    }
  }

  const filteredGuilds = availableGuilds.filter((guild) => {
    const isAlreadyAdded = userServers.some((server) => server.serverId === guild.id)
    const matchesSearch = guild.name.toLowerCase().includes(searchTerm.toLowerCase())
    return !isAlreadyAdded && matchesSearch
  })

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
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
              <span className="text-xl font-bold text-gray-900">Dash</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowAddModal(true)} className="bg-gray-900 text-white hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
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
        {/* Servers Grid */}
        {userServers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No servers yet</h3>
            <p className="text-gray-600 mb-6">Add Dash to your Discord server to get started</p>
            <Button onClick={() => setShowAddModal(true)} className="bg-gray-900 text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Server
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userServers.map((server) => (
              <Card key={server.serverId} className="border-gray-200 bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Image
                      src={
                        server.serverIcon
                          ? `https://cdn.discordapp.com/icons/${server.serverId}/${server.serverIcon}.png?size=128`
                          : "/placeholder.svg?height=48&width=48"
                      }
                      alt={server.serverName}
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{server.serverName}</h3>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge
                          variant={server.isBotAdded ? "default" : "secondary"}
                          className={
                            server.isBotAdded
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {server.isBotAdded ? "Active" : "Pending"}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        {server.isBotAdded ? (
                          <Link href={`/dashboard/server/${server.serverId}`}>
                            <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                              <Settings className="h-4 w-4 mr-2" />
                              Configure
                            </Button>
                          </Link>
                        ) : (
                          <p className="text-sm text-gray-500">Add the bot to this server to start configuring</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Server Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add Server</h2>
                    <p className="text-gray-600">Select a server to add Dash bot</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search servers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300"
                  />
                </div>

                {filteredGuilds.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm ? "No servers found" : "All servers configured"}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm
                        ? "No servers match your search."
                        : "You've already configured all your available servers."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredGuilds.map((guild) => (
                      <Card
                        key={guild.id}
                        className="border-gray-200 hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => handleSelectServer(guild)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Image
                              src={
                                guild.icon
                                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`
                                  : "/placeholder.svg?height=40&width=40"
                              }
                              alt={guild.name}
                              width={40}
                              height={40}
                              className="rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">{guild.name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                {guild.approximate_member_count && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Users className="h-3 w-3 mr-1" />
                                    {guild.approximate_member_count.toLocaleString()}
                                  </div>
                                )}
                                {guild.owner && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Owner
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
