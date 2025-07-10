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
  MenuIcon,
  BotIcon,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2Icon className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100 dark:bg-gray-900/80 dark:border-blue-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="object-cover" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dash Dashboard
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Manage your Discord servers</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center space-x-3 mb-6">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{session?.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => signOut()}
                      className="justify-start text-muted-foreground hover:text-foreground mt-auto"
                    >
                      <LogOutIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop User Info */}
              <div className="hidden sm:flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
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
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <ServerIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{adminServers.length}</p>
                  <p className="text-xs text-muted-foreground">Available Servers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-100 dark:bg-gray-800/80 dark:border-green-900">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{userServers.length}</p>
                  <p className="text-xs text-muted-foreground">Active Servers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-100 dark:bg-gray-800/80 dark:border-purple-900">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BotIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {userServers.filter((s) => s.isBotAdded).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Bot Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Servers */}
        {adminServers.length > 0 && (
          <section className="mb-8 sm:mb-12 animate-slide-up">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <ServerIcon className="h-3 w-3 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Available Servers</h2>
              <Badge
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              >
                {adminServers.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {adminServers.map((server) => {
                const isAdded = userServers.some((us) => us.serverId === server.id)

                return (
                  <Card
                    key={server.id}
                    className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900 group hover:scale-105 transition-all duration-200 hover:shadow-lg"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                          {server.icon ? (
                            <Image
                              src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=64`}
                              alt={server.name}
                              width={48}
                              height={48}
                              className="object-cover rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = "none"
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `<svg class="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"></path></svg>`
                                }
                              }}
                            />
                          ) : (
                            <ServerIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate text-sm sm:text-base">{server.name}</h3>
                          <p className="text-xs text-muted-foreground">ID: {server.id.slice(0, 8)}...</p>
                        </div>
                      </div>

                      {!isAdded ? (
                        <Button
                          onClick={() => handleAddServer(server)}
                          disabled={addingServer === server.id}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          {addingServer === server.id ? (
                            <>
                              <Loader2Icon className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <PlusIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Add Server
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge className="w-full justify-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-900 text-xs">
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
          <section className="animate-slide-up">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <SettingsIcon className="h-3 w-3 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">My Servers</h2>
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              >
                {userServers.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {userServers.map((server) => (
                <Card
                  key={server.serverId}
                  className="bg-white/80 backdrop-blur-sm border-green-100 dark:bg-gray-800/80 dark:border-green-900 group hover:scale-105 transition-all duration-200 hover:shadow-lg"
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center">
                        <ServerIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate text-sm sm:text-base">
                          {server.serverName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Added: {new Date(server.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {server.isBotAdded ? (
                          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs">
                            <CheckCircleIcon className="mr-1 h-3 w-3" />
                            Bot Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <XCircleIcon className="mr-1 h-3 w-3" />
                            Bot Missing
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      {server.isBotAdded ? (
                        <Button
                          onClick={() => router.push(`/dashboard/server/${server.serverId}`)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0 h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          <SettingsIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Configure
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => window.open(getInviteLink(server.serverId), "_blank")}
                            variant="outline"
                            className="flex-1 h-8 sm:h-9 text-xs sm:text-sm border-blue-200 hover:bg-blue-50 dark:border-blue-800"
                          >
                            <ExternalLinkIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Invite Bot
                          </Button>
                          <Button
                            onClick={() => handleToggleBotStatus(server.serverId)}
                            variant="outline"
                            size="sm"
                            className="h-8 sm:h-9 px-2 sm:px-3 border-green-200 hover:bg-green-50 dark:border-green-800"
                          >
                            <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4" />
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
          <div className="text-center py-12 sm:py-16 animate-fade-in">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <ServerIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">No servers found</h3>
            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
              You need administrator permissions on a Discord server to add it here.
            </p>
            <Button
              onClick={fetchUserData}
              variant="outline"
              className="text-sm sm:text-base border-blue-200 hover:bg-blue-50 dark:border-blue-800 bg-transparent"
            >
              Refresh
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
