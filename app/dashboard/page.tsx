"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
  ExternalLinkIcon,
  LogOutIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react"
import Image from "next/image"

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
}

interface UserServer {
  serverId: string
  serverName: string
  isBotAdded: boolean
  addedAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [discordServers, setDiscordServers] = useState<DiscordGuild[]>([])
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [loading, setLoading] = useState(true)
  const [addingServer, setAddingServer] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData()
    }
  }, [status])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/user-data")
      const data = await response.json()

      if (response.ok) {
        setDiscordServers(data.discordServers || [])
        setUserServers(data.userServers || [])
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddServer = async (server: DiscordGuild) => {
    setAddingServer(server.id)
    try {
      const response = await fetch("/api/add-server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverId: server.id,
          serverName: server.name,
          serverIcon: server.icon,
        }),
      })

      if (response.ok) {
        await fetchUserData()
      }
    } catch (error) {
      console.error("Error adding server:", error)
    } finally {
      setAddingServer(null)
    }
  }

  const handleToggleBotStatus = async (serverId: string) => {
    try {
      const response = await fetch("/api/toggle-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId }),
      })

      if (response.ok) {
        await fetchUserData()
      }
    } catch (error) {
      console.error("Error toggling bot status:", error)
    }
  }

  const getInviteLink = (serverId: string) => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot&guild_id=${serverId}`
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const adminServers = discordServers.filter((server) => (BigInt(server.permissions) & BigInt(0x8)) === BigInt(0x8))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dash Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-gray-600 hover:text-gray-900">
              <LogOutIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Available Servers */}
        {adminServers.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <ServerIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Available Servers</h2>
              <Badge variant="secondary">{adminServers.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminServers.map((server) => {
                const isAdded = userServers.some((us) => us.serverId === server.id)

                return (
                  <Card key={server.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          {server.icon ? (
                            <Image
                              src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                              alt={server.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          ) : (
                            <ServerIcon className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{server.name}</h3>
                          <p className="text-xs text-gray-500">ID: {server.id}</p>
                        </div>
                      </div>

                      {!isAdded ? (
                        <Button
                          onClick={() => handleAddServer(server)}
                          disabled={addingServer === server.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
                        >
                          {addingServer === server.id ? (
                            <>
                              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <PlusIcon className="mr-2 h-4 w-4" />
                              Add Server
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge className="w-full justify-center bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircleIcon className="mr-1 h-3 w-3" />
                          Added
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* My Servers */}
        {userServers.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <SettingsIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">My Servers</h2>
              <Badge variant="secondary">{userServers.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userServers.map((server) => (
                <Card key={server.serverId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        <ServerIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{server.serverName}</h3>
                        <p className="text-xs text-gray-500">Added {new Date(server.addedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center">
                        {server.isBotAdded ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircleIcon className="mr-1 h-3 w-3" />
                            Bot Added
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircleIcon className="mr-1 h-3 w-3" />
                            Bot Missing
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {server.isBotAdded ? (
                        <Button
                          onClick={() => router.push(`/dashboard/server/${server.serverId}`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
                        >
                          <SettingsIcon className="mr-2 h-4 w-4" />
                          Configure
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => window.open(getInviteLink(server.serverId), "_blank")}
                            variant="outline"
                            className="flex-1 h-9 text-sm"
                          >
                            <ExternalLinkIcon className="mr-2 h-4 w-4" />
                            Invite Bot
                          </Button>
                          <Button
                            onClick={() => handleToggleBotStatus(server.serverId)}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {adminServers.length === 0 && userServers.length === 0 && (
          <div className="text-center py-12">
            <ServerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No servers found</h3>
            <p className="text-gray-600 mb-6">You need administrator permissions on a Discord server to add it here.</p>
            <Button onClick={fetchUserData} variant="outline">
              Refresh
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
