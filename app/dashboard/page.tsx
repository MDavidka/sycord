"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, LogIn, Server } from "lucide-react"
import Image from "next/image"
import { ServerCard } from "@/components/server-card"

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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [discordServers, setDiscordServers] = useState<DiscordGuild[]>([])
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchServers()
    }
  }, [status, router])

  const fetchServers = async () => {
    try {
      setLoading(true)
      setError(null)

      const [discordResponse, userResponse] = await Promise.all([
        fetch("/api/discord/guilds"),
        fetch("/api/user-servers"),
      ])

      if (!discordResponse.ok) {
        const errorData = await discordResponse.json()
        throw new Error(errorData.error || "Failed to fetch Discord servers.")
      }
      const discordData = await discordResponse.json()
      setDiscordServers(discordData.guilds)

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || "Failed to fetch user's configured servers.")
      }
      const userData = await userResponse.json()
      setUserServers(userData.servers)
    } catch (err: any) {
      console.error("Error fetching servers:", err)
      setError(err.message || "An unexpected error occurred while fetching servers.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddBot = async (serverId: string, serverName: string, serverIcon?: string) => {
    try {
      const response = await fetch("/api/invite-server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId, serverName, serverIcon }),
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.inviteUrl, "_blank")
        // After inviting, we should ideally poll or refetch to update the bot status
        setTimeout(fetchServers, 5000) // Re-fetch after 5 seconds to check bot status
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to generate invite link.")
      }
    } catch (err: any) {
      console.error("Error inviting bot:", err)
      setError(err.message || "An unexpected error occurred during bot invitation.")
    }
  }

  const getBotStatus = (serverId: string) => {
    const userServer = userServers.find((s) => s.serverId === serverId)
    return userServer ? userServer.isBotAdded : false
  }

  const getBotConfigured = (serverId: string) => {
    return userServers.some((s) => s.serverId === serverId)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-white">Loading servers...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/new-blue-logo.png" alt="Sycord Bot" width={28} height={28} className="rounded-lg" />
              <div>
                <h1 className="text-lg font-bold text-white">
                  <span className="text-white">Sycord</span>
                </h1>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
                    <span className="truncate max-w-32">{session?.user?.name || "User"}</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => router.push("/api/auth/signout")}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Your Servers</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discordServers.length === 0 && !loading && (
            <Card className="glass-card col-span-full text-center py-12">
              <Server className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Servers Found</h3>
              <p className="text-gray-400">
                It looks like you don't have any Discord servers where you can add the bot.
              </p>
            </Card>
          )}

          {discordServers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              isBotAdded={getBotStatus(server.id)}
              isBotConfigured={getBotConfigured(server.id)}
              onAddBot={handleAddBot}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
