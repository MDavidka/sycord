"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PlusIcon,
  LogOutIcon,
  SettingsIcon,
  BotIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
  ServerIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface DiscordGuild {
  id: string
  name: string
  icon?: string
  owner: boolean
  permissions: string
}

interface UserServer {
  serverId: string
  serverName: string
  serverIcon?: string
  isBotAdded: boolean
  addedAt?: Date
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [availableGuilds, setAvailableGuilds] = useState<DiscordGuild[]>([])
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [loading, setLoading] = useState(true)
  const [addingServer, setAddingServer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAddServerDialogOpen, setIsAddServerDialogOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserData()
    }
  }, [status, session])

  const fetchUserData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/user-data")
      const data = await response.json()

      if (response.ok) {
        setAvailableGuilds(data.availableGuilds || [])
        setUserServers(data.userServers || [])
      } else {
        setError(data.error || "Failed to load user data.")
      }
    } catch (error) {
      setError("An unexpected error occurred.")
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddServer = async (guild: DiscordGuild) => {
    setAddingServer(guild.id)

    try {
      const response = await fetch("/api/add-server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverId: guild.id,
          serverName: guild.name,
          serverIcon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsAddServerDialogOpen(false)
        await fetchUserData() // Refresh data to show the newly added server
      } else {
        setError(data.error || "Failed to add server.")
      }
    } catch (error) {
      setError("An unexpected error occurred while adding the server.")
      console.error("Add server error:", error)
    } finally {
      setAddingServer(null)
    }
  }

  const markBotAsAdded = async (serverId: string) => {
    try {
      const response = await fetch("/api/toggle-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId, isBotAdded: true }), // Explicitly set to true
      })

      if (response.ok) {
        await fetchUserData() // Refresh data to update bot status
      } else {
        setError("Failed to update bot status.")
      }
    } catch (error) {
      setError("An unexpected error occurred while updating bot status.")
      console.error("Toggle bot error:", error)
    }
  }

  const getGuildIcon = (guild: DiscordGuild) => {
    return guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : null
  }

  const getBotInviteLink = (serverId: string) => {
    return `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${serverId}`
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dash</h1>
                <p className="text-xs text-gray-500">Server Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {session?.user && (
                <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-gray-100 rounded-lg">
                  <Image
                    src={session.user.image || "/placeholder-user.jpg"}
                    alt="User"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{session.user.name}</p>
                  </div>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Servers</h2>
            <p className="text-gray-600 text-sm mt-1">Manage your Discord servers</p>
          </div>

          <Dialog open={isAddServerDialogOpen} onOpenChange={setIsAddServerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Server</DialogTitle>
              </DialogHeader>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2Icon className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : availableGuilds.length === 0 ? (
                <div className="text-center py-8">
                  <ServerIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No servers available</p>
                  <p className="text-sm text-gray-500 mt-1">Make sure you have admin permissions</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {availableGuilds.map((guild) => (
                      <div
                        key={guild.id}
                        className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                          {getGuildIcon(guild) ? (
                            <Image
                              src={getGuildIcon(guild)! || "/placeholder.svg"}
                              alt={guild.name}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <ServerIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{guild.name}</h3>
                          <p className="text-xs text-gray-500">{guild.owner ? "Owner" : "Admin"}</p>
                        </div>
                        <Button
                          onClick={() => handleAddServer(guild)}
                          disabled={addingServer === guild.id}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
                        >
                          {addingServer === guild.id ? <Loader2Icon className="h-3 w-3 animate-spin" /> : "Add"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Server Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="modern-card">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Skeleton className="h-12 w-12 rounded-xl mb-3" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16 mb-3" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userServers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BotIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No servers yet</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              Add your first Discord server to start managing it with Dash.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userServers.map((server) => (
              <Card key={server.serverId} className="modern-card group">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                    {server.serverIcon ? (
                      <Image
                        src={server.serverIcon || "/placeholder.svg"}
                        alt={server.serverName}
                        width={48}
                        height={48}
                        className="rounded-xl object-cover"
                      />
                    ) : (
                      <ServerIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 truncate w-full text-base">{server.serverName}</h3>

                  <div className="flex items-center mb-3">
                    {server.isBotAdded ? (
                      <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Pending</span>
                      </div>
                    )}
                  </div>

                  {server.isBotAdded ? (
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9">
                      <Link href={`/dashboard/server/${server.serverId}`}>
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Configure
                      </Link>
                    </Button>
                  ) : (
                    <div className="w-full space-y-2">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent text-sm h-9"
                      >
                        <a href={getBotInviteLink(server.serverId)} target="_blank" rel="noopener noreferrer">
                          <ExternalLinkIcon className="mr-2 h-4 w-4" />
                          Invite Bot
                        </a>
                      </Button>
                      <Button
                        onClick={() => markBotAsAdded(server.serverId)}
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs text-gray-500 hover:text-gray-700 h-8"
                      >
                        Mark as Added
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
