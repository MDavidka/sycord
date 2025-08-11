"use client"

import { CardDescription } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users, Crown, Settings, ArrowRight, Trash2 } from "lucide-react"
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
  lastConfigUpdate?: string
  color?: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [availableGuilds, setAvailableGuilds] = useState<DiscordGuild[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddServerModal, setShowAddServerModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (session?.user?.email === "dmarton336@gmail.com") {
      setIsAdmin(true)
    }
  }, [session])

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
      const userServersResponse = await fetch("/api/user-servers")
      if (userServersResponse.ok) {
        const userServersData = await userServersResponse.json()
        setUserServers(userServersData.servers)
      }

      const guildsResponse = await fetch("/api/discord/guilds")
      if (guildsResponse.ok) {
        const guildsData = await guildsResponse.json()
        setAvailableGuilds(guildsData.guilds)
      } else {
        const errorData = await guildsResponse.json()
        console.error("Failed to fetch Discord guilds:", errorData)

        if (guildsResponse.status === 401) {
          router.push("/login")
          return
        }

        alert(`Failed to load Discord servers: ${errorData.details || errorData.error}`)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Failed to load dashboard data. Please try refreshing the page.")
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
        router.push(`/dashboard/server/${guild.id}`)
      }
    } catch (error) {
      console.error("Error selecting server:", error)
    }
  }

  const handleDeleteServer = async (serverId: string) => {
    try {
      const response = await fetch("/api/delete-server", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId }),
      })

      if (response.ok) {
        setUserServers(userServers.filter((server) => server.serverId !== serverId))
      } else {
        console.error("Failed to delete server")
      }
    } catch (error) {
      console.error("Error deleting server:", error)
    }
  }

  const filteredGuilds = availableGuilds.filter((guild) => {
    const isAlreadyAdded = userServers.some((server) => server.serverId === guild.id)
    const matchesSearch = guild.name.toLowerCase().includes(searchTerm.toLowerCase())
    return !isAlreadyAdded && matchesSearch
  })

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image src="/new-blue-logo.png" alt="Sycord Bot" width={32} height={32} className="rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  <span className="text-white">Sycord</span> Dashboard
                </h1>
                {isAdmin && (
                  <div className="mt-2">
                    <Link href="/admin/plugins">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10 bg-transparent"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  </div>
                )}
                <p className="text-sm text-gray-400">Manage your Discord servers</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddServerModal(true)}
              className="bg-gray-800/50 hover:bg-gray-700/50 text-white"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {userServers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Your Configured Servers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userServers.map((server) => (
                <Card key={server.serverId} className="hover-glow animate-fade-in group overflow-hidden">
                  <div className="relative h-16 overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: server.color || "#3b82f6",
                        backgroundImage: server.serverIcon
                          ? `url(https://cdn.discordapp.com/icons/${server.serverId}/${server.serverIcon}.png?size=128)`
                          : "none",
                        backgroundSize: "200%",
                        backgroundPosition: "center",
                      }}
                    ></div>
                  </div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Image
                          src={
                            server.serverIcon
                              ? `https://cdn.discordapp.com/icons/${server.serverId}/${server.serverIcon}.png?size=128`
                              : "/placeholder.svg?height=64&width=64"
                          }
                          alt={server.serverName}
                          width={64}
                          height={64}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{server.serverName}</h3>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge
                            variant={server.isBotAdded ? "default" : "secondary"}
                            className="bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center"
                          >
                            {server.isBotAdded ? (
                              <>
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                Bot Added
                              </>
                            ) : (
                              <>
                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                                Waiting for Bot
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                          {server.isBotAdded ? (
                            <Link href={`/dashboard/server/${server.serverId}`}>
                              <Button size="sm" className="bg-gray-800/50 hover:bg-gray-700/50 text-white">
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-gray-800/50 hover:bg-gray-700/50 text-white"
                              onClick={() =>
                                window.open(
                                  "https://discord.com/oauth2/authorize?client_id=1319362022286295123&permissions=1478210153510&integration_type=0&scope=bot",
                                  "_blank",
                                )
                              }
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Invite Bot
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-gray-800/50 hover:bg-gray-700/50 text-white"
                            onClick={() => handleDeleteServer(server.serverId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showAddServerModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl">Add Server to Dashboard</CardTitle>
                    <CardDescription className="text-gray-400">
                      Select servers where you want to configure the Sycord bot
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAddServerModal(false)}
                    className="text-white hover:bg-white/10"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search servers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/60 border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                {filteredGuilds.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {searchTerm ? "No servers found" : "All servers configured"}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {searchTerm
                        ? "No servers match your search."
                        : "You've already configured all your available servers."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {filteredGuilds.map((guild) => (
                      <Card
                        key={guild.id}
                        className="mobile-block hover-glow cursor-pointer transition-all"
                        onClick={() => {
                          handleSelectServer(guild)
                          setShowAddServerModal(false)
                        }}
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
                              <h3 className="font-medium text-white truncate">{guild.name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                {guild.approximate_member_count && (
                                  <div className="flex items-center text-xs text-gray-400">
                                    <Users className="h-3 w-3 mr-1" />
                                    {guild.approximate_member_count.toLocaleString()}
                                  </div>
                                )}
                                {guild.owner && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs"
                                  >
                                    <Crown className="h-3 w-3 mr-1" />
                                    Owner
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" className="bg-gray-800/50 hover:bg-gray-700/50 text-white">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
