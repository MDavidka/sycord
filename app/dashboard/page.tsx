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
  TrendingUpIcon,
  BotIcon,
  MenuIcon,
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Vezérlőpult betöltése...</p>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto mobile-optimized py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="object-cover" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">Dash Vezérlőpult</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Kezeld a Discord szervereidet</p>
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
                      Kijelentkezés
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

      <main className="max-w-7xl mx-auto py-6 sm:py-8 mobile-optimized">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="modern-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <ServerIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{adminServers.length}</p>
                  <p className="text-xs text-muted-foreground">Elérhető szerver</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{userServers.length}</p>
                  <p className="text-xs text-muted-foreground">Aktív szerver</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <BotIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {userServers.filter((s) => s.isBotAdded).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Bot hozzáadva</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">100%</p>
                  <p className="text-xs text-muted-foreground">Üzemidő</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Servers */}
        {adminServers.length > 0 && (
          <section className="mb-8 sm:mb-12 animate-slide-up">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <ServerIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Elérhető Szerverek</h2>
              <Badge variant="secondary" className="text-xs">
                {adminServers.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {adminServers.map((server) => {
                const isAdded = userServers.some((us) => us.serverId === server.id)

                return (
                  <Card key={server.id} className="modern-card group hover:scale-105 transition-all duration-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          {server.icon ? (
                            <Image
                              src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                              alt={server.name}
                              width={48}
                              height={48}
                              className="object-cover"
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
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          {addingServer === server.id ? (
                            <>
                              <Loader2Icon className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              Hozzáadás...
                            </>
                          ) : (
                            <>
                              <PlusIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Szerver Hozzáadása
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge className="w-full justify-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-900 text-xs">
                          <CheckCircleIcon className="mr-1 h-3 w-3" />
                          Hozzáadva
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
              <SettingsIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Saját Szervereim</h2>
              <Badge variant="secondary" className="text-xs">
                {userServers.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {userServers.map((server) => (
                <Card key={server.serverId} className="modern-card group hover:scale-105 transition-all duration-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        <ServerIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate text-sm sm:text-base">
                          {server.serverName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Hozzáadva: {new Date(server.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {server.isBotAdded ? (
                          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs">
                            <CheckCircleIcon className="mr-1 h-3 w-3" />
                            Bot Aktív
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <XCircleIcon className="mr-1 h-3 w-3" />
                            Bot Hiányzik
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      {server.isBotAdded ? (
                        <Button
                          onClick={() => router.push(`/dashboard/server/${server.serverId}`)}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          <SettingsIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Konfigurálás
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => window.open(getInviteLink(server.serverId), "_blank")}
                            variant="outline"
                            className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                          >
                            <ExternalLinkIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Bot Meghívása
                          </Button>
                          <Button
                            onClick={() => handleToggleBotStatus(server.serverId)}
                            variant="outline"
                            size="sm"
                            className="h-8 sm:h-9 px-2 sm:px-3"
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
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <ServerIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">Nincsenek szerverek</h3>
            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
              Adminisztrátori jogosultságra van szükséged egy Discord szerveren a hozzáadáshoz.
            </p>
            <Button onClick={fetchUserData} variant="outline" className="text-sm sm:text-base bg-transparent">
              Frissítés
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
