"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  RefreshCcwIcon,
  Loader2Icon,
  ServerIcon,
} from "lucide-react"
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
  addedAt?: Date
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [availableGuilds, setAvailableGuilds] = useState<DiscordGuild[]>([])
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [loadingGuilds, setLoadingGuilds] = useState(true)
  const [loadingUserServers, setLoadingUserServers] = useState(true)
  const [addingServer, setAddingServer] = useState<string | null>(null)
  const [addServerError, setAddServerError] = useState<string | null>(null)
  const [guildsError, setGuildsError] = useState<string | null>(null)
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
    setLoadingGuilds(true)
    setLoadingUserServers(true)
    setGuildsError(null)

    try {
      const response = await fetch("/api/user-data")
      const data = await response.json()

      if (response.ok) {
        setAvailableGuilds(data.availableGuilds || [])
        setUserServers(data.userServers || [])
      } else {
        setGuildsError(data.error || "Failed to load user data.")
        console.error("Error fetching user data:", data.error)
      }
    } catch (error) {
      setGuildsError("An unexpected error occurred while fetching user data.")
      console.error("Fetch user data error:", error)
    } finally {
      setLoadingGuilds(false)
      setLoadingUserServers(false)
    }
  }

  const handleAddServer = async (guild: DiscordGuild) => {
    setAddingServer(guild.id)
    setAddServerError(null)

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
        if (data.isBotAdded) {
          // Bot is already added, redirect to config page
          router.push(`/dashboard/server/${guild.id}`)
        } else {
          // Bot not added, close dialog and refresh data
          setIsAddServerDialogOpen(false)
          await fetchUserData()
        }
      } else {
        setAddServerError(data.error || "Failed to add server.")
        console.error("Error adding server:", data.error)
      }
    } catch (error) {
      setAddServerError("An unexpected error occurred while adding the server.")
      console.error("Add server error:", error)
    } finally {
      setAddingServer(null)
    }
  }

  const getGuildIcon = (guild: DiscordGuild) => {
    return guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : "/placeholder-logo.svg"
  }

  const getBotInviteLink = (serverId: string) => {
    return `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${serverId}`
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="rounded-full" />
              <h1 className="text-2xl font-bold text-gray-900">Dash</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100">
                  <Image
                    src={session?.user?.image || "/placeholder-user.jpg"}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border border-gray-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-gray-500">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem className="text-gray-700 hover:bg-gray-50" onClick={() => router.push("/settings")}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-700 hover:bg-gray-50"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Servers</h2>
            <p className="text-gray-600 mt-1">Manage your Discord servers with Dash</p>
          </div>
          <Dialog open={isAddServerDialogOpen} onOpenChange={setIsAddServerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <PlusIcon className="mr-2 h-5 w-5" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Add a Server</DialogTitle>
                <CardDescription className="text-gray-600">
                  Select a Discord server to manage with Dash. Only servers where you have Administrator or Manage
                  Server permissions are shown.
                </CardDescription>
              </DialogHeader>
              <Separator className="bg-gray-200" />
              {loadingGuilds ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2Icon className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Loading your Discord servers...</p>
                </div>
              ) : guildsError ? (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Error</AlertTitle>
                  <AlertDescription className="text-red-700">{guildsError}</AlertDescription>
                  <Button
                    onClick={fetchUserData}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                    variant="outline"
                  >
                    <RefreshCcwIcon className="mr-2 h-4 w-4" /> Try Again
                  </Button>
                </Alert>
              ) : availableGuilds.length === 0 ? (
                <div className="text-center py-8">
                  <ServerIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-700">No servers available to add.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Make sure you have Administrator or Manage Server permissions on the Discord server.
                  </p>
                  <Button
                    onClick={fetchUserData}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    variant="outline"
                  >
                    <RefreshCcwIcon className="mr-2 h-4 w-4" /> Refresh List
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid gap-3">
                    {availableGuilds.map((guild) => (
                      <Card
                        key={guild.id}
                        className="bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <CardContent className="flex items-center p-4">
                          <Image
                            src={getGuildIcon(guild) || "/placeholder.svg"}
                            alt={guild.name}
                            width={48}
                            height={48}
                            className="rounded-full mr-4"
                          />
                          <div className="flex-grow">
                            <h3 className="font-semibold text-gray-900">{guild.name}</h3>
                            <p className="text-sm text-gray-500">
                              {guild.approximate_member_count
                                ? `${guild.approximate_member_count} members`
                                : "N/A members"}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleAddServer(guild)}
                            disabled={addingServer === guild.id}
                            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white border-0"
                          >
                            {addingServer === guild.id ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Add"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {addServerError && (
                <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Error</AlertTitle>
                  <AlertDescription className="text-red-700">{addServerError}</AlertDescription>
                </Alert>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Server Grid */}
        {loadingUserServers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Skeleton className="h-20 w-20 rounded-full mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userServers.length === 0 ? (
          <div className="text-center py-16">
            <BotIcon className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No servers added yet!</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Click the "Add Server" button above to start managing your Discord servers with Dash.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userServers.map((server) => (
              <Card
                key={server.serverId}
                className="bg-white border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Image
                      src={server.serverIcon || "/placeholder-logo.svg"}
                      alt={server.serverName}
                      width={80}
                      height={80}
                      className="rounded-full mb-4"
                    />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{server.serverName}</h3>
                    {server.isBotAdded ? (
                      <div className="flex items-center text-green-600 mb-4">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        <span className="font-medium">Bot Added</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-amber-600 mb-4">
                        <div className="flex items-center mb-2">
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          <span className="font-medium">Waiting for Bot</span>
                        </div>
                        <a
                          href={getBotInviteLink(server.serverId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                        >
                          Invite the bot
                        </a>
                      </div>
                    )}
                    <Button
                      asChild={server.isBotAdded}
                      disabled={!server.isBotAdded}
                      className={`w-full ${
                        server.isBotAdded
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      } border-0`}
                    >
                      {server.isBotAdded ? (
                        <Link href={`/dashboard/server/${server.serverId}`}>
                          <SettingsIcon className="mr-2 h-4 w-4" />
                          Configure
                        </Link>
                      ) : (
                        <span>
                          <SettingsIcon className="mr-2 h-4 w-4" />
                          Configure
                        </span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
