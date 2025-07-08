"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription } from "@/components/ui/card"
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
import type { DiscordGuild, UserServer } from "@/lib/types"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [discordGuilds, setDiscordGuilds] = useState<DiscordGuild[]>([])
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
    if (session?.accessToken) {
      fetchDiscordGuilds()
      fetchUserServers()
    }
  }, [session])

  const fetchDiscordGuilds = async () => {
    setLoadingGuilds(true)
    setGuildsError(null)
    try {
      const response = await fetch("/api/discord/guilds")
      const data = await response.json()
      if (response.ok) {
        setDiscordGuilds(data.guilds)
      } else {
        setGuildsError(data.error || "Failed to load Discord servers.")
        console.error("Error fetching Discord guilds:", data.error)
      }
    } catch (error) {
      setGuildsError("An unexpected error occurred while fetching Discord servers.")
      console.error("Fetch Discord guilds error:", error)
    } finally {
      setLoadingGuilds(false)
    }
  }

  const fetchUserServers = async () => {
    setLoadingUserServers(true)
    try {
      const response = await fetch("/api/user-servers")
      const data = await response.json()
      if (response.ok) {
        setUserServers(data.userServers)
      } else {
        console.error("Error fetching user servers:", data.error)
      }
    } catch (error) {
      console.error("Fetch user servers error:", error)
    } finally {
      setLoadingUserServers(false)
    }
  }

  const handleAddServer = async (guild: DiscordGuild) => {
    setAddingServer(guild.id)
    setAddServerError(null)
    try {
      const response = await fetch("/api/select-server", {
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
        // Update userServers state to reflect the newly added server
        setUserServers((prev) => [
          ...prev,
          {
            serverId: guild.id,
            serverName: guild.name,
            serverIcon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
            isBotAdded: false, // Initially false, bot will update this
            addedAt: new Date(),
          },
        ])
        setIsAddServerDialogOpen(false) // Close dialog on success
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
    // Replace with your actual bot invite link and permissions
    // Example: https://discord.com/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=8&scope=bot%20applications.commands&guild_id=${serverId}
    return `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${serverId}`
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2Icon className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  const availableGuilds = discordGuilds.filter(
    (guild) => !userServers.some((userServer) => userServer.serverId === guild.id),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="rounded-full" />
          <h1 className="text-xl font-bold text-gray-900">Dash</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Image
                src={session?.user?.image || "/placeholder-user.jpg"}
                alt="User Avatar"
                width={36}
                height={36}
                className="rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Your Servers</h2>
          <Dialog open={isAddServerDialogOpen} onOpenChange={setIsAddServerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                <PlusIcon className="mr-2 h-5 w-5" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Add a Server</DialogTitle>
                <CardDescription className="text-gray-600">
                  Select a Discord server to manage with Dash. Only servers where you have Administrator or Manage
                  Server permissions are shown.
                </CardDescription>
              </DialogHeader>
              <Separator className="my-4" />
              {loadingGuilds ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2Icon className="h-8 w-8 animate-spin text-gray-500 mb-4" />
                  <p className="text-gray-600">Loading your Discord servers...</p>
                </div>
              ) : guildsError ? (
                <Alert variant="destructive">
                  <XCircleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{guildsError}</AlertDescription>
                  <Button onClick={fetchDiscordGuilds} className="mt-2 bg-transparent" variant="outline">
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
                  <Button onClick={fetchDiscordGuilds} className="mt-4 bg-transparent" variant="outline">
                    <RefreshCcwIcon className="mr-2 h-4 w-4" /> Refresh List
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid gap-4">
                    {availableGuilds.map((guild) => (
                      <Card key={guild.id} className="flex items-center p-3 shadow-sm">
                        <Image
                          src={getGuildIcon(guild) || "/placeholder.svg"}
                          alt={guild.name}
                          width={40}
                          height={40}
                          className="rounded-full mr-4"
                        />
                        <div className="flex-grow">
                          <h3 className="font-semibold text-gray-800">{guild.name}</h3>
                          <p className="text-sm text-gray-500">
                            {guild.approximate_member_count
                              ? `${guild.approximate_member_count} members`
                              : "N/A members"}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddServer(guild)}
                          disabled={addingServer === guild.id}
                          className="ml-auto"
                        >
                          {addingServer === guild.id ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {addServerError && (
                <Alert variant="destructive" className="mt-4">
                  <XCircleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{addServerError}</AlertDescription>
                </Alert>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {loadingUserServers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-10 w-24" />
              </Card>
            ))}
          </div>
        ) : userServers.length === 0 ? (
          <div className="text-center py-16">
            <BotIcon className="mx-auto h-20 w-20 text-gray-400 mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No servers added yet!</h3>
            <p className="text-gray-600 mb-6">Click the "Add Server" button above to get started.</p>
            <Dialog open={isAddServerDialogOpen} onOpenChange={setIsAddServerDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Add Your First Server
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">Add a Server</DialogTitle>
                  <CardDescription className="text-gray-600">
                    Select a Discord server to manage with Dash. Only servers where you have Administrator or Manage
                    Server permissions are shown.
                  </CardDescription>
                </DialogHeader>
                <Separator className="my-4" />
                {loadingGuilds ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2Icon className="h-8 w-8 animate-spin text-gray-500 mb-4" />
                    <p className="text-gray-600">Loading your Discord servers...</p>
                  </div>
                ) : guildsError ? (
                  <Alert variant="destructive">
                    <XCircleIcon className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{guildsError}</AlertDescription>
                    <Button onClick={fetchDiscordGuilds} className="mt-2 bg-transparent" variant="outline">
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
                    <Button onClick={fetchDiscordGuilds} className="mt-4 bg-transparent" variant="outline">
                      <RefreshCcwIcon className="mr-2 h-4 w-4" /> Refresh List
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="grid gap-4">
                      {availableGuilds.map((guild) => (
                        <Card key={guild.id} className="flex items-center p-3 shadow-sm">
                          <Image
                            src={getGuildIcon(guild) || "/placeholder.svg"}
                            alt={guild.name}
                            width={40}
                            height={40}
                            className="rounded-full mr-4"
                          />
                          <div className="flex-grow">
                            <h3 className="font-semibold text-gray-800">{guild.name}</h3>
                            <p className="text-sm text-gray-500">
                              {guild.approximate_member_count
                                ? `${guild.approximate_member_count} members`
                                : "N/A members"}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleAddServer(guild)}
                            disabled={addingServer === guild.id}
                            className="ml-auto"
                          >
                            {addingServer === guild.id ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Add"}
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                {addServerError && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircleIcon className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{addServerError}</AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userServers.map((server) => (
              <Card key={server.serverId} className="p-4 flex flex-col items-center text-center shadow-sm">
                <Image
                  src={server.serverIcon || "/placeholder-logo.svg"}
                  alt={server.serverName}
                  width={80}
                  height={80}
                  className="rounded-full mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{server.serverName}</h3>
                {server.isBotAdded ? (
                  <div className="flex items-center text-green-600 mb-4">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span>Bot Added</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-red-500 mb-4">
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    <span>Bot Not Added</span>
                    <a
                      href={getBotInviteLink(server.serverId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-2"
                    >
                      Invite the bot
                    </a>
                  </div>
                )}
                <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  <Link href={`/dashboard/server/${server.serverId}`}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Configure
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
