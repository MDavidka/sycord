"use client"

import { CardDescription } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users, Crown, Settings, ArrowRight, Trash2, LogOut, GitBranch } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"

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
  role?: string // Added role field
}

interface UserProfile {
  discordId: string
  username: string
  discriminator: string
  avatar: string
  email: string
  createdAt: string
  lastLogin: string
}

interface PendingInvite {
  _id: string
  serverId: string
  serverName: string
  serverIcon?: string
  inviter: {
    username: string
    avatar?: string
  }
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])

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

      const userProfileResponse = await fetch("/api/user/profile")
      if (userProfileResponse.ok) {
        const userProfileData = await userProfileResponse.json()
        setUserProfile(userProfileData)
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

      const invitesResponse = await fetch("/api/invites/pending")
      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json()
        setPendingInvites(invitesData.invites)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Failed to load dashboard data. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async (serverId: string) => {
    try {
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      })
      if (response.ok) {
        setPendingInvites(pendingInvites.filter((invite) => invite.serverId !== serverId))
        fetchData() // Refresh server list
      }
    } catch (error) {
      console.error("Error accepting invite:", error)
    }
  }

  const handleDeclineInvite = async (serverId: string) => {
    try {
      const response = await fetch("/api/invites/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      })
      if (response.ok) {
        setPendingInvites(pendingInvites.filter((invite) => invite.serverId !== serverId))
      }
    } catch (error) {
      console.error("Error declining invite:", error)
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

  const handleRevokeAccess = async (serverId: string) => {
    try {
      const response = await fetch(`/api/server/${serverId}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setUserServers(userServers.filter((server) => server.serverId !== serverId))
      } else {
        console.error("Failed to revoke access")
      }
    } catch (error) {
      console.error("Error revoking access:", error)
    }
  }

  const filteredGuilds = availableGuilds.filter((guild) => {
    const isAlreadyAdded = userServers.some((server) => server.serverId === guild.id)
    const matchesSearch = guild.name.toLowerCase().includes(searchTerm.toLowerCase())
    return !isAlreadyAdded && matchesSearch
  })

  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

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
      <header className="glass-card border-b border-white/10 -mt-4">
        <div className="container mx-auto px-4 py-4 pt-8">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-gray-800/50 hover:bg-gray-700/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                    <AvatarFallback className="bg-gray-600 text-white">
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.username || session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email || session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userProfile?.createdAt && (
                  <DropdownMenuItem disabled>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Joined since</span>
                      <span className="text-sm">{formatJoinedDate(userProfile.createdAt)}</span>
                    </div>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href="https://dev.sycord.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    <span>dev.sycord</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Button
        onClick={() => setShowAddServerModal(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg z-40"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <div className="container mx-auto px-4 py-8">
        {(userServers.length > 0 || pendingInvites.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Your Servers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingInvites.map((invite) => (
                <Card key={invite._id} className="hover-glow animate-fade-in group overflow-hidden relative">
                  <div className="blur-sm">
                    <div className="relative h-16 overflow-hidden">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: invite.serverIcon
                            ? `url(https://cdn.discordapp.com/icons/${invite.serverId}/${invite.serverIcon}.png?size=128)`
                            : "none",
                          backgroundSize: "1000%",
                          backgroundPosition: "center",
                        }}
                      ></div>
                    </div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <Image
                            src={
                              invite.serverIcon
                                ? `https://cdn.discordapp.com/icons/${invite.serverId}/${invite.serverIcon}.png?size=128`
                                : `https://sycord.com/placeholder.svg?height=64&width=64`
                            }
                            alt={invite.serverName}
                            width={64}
                            height={64}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate">{invite.serverName}</h3>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4">
                    <Avatar className="w-16 h-16 border-4 border-gray-800">
                      <AvatarImage src={invite.inviter.avatar || ""} alt={invite.inviter.username} />
                      <AvatarFallback>{invite.inviter.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="mt-2 text-gray-300">
                      <span className="font-bold text-white">{invite.inviter.username}</span> invited you to manage
                    </p>
                    <p className="text-lg font-semibold text-white truncate">{invite.serverName}</p>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        onClick={() => handleAcceptInvite(invite.serverId)}
                        size="sm"
                        className="bg-white text-black hover:bg-gray-200"
                      >
                        Accept
                      </Button>
                      <Button onClick={() => handleDeclineInvite(invite.serverId)} size="sm" variant="destructive">
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
                        backgroundSize: "1000%",
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
                              : `https://sycord.com/placeholder.svg?height=64&width=64`
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
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-2">
                            {server.isBotAdded ? (
                              <Link href={`/dashboard/server/${server.serverId}`}>
                                <Button size="sm" className="bg-gray-800/50 hover:bg-gray-700/50 text-white">
                                  <Settings className="h-4 w-4 mr-2" />
                                  {server.role === "contributor" ? "View" : "Configure"}
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
                            {server.role === "contributor" ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRevokeAccess(server.serverId)}
                              >
                                <LogOut className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-gray-800/50 hover:bg-gray-700/50 text-white"
                                onClick={() => handleDeleteServer(server.serverId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {server.role === "contributor" && <ContributorProfiles serverId={server.serverId} />}
                          </div>
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
                                  : `https://sycord.com/placeholder.svg?height=40&width=40`
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

function ContributorProfiles({ serverId }: { serverId: string }) {
  const [contributors, setContributors] = useState<any[]>([])

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const response = await fetch(`/api/server/${serverId}/members`)
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Contributors data:", data.contributors)
          setContributors(data.contributors || [])
        }
      } catch (error) {
        console.error("Error fetching contributors:", error)
      }
    }

    fetchContributors()
  }, [serverId])

  if (contributors.length === 0) return null

  return (
    <div className="flex -space-x-2">
      {contributors.slice(0, 3).map((contributor, index) => (
        <Avatar key={contributor.userId || contributor.email} className="w-8 h-8 border-2 border-gray-800">
          <AvatarImage src={contributor.avatar_url || ""} alt={contributor.username} />
          <AvatarFallback className="bg-gray-600 text-white text-xs">
            {contributor.username?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      ))}
      {contributors.length > 3 && (
        <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center">
          <span className="text-xs text-white">+{contributors.length - 3}</span>
        </div>
      )}
    </div>
  )
}
