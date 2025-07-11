"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, ChevronDown, Search, Bot, Check, X } from "lucide-react"
import Image from "next/image"
import ServerCard from "@/components/server-card"

interface UserServer {
  serverId: string
  serverName: string
  serverIcon?: string
  isBotAdded: boolean
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)
  const [isAddingBot, setIsAddingBot] = useState(false)
  const [botAddStatus, setBotAddStatus] = useState<"idle" | "adding" | "success" | "error">("idle")
  const [botAddError, setBotAddError] = useState<string | null>(null)

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
      const response = await fetch("/api/user-servers")
      if (response.ok) {
        const data = await response.json()
        setUserServers(data.servers || [])
      } else {
        console.error("Failed to fetch user servers")
      }
    } catch (error) {
      console.error("Error fetching user servers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBotToServer = async () => {
    if (!selectedServerId) return

    setIsAddingBot(true)
    setBotAddStatus("adding")
    setBotAddError(null)

    try {
      const response = await fetch("/api/invite-server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId: selectedServerId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.inviteUrl) {
          window.open(data.inviteUrl, "_blank")
          setBotAddStatus("success")
          // After successful invite, poll for bot status or refresh after a delay
          setTimeout(() => {
            fetchUserServers()
            setIsAddingBot(false)
            setSelectedServerId(null)
          }, 5000) // Give Discord bot some time to join
        } else {
          setBotAddStatus("error")
          setBotAddError("Failed to get invite URL.")
          setIsAddingBot(false)
        }
      } else {
        const errorData = await response.json()
        setBotAddStatus("error")
        setBotAddError(errorData.error || "Failed to invite bot to server.")
        setIsAddingBot(false)
      }
    } catch (error: any) {
      setBotAddStatus("error")
      setBotAddError(error.message || "An unexpected error occurred.")
      setIsAddingBot(false)
    }
  }

  const filteredServers = userServers.filter(
    (server) =>
      server.serverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.serverId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  if (!session) {
    return null // Should redirect to login due to useEffect
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
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
                    <span className="truncate max-w-32">{session.user?.name || "User"}</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/api/auth/signout")}>Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Your Servers</h2>

        {userServers.length === 0 && !loading ? (
          <Card className="glass-card max-w-md mx-auto text-center py-12">
            <CardContent>
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Servers Found</h3>
              <p className="text-gray-400 mb-6">
                It looks like you haven't added any servers yet, or the bot isn't in any of your servers.
              </p>
              <Button onClick={() => setIsAddingBot(true)} className="bg-white text-black hover:bg-gray-200">
                <Plus className="h-4 w-4 mr-2" />
                Add Sycord to a Server
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search your servers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServers.map((server) => (
                <ServerCard
                  key={server.serverId}
                  serverId={server.serverId}
                  serverName={server.serverName}
                  serverIcon={server.serverIcon}
                  isBotAdded={server.isBotAdded}
                />
              ))}
              <Card
                className="glass-card flex items-center justify-center p-6 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setIsAddingBot(true)}
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 text-white mx-auto mb-2" />
                  <p className="text-white text-lg font-medium">Add New Server</p>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Add Bot Modal */}
        {isAddingBot && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="glass-card max-w-md w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Add Sycord to a Server</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingBot(false)} className="text-white">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <CardDescription className="text-gray-400">Select a server to invite the Sycord bot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label htmlFor="server-select" className="text-white">
                  Select Server
                </Label>
                <Select value={selectedServerId || ""} onValueChange={setSelectedServerId}>
                  <SelectTrigger id="server-select" className="bg-black/60 border-white/20 text-white">
                    <SelectValue placeholder="Choose a server" />
                  </SelectTrigger>
                  <SelectContent>
                    {userServers
                      .filter((server) => !server.isBotAdded)
                      .map((server) => (
                        <SelectItem key={server.serverId} value={server.serverId}>
                          <div className="flex items-center space-x-2">
                            {server.serverIcon ? (
                              <Image
                                src={`https://cdn.discordapp.com/icons/${server.serverId}/${server.serverIcon}.png?size=32`}
                                alt={server.serverName}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gray-600 rounded"></div>
                            )}
                            <span>{server.serverName}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {botAddStatus === "adding" && (
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Bot className="h-5 w-5 animate-bounce" />
                    <span>Inviting bot... Please check your Discord server.</span>
                  </div>
                )}
                {botAddStatus === "success" && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="h-5 w-5" />
                    <span>Bot invited! Redirecting to server config...</span>
                  </div>
                )}
                {botAddStatus === "error" && (
                  <div className="flex items-center space-x-2 text-red-400">
                    <X className="h-5 w-5" />
                    <span>Error: {botAddError}</span>
                  </div>
                )}

                <Button
                  onClick={handleAddBotToServer}
                  disabled={!selectedServerId || botAddStatus === "adding"}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  {botAddStatus === "adding" ? "Inviting..." : "Invite Bot"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
