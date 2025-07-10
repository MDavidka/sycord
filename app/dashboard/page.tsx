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
  Loader2Icon,
  ServerIcon,
  UserIcon,
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
        await fetchUserData()
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

  const toggleBotStatus = async (serverId: string) => {
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
      console.error("Toggle bot error:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="rounded-full" />
              <h1 className="text-2xl font-bold text-gray-900">Dash Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              {session?.user && (
                <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-gray-500 text-xs">{session.user.email}</p>
                  </div>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Image
                      src={session?.user?.image || "/placeholder-user.jpg"}
                      alt="User Avatar"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session?.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Servers</h2>
            <p className="text-gray-600 mt-1">Manage your Discord servers</p>
          </div>

          <Dialog open={isAddServerDialogOpen} onOpenChange={setIsAddServerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusIcon className="mr-2 h-5 w-5" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add a Server</DialogTitle>
                <CardDescription>Select a server to add to your dashboard.</CardDescription>
              </DialogHeader>
              <Separator />

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {availableGuilds.map((guild) => (
                      <Card key={guild.id} className="hover:bg-gray-50">
                        <CardContent className="flex items-center p-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                            <ServerIcon className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-semibold">{guild.name}</h3>
                            <p className="text-sm text-gray-500">{guild.approximate_member_count} members</p>
                          </div>
                          <Button
                            onClick={() => handleAddServer(guild)}
                            disabled={addingServer === guild.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {addingServer === guild.id ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Add"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Server Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
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
              Click the "Add Server" button to start managing your Discord servers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userServers.map((server) => (
              <Card key={server.serverId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <ServerIcon className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{server.serverName}</h3>

                    <div className="flex items-center mb-4">
                      {server.isBotAdded ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          <span className="font-medium">Bot Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          <span className="font-medium">Bot Inactive</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 w-full">
                      <Button
                        onClick={() => toggleBotStatus(server.serverId)}
                        className={`flex-1 ${
                          server.isBotAdded ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                        } text-white`}
                      >
                        {server.isBotAdded ? "Disable" : "Enable"}
                      </Button>
                      <Button asChild variant="outline" className="flex-1 bg-transparent">
                        <Link href={`/dashboard/server/${server.serverId}`}>
                          <SettingsIcon className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </Button>
                    </div>
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
