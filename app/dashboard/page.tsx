"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, Plus, RefreshCw, Server } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ServerData {
  id: string
  name: string
  icon?: string
  isBotAdded?: boolean
}

interface DiscordGuild {
  id: string
  name: string
  icon?: string
  owner: boolean
  permissions: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [servers, setServers] = useState<ServerData[]>([])
  const [discordGuilds, setDiscordGuilds] = useState<DiscordGuild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addingServer, setAddingServer] = useState<string | null>(null)
  const [loadingGuilds, setLoadingGuilds] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchUserServers()
    }
  }, [status, router])

  const fetchUserServers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/user-servers")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setServers(data.servers || [])
    } catch (err) {
      console.error("Error fetching servers:", err)
      setError("Failed to load your servers. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchDiscordGuilds = async () => {
    try {
      setLoadingGuilds(true)
      setError(null)
      const response = await fetch("/api/discord/guilds")

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Discord authentication expired. Please log in again.")
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const guilds = await response.json()

      // Filter out guilds that are already added
      const serverIds = servers.map((server) => server.id)
      const filteredGuilds = guilds.filter((guild: DiscordGuild) => !serverIds.includes(guild.id))

      setDiscordGuilds(filteredGuilds)
    } catch (err: any) {
      console.error("Error fetching Discord guilds:", err)
      setError(err.message || "Failed to load Discord servers. Please try again.")
    } finally {
      setLoadingGuilds(false)
    }
  }

  const handleAddServer = async (guild: DiscordGuild) => {
    try {
      setAddingServer(guild.id)
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

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      // Refresh the server list
      await fetchUserServers()

      // Close the dialog
      setDialogOpen(false)
    } catch (err) {
      console.error("Error adding server:", err)
      setError("Failed to add server. Please try again.")
    } finally {
      setAddingServer(null)
    }
  }

  const handleOpenDialog = () => {
    setDialogOpen(true)
    fetchDiscordGuilds()
  }

  const getServerIcon = (server: ServerData) => {
    if (server.icon) {
      return server.icon
    }
    return null
  }

  const getServerInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Server
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : servers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((server) => (
            <Card key={server.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={getServerIcon(server) || ""} alt={server.name} />
                    <AvatarFallback>{getServerInitials(server.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{server.name}</CardTitle>
                    <CardDescription>{server.isBotAdded ? "Bot added" : "Bot not added"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-20 flex items-center justify-center">
                  {server.isBotAdded ? (
                    <p className="text-green-500">Ready to configure</p>
                  ) : (
                    <p className="text-amber-500">Invite the bot to start configuring</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => router.push(`/dashboard/server/${server.id}`)}>
                  {server.isBotAdded ? "Configure" : "Setup"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No servers added yet</CardTitle>
            <CardDescription>Add a Discord server to get started with DashBot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <Server className="h-16 w-16 text-gray-400" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Server
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Discord Server</DialogTitle>
            <DialogDescription>Select a Discord server to add to your dashboard.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingGuilds ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))}
              </div>
            ) : discordGuilds.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {discordGuilds.map((guild) => (
                  <div key={guild.id} className="flex items-center gap-3 p-2 border rounded-md">
                    <Avatar>
                      <AvatarImage
                        src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : ""}
                        alt={guild.name}
                      />
                      <AvatarFallback>{getServerInitials(guild.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{guild.name}</p>
                    </div>
                    <Button size="sm" onClick={() => handleAddServer(guild)} disabled={addingServer === guild.id}>
                      {addingServer === guild.id ? "Adding..." : "Add"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No available servers found</p>
                <Button variant="outline" onClick={fetchDiscordGuilds} disabled={loadingGuilds}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <div className="text-sm text-gray-500">Only servers where you have admin permissions are shown.</div>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
