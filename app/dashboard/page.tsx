"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PlusIcon, Loader2, XCircle, ExternalLink } from "lucide-react"
import Image from "next/image"
import { ServerCard } from "@/components/server-card"
import type { UserServer, BotServer, DiscordGuild } from "@/lib/types" // Assuming these types exist

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [botServers, setBotServers] = useState<BotServer[]>([])
  const [availableGuilds, setAvailableGuilds] = useState<DiscordGuild[]>([])
  const [loadingUserServers, setLoadingUserServers] = useState(true)
  const [loadingBotServers, setLoadingBotServers] = useState(true)
  const [loadingAvailableGuilds, setLoadingAvailableGuilds] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAddServerDialogOpen, setIsAddServerDialogOpen] = useState(false)
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)
  const [isAddingServer, setIsAddingServer] = useState(false)
  const [addServerError, setAddServerError] = useState<string | null>(null)

  const [showBotInviteDialog, setShowBotInviteDialog] = useState(false)
  const [botInviteServerId, setBotInviteServerId] = useState<string | null>(null)
  const [botInviteLink, setBotInviteLink] = useState<string | null>(null)
  const [isVerifyingBot, setIsVerifyingBot] = useState(false)
  const [botVerificationError, setBotVerificationError] = useState<string | null>(null)

  // Ensure NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID is available in the client environment
  const BOT_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchUserServers = async () => {
    setLoadingUserServers(true)
    setError(null)
    try {
      const res = await fetch("/api/user-servers")
      if (!res.ok) {
        throw new Error(`Failed to fetch user servers: ${res.statusText}`)
      }
      const data = await res.json()
      setUserServers(data.servers)
    } catch (err: any) {
      console.error("Error fetching user servers:", err)
      setError(err.message || "Failed to load your servers.")
    } finally {
      setLoadingUserServers(false)
    }
  }

  const fetchBotServers = async () => {
    setLoadingBotServers(true)
    try {
      const res = await fetch("/api/bot-servers")
      if (!res.ok) {
        throw new Error(`Failed to fetch bot servers: ${res.statusText}`)
      }
      const data = await res.json()
      setBotServers(data.servers)
    } catch (err: any) {
      console.error("Error fetching bot servers:", err)
      // Don't set global error for bot servers, as it's not critical for user dashboard
    } finally {
      setLoadingBotServers(false)
    }
  }

  const fetchAvailableGuilds = async () => {
    setLoadingAvailableGuilds(true)
    try {
      const res = await fetch("/api/discord/guilds")
      if (!res.ok) {
        throw new Error(`Failed to fetch Discord guilds: ${res.statusText}`)
      }
      const data = await res.json()
      setAvailableGuilds(data.guilds)
    } catch (err: any) {
      console.error("Error fetching available guilds:", err)
      setError(err.message || "Failed to load available Discord servers.")
    } finally {
      setLoadingAvailableGuilds(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserServers()
      fetchBotServers()
      fetchAvailableGuilds()
    }
  }, [status])

  // Filter available guilds to only show those the user manages and the bot is not already in
  const filteredAvailableGuilds = useMemo(() => {
    const userServerIds = new Set(userServers.map((s) => s.id))
    const botServerIds = new Set(botServers.map((s) => s.id))

    return availableGuilds.filter(
      (guild) =>
        guild.permissions.includes("MANAGE_GUILD") &&
        !userServerIds.has(guild.id) && // Not already added to user's dashboard
        !botServerIds.has(guild.id), // Bot is not already in the server
    )
  }, [availableGuilds, userServers, botServers])

  const handleAddServer = async (guildId: string) => {
    setSelectedGuildId(guildId)
    setIsAddingServer(true)
    setAddServerError(null)
    setBotVerificationError(null)
    setShowBotInviteDialog(false) // Ensure this is false initially

    try {
      // Step 1: Add server to user's dashboard
      const selectRes = await fetch("/api/select-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: guildId }),
      })

      if (!selectRes.ok) {
        const errorData = await selectRes.json()
        throw new Error(errorData.error || "Failed to add server to dashboard.")
      }

      // Step 2: Verify bot presence
      setIsVerifyingBot(true)
      const verifyRes = await fetch(`/api/verify-bot/${guildId}`)
      if (!verifyRes.ok) {
        const errorData = await verifyRes.json()
        throw new Error(errorData.error || "Failed to verify bot presence.")
      }
      const verifyData = await verifyRes.json()

      if (verifyData.botAdded) {
        // Bot is already added, redirect to config page
        router.push(`/dashboard/server/${guildId}`)
      } else {
        // Bot not added, show invite dialog
        setBotInviteServerId(guildId)
        setBotInviteLink(
          `https://discord.com/oauth2/authorize?client_id=${BOT_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${guildId}&disable_guild_select=true`,
        )
        setShowBotInviteDialog(true)
      }

      // Refresh server lists in background
      fetchUserServers()
      fetchBotServers()
    } catch (err: any) {
      console.error("Error during add server process:", err)
      setAddServerError(err.message || "An unexpected error occurred.")
    } finally {
      setIsAddingServer(false)
      setIsVerifyingBot(false)
    }
  }

  // Polling for bot status when invite dialog is open
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (showBotInviteDialog && botInviteServerId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/verify-bot/${botInviteServerId}`)
          if (!res.ok) {
            throw new Error("Failed to poll bot status.")
          }
          const data = await res.json()
          if (data.botAdded) {
            clearInterval(interval!)
            setShowBotInviteDialog(false)
            router.push(`/dashboard/server/${botInviteServerId}`)
          }
        } catch (err: any) {
          console.error("Error polling bot status:", err)
          setBotVerificationError(err.message || "Failed to verify bot status.")
          clearInterval(interval!) // Stop polling on error
        }
      }, 5000) // Poll every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showBotInviteDialog, botInviteServerId, router, BOT_CLIENT_ID]) // Added BOT_CLIENT_ID to dependencies

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Servers</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loadingUserServers ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="w-full bg-white border border-gray-200 shadow-sm animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))
        ) : userServers.length === 0 ? (
          <Card className="col-span-full text-center py-8 bg-white border border-gray-200 shadow-sm">
            <CardTitle className="text-xl font-semibold text-gray-800">No servers added yet.</CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              Add your first Discord server to get started.
            </CardDescription>
          </Card>
        ) : (
          userServers.map((server) => {
            const isBotAdded = botServers.some((botServer) => botServer.id === server.id)
            return (
              <ServerCard
                key={server.id}
                server={server}
                isBotAdded={isBotAdded}
                onConfigure={() => router.push(`/dashboard/server/${server.id}`)}
                onInvite={() => {
                  setBotInviteServerId(server.id)
                  setBotInviteLink(
                    `https://discord.com/oauth2/authorize?client_id=${BOT_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${server.id}&disable_guild_select=true`,
                  )
                  setShowBotInviteDialog(true)
                }}
              />
            )
          })
        )}

        {/* Add Server Card */}
        <AlertDialog open={isAddServerDialogOpen} onOpenChange={setIsAddServerDialogOpen}>
          <AlertDialogTrigger asChild>
            <Card className="w-full h-full flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
              <PlusIcon className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-xl font-semibold text-gray-800">Add a Server</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Connect a new Discord server to manage.
              </CardDescription>
            </Card>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white border border-gray-200 shadow-lg p-6 rounded-lg max-w-2xl w-full">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold text-gray-900">Select a Server</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Choose a Discord server you manage to add to your dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {loadingAvailableGuilds ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card
                    key={i}
                    className="flex items-center p-4 space-x-4 bg-gray-50 border border-gray-200 shadow-sm animate-pulse"
                  >
                    <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </Card>
                ))
              ) : filteredAvailableGuilds.length === 0 ? (
                <p className="col-span-full text-center text-gray-600 py-4">
                  No new servers found that you can manage.
                </p>
              ) : (
                filteredAvailableGuilds.map((guild) => (
                  <Card
                    key={guild.id}
                    className="flex items-center p-4 space-x-4 bg-white border border-gray-200 shadow-sm" // Explicitly white style
                  >
                    <Image
                      src={
                        guild.icon
                          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                          : "/placeholder-logo.png"
                      }
                      alt={guild.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{guild.name}</h3>
                      <p className="text-sm text-gray-500">{guild.owner ? "Owner" : "Admin"}</p>
                    </div>
                    <Button
                      onClick={() => handleAddServer(guild.id)}
                      disabled={isAddingServer && selectedGuildId === guild.id}
                    >
                      {isAddingServer && selectedGuildId === guild.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <PlusIcon className="h-4 w-4 mr-2" />
                      )}
                      {isAddingServer && selectedGuildId === guild.id ? "Adding..." : "Add"}
                    </Button>
                  </Card>
                ))
              )}
            </div>
            {addServerError && <p className="text-red-500 text-sm mt-4 text-center">{addServerError}</p>}
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel asChild>
                <Button variant="outline" onClick={() => setIsAddServerDialogOpen(false)}>
                  Cancel
                </Button>
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Bot Invite Dialog */}
      <AlertDialog open={showBotInviteDialog} onOpenChange={setShowBotInviteDialog}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg p-6 rounded-lg max-w-md w-full text-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-900">Bot Not Added</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              The bot is not yet in this server. Please invite it to enable full functionality.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {isVerifyingBot ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <p className="text-gray-700">Waiting for bot to join...</p>
              </>
            ) : botVerificationError ? (
              <>
                <XCircle className="h-8 w-8 text-red-500" />
                <p className="text-red-500">{botVerificationError}</p>
                <Button
                  onClick={() => {
                    setIsVerifyingBot(true)
                    setBotVerificationError(null)
                    // Re-trigger polling by setting state, or call a specific poll function
                    // For simplicity, we'll just re-open the dialog which triggers the useEffect
                    setShowBotInviteDialog(false)
                    setTimeout(() => setShowBotInviteDialog(true), 100)
                  }}
                >
                  Retry
                </Button>
              </>
            ) : (
              <>
                {/* This icon is for visual clarity, not indicating bot is added */}
                <p className="text-gray-700">Click the button below to invite the bot to your server:</p>
                {botInviteLink && (
                  <Button asChild size="lg" className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                    <a href={botInviteLink} target="_blank" rel="noopener noreferrer">
                      Invite Bot <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>
          <AlertDialogFooter className="mt-6 flex justify-center">
            <AlertDialogAction asChild>
              <Button onClick={() => setShowBotInviteDialog(false)}>Close</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
