"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  SaveIcon,
  ArrowLeftIcon,
  SettingsIcon,
  LogOutIcon,
  UserIcon,
  ChevronDownIcon,
  HomeIcon,
  ShieldIcon,
  HeadphonesIcon,
  CalendarIcon,
  PuzzleIcon,
  PlugIcon,
  UsersIcon,
  BotIcon,
  CrownIcon,
  TrendingUpIcon,
  ActivityIcon,
  ClockIcon,
  AlertTriangleIcon,
  InfoIcon,
  ShieldCheckIcon,
  MenuIcon,
  SparklesIcon,
  ZapIcon,
  MessageSquareIcon,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { signOut } from "next-auth/react"

interface ServerSettings {
  serverId: string
  serverName: string
  userId: string
  botStatus: "online" | "offline" | "maintenance"
  serverStats: {
    totalMembers: number
    totalBots: number
    totalAdmins: number
  }
  changelog: {
    visible: boolean
    title: string
    content: string
    version: string
    date: string
  }
  moderation: {
    moderationLevel: "off" | "basic" | "advanced"
    linkFilter: {
      enabled: boolean
      config: "all_links" | "whitelist_only" | "phishing_only"
      whitelist: string[]
    }
    badWordFilter: {
      enabled: boolean
      customWords: string[]
    }
    raidProtection: {
      enabled: boolean
      threshold: number
    }
    suspiciousAccounts: {
      enabled: boolean
      minAgeDays: number
    }
    autoRole: {
      enabled: boolean
      roleId: string
    }
  }
  support: {
    welcome: {
      enabled: boolean
      channelId: string
      message: string
      dmEnabled: boolean
    }
    ticketSystem: {
      enabled: boolean
      channelId: string
      priorityRoleId: string
      categories: string[]
    }
    autoAnswer: {
      enabled: boolean
      qaPairs: string
    }
  }
  events: {
    dailyMessages: {
      enabled: boolean
      time: string
      channelId: string
      message: string
    }
    joinLeave: {
      enabled: boolean
      joinChannelId: string
      leaveChannelId: string
      joinMessage: string
      leaveMessage: string
    }
    keywordReactions: {
      enabled: boolean
      keywords: Array<{ word: string; reaction: string }>
    }
  }
  integrations: {
    giveaway: {
      enabled: boolean
      defaultChannelId: string
    }
  }
  plugins: {
    enabled: string[]
    available: string[]
  }
  settings: {
    logs: {
      enabled: boolean
      channelId: string
      messageEdits: boolean
      modActions: boolean
      memberJoins: boolean
      memberLeaves: boolean
    }
  }
}

export default function ServerConfigPage() {
  const { serverId } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [config, setConfig] = useState<ServerSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Check if user is admin
  const isAdmin = session?.user?.email === "dmarton336@gmail.com"

  useEffect(() => {
    if (status === "authenticated" && serverId) {
      fetchServerConfig()
    }
  }, [status, serverId])

  const fetchServerConfig = async () => {
    setLoading(true)
    try {
      const id = Array.isArray(serverId) ? serverId[0] : serverId
      const response = await fetch(`/api/settings/${id}`)
      const data = await response.json()

      if (response.ok) {
        setConfig(data)
      } else {
        console.error("Error fetching server config:", data.error)
      }
    } catch (error) {
      console.error("Fetch server config error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (path: string, value: any) => {
    setConfig((prev) => {
      if (!prev) return null

      const newConfig = { ...prev }
      const keys = path.split(".")
      let current: any = newConfig

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value

      return newConfig
    })
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleSaveConfig = async () => {
    if (!config || !serverId) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const id = Array.isArray(serverId) ? serverId[0] : serverId
      const response = await fetch(`/api/settings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError(data.error || "Failed to save configuration.")
      }
    } catch (error) {
      setSaveError("An unexpected error occurred while saving configuration.")
      console.error("Save config error:", error)
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Szerver konfiguráció betöltése...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background mobile-optimized">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Konfiguráció nem található</h2>
          <p className="text-muted-foreground text-center mb-6 text-sm sm:text-base max-w-md">
            Nem sikerült betölteni a szerver konfigurációt. Kérjük próbálja újra.
          </p>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Vissza a vezérlőpulthoz
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto mobile-optimized py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Image src="/bot-icon.png" alt="Dash Bot" width={32} height={32} className="rounded-full" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Dash</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Szerver Konfiguráció</p>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center space-x-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center space-x-3 mb-6">
                      <Image
                        src="/placeholder-logo.svg"
                        alt={config.serverName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <p className="font-medium text-foreground">{config.serverName}</p>
                        <p className="text-xs text-muted-foreground">Szerver ID: {config.serverId.slice(0, 8)}...</p>
                      </div>
                    </div>

                    {session?.user && (
                      <div className="flex items-center space-x-3 mb-6 p-3 bg-muted rounded-lg">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{session.user.name}</p>
                          <p className="text-xs text-muted-foreground">{session.user.email}</p>
                        </div>
                      </div>
                    )}

                    <Button onClick={() => router.push("/dashboard")} variant="ghost" className="justify-start mb-2">
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      Vissza a vezérlőpulthoz
                    </Button>

                    <Button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      variant="ghost"
                      className="justify-start text-muted-foreground hover:text-foreground mt-auto"
                    >
                      <LogOutIcon className="h-4 w-4 mr-2" />
                      Kijelentkezés
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Server Chooser */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex items-center space-x-2 bg-transparent">
                    <Image
                      src="/placeholder-logo.svg"
                      alt={config.serverName}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <span className="font-medium text-sm max-w-32 truncate">{config.serverName}</span>
                    <ChevronDownIcon className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel className="text-xs">Szerver váltás</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")} className="text-xs">
                    <ArrowLeftIcon className="mr-2 h-3 w-3" />
                    Vissza a vezérlőpulthoz
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Desktop User Info */}
              {session?.user && (
                <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-muted rounded-md">
                  <UserIcon className="h-3 w-3 text-muted-foreground" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">{session.user.name}</p>
                    <p className="text-muted-foreground">{session.user.email}</p>
                  </div>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex relative h-8 w-8 rounded-full">
                    <Image
                      src={session?.user?.image || "/placeholder-user.jpg"}
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-medium leading-none text-foreground">{session?.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs" onClick={() => router.push("/settings")}>
                    <SettingsIcon className="mr-2 h-3 w-3" />
                    Beállítások
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs" onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOutIcon className="mr-2 h-3 w-3" />
                    Kijelentkezés
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 mobile-optimized">
        <Tabs defaultValue="home" className="w-full">
          {/* Scrollable Tabs - All Visible */}
          <div className="mb-4 sm:mb-6">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-8 sm:h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="home" className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7">
                  <HomeIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Főoldal</span>
                </TabsTrigger>
                <TabsTrigger value="sentinel" className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7">
                  <ShieldIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Sentinel</span>
                </TabsTrigger>
                <TabsTrigger value="helpdesk" className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7">
                  <HeadphonesIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Helpdesk</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Events</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7">
                  <PuzzleIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Integrations</span>
                </TabsTrigger>
                <TabsTrigger value="plugins" className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7">
                  <PlugIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Plugins</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7">
                  <SettingsIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                {/* Admin Tab - Only visible for specific user */}
                {isAdmin && (
                  <TabsTrigger
                    value="admin"
                    className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 bg-destructive/10 text-destructive"
                  >
                    <ShieldCheckIcon className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">Admin</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Home Tab - Főoldal */}
          <TabsContent value="home" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Hero Illustration */}
              <Card className="modern-card bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                        <BotIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-background animate-bounce"></div>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">
                        Üdvözöl a {config.serverName} konfigurációjában!
                      </h2>
                      <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
                        Itt kezelheted a bot összes funkcióját és beállítását.
                      </p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <SparklesIcon className="mr-1 h-3 w-3" />
                          AI Moderáció
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <ZapIcon className="mr-1 h-3 w-3" />
                          Gyors Beállítás
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <MessageSquareIcon className="mr-1 h-3 w-3" />
                          24/7 Támogatás
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bot Status - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <BotIcon className="h-4 w-4" />
                    <span>Bot Státusz</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          config.botStatus === "online"
                            ? "bg-green-500 animate-pulse"
                            : config.botStatus === "maintenance"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <span className="font-medium text-sm">
                        {config.botStatus === "online"
                          ? "Elérhető"
                          : config.botStatus === "maintenance"
                            ? "Karbantartás"
                            : "Nem elérhető"}
                      </span>
                    </div>
                    <Badge
                      variant={config.botStatus === "online" ? "default" : "secondary"}
                      className={`text-xs ${
                        config.botStatus === "online"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : config.botStatus === "maintenance"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}
                    >
                      {config.botStatus === "online"
                        ? "Aktív"
                        : config.botStatus === "maintenance"
                          ? "Karbantartás"
                          : "Offline"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Server Statistics - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <TrendingUpIcon className="h-4 w-4" />
                    <span>Szerver Statisztikák</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                      <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                      <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {config.serverStats.totalMembers}
                      </h3>
                      <p className="text-muted-foreground text-xs">Tagok</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-md border border-purple-200 dark:border-purple-800">
                      <CrownIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                      <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {config.serverStats.totalAdmins}
                      </h3>
                      <p className="text-muted-foreground text-xs">Adminok</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                      <BotIcon className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                      <h3 className="text-lg font-bold text-green-600 dark:text-green-400">
                        {config.serverStats.totalBots}
                      </h3>
                      <p className="text-muted-foreground text-xs">Botok</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Changelog - Smaller */}
              {config.changelog.visible && (
                <Card className="modern-card border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                      <InfoIcon className="h-4 w-4" />
                      <span>Changelog - {config.changelog.version}</span>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs"
                      >
                        Új
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                        {config.changelog.title}
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200 text-xs">{config.changelog.content}</p>
                      <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-300">
                        <ClockIcon className="h-3 w-3" />
                        <span>{config.changelog.date}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <ActivityIcon className="h-4 w-4" />
                    <span>Gyors Áttekintés</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-muted rounded-md">
                      <h4 className="text-sm font-bold text-foreground">
                        {Object.values(config.moderation).filter((setting: any) => setting.enabled).length +
                          Object.values(config.support).filter((setting: any) => setting.enabled).length +
                          Object.values(config.events).filter((setting: any) => setting.enabled).length}
                      </h4>
                      <p className="text-xs text-muted-foreground">Aktív funkció</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <h4 className="text-sm font-bold text-foreground">{config.moderation.moderationLevel}</h4>
                      <p className="text-xs text-muted-foreground">Moderációs szint</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <h4 className="text-sm font-bold text-foreground">
                        {config.support.ticketSystem.enabled ? "Aktív" : "Inaktív"}
                      </h4>
                      <p className="text-xs text-muted-foreground">Ticket rendszer</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <h4 className="text-sm font-bold text-foreground">
                        {config.settings.logs.enabled ? "Aktív" : "Inaktív"}
                      </h4>
                      <p className="text-xs text-muted-foreground">Naplózás</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sentinel Tab - Moderációs rendszer */}
          <TabsContent value="sentinel" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Info Block with Info Button and Illustration */}
              <Card className="modern-card border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <ShieldIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Sentinel AI Moderátor</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          <InfoIcon className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-sm flex items-center space-x-2">
                            <ShieldIcon className="h-4 w-4 text-primary" />
                            <span>Hogyan lett betanítva a bot?</span>
                          </DialogTitle>
                          <DialogDescription className="text-xs space-y-2">
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="font-medium mb-2">
                                A Sentinel AI több mint 10,000 valós moderációs eset alapján lett betanítva:
                              </p>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>• Spam üzenet elemzése</span>
                                  <span className="font-mono">3,500</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Káros link azonosítása</span>
                                  <span className="font-mono">2,800</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Toxikus viselkedés mintája</span>
                                  <span className="font-mono">1,900</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Raid támadás elemzése</span>
                                  <span className="font-mono">1,200</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Phishing kísérlet</span>
                                  <span className="font-mono">600</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-center text-muted-foreground">
                              Az AI folyamatosan tanul és fejlődik minden új esetből.
                            </p>
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-blue-800 dark:text-blue-200 text-xs mb-2">
                    A Sentinel több ezer valós moderációs eset alapján lett betanítva, hogy automatikusan kezelje a
                    szerver biztonságát és rendjét.
                  </p>
                  <div className="flex items-center space-x-2">
                    <AlertTriangleIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      A magasabb moderációs szintek szigorúbb szabályokat alkalmaznak.
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Moderation Level - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Moderációs Szint</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <Label htmlFor="moderationLevel" className="text-xs">
                      Válasszon moderációs szintet
                    </Label>
                    <Select
                      value={config.moderation.moderationLevel}
                      onValueChange={(value: "off" | "basic" | "advanced") =>
                        handleSettingChange("moderation.moderationLevel", value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Válasszon moderációs szintet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off" className="text-xs">
                          Kikapcsolva - Nincs automatikus moderáció
                        </SelectItem>
                        <SelectItem value="basic" className="text-xs">
                          Basic - Alapvető spam és káros tartalom szűrés
                        </SelectItem>
                        <SelectItem value="advanced" className="text-xs">
                          Advanced - Teljes AI moderáció minden funkcióval
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.moderation.moderationLevel !== "off" && (
                    <Alert className="py-2">
                      <InfoIcon className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {config.moderation.moderationLevel === "basic"
                          ? "Alapvető moderáció aktív: spam védelem, káros linkek szűrése."
                          : "Fejlett moderáció aktív: teljes AI elemzés, proaktív védelem, részletes naplózás."}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Link Filter - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Link Szűrő</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="linkFilterEnabled"
                      checked={config.moderation.linkFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.linkFilter.enabled", checked)}
                    />
                    <Label htmlFor="linkFilterEnabled" className="text-xs">
                      Link szűrő engedélyezése
                    </Label>
                  </div>

                  {config.moderation.linkFilter.enabled && (
                    <>
                      <div>
                        <Label htmlFor="linkFilterConfig" className="text-xs">
                          Szűrő típusa
                        </Label>
                        <Select
                          value={config.moderation.linkFilter.config}
                          onValueChange={(value) => handleSettingChange("moderation.linkFilter.config", value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_links" className="text-xs">
                              Minden link blokkolása
                            </SelectItem>
                            <SelectItem value="whitelist_only" className="text-xs">
                              Csak engedélyezett linkek
                            </SelectItem>
                            <SelectItem value="phishing_only" className="text-xs">
                              Csak káros linkek blokkolása
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.moderation.linkFilter.config === "whitelist_only" && (
                        <div>
                          <Label htmlFor="whitelist" className="text-xs">
                            Engedélyezett domainek (soronként egy)
                          </Label>
                          <Textarea
                            id="whitelist"
                            value={config.moderation.linkFilter.whitelist.join("\n")}
                            onChange={(e) =>
                              handleSettingChange(
                                "moderation.linkFilter.whitelist",
                                e.target.value.split("\n").filter(Boolean),
                              )
                            }
                            placeholder="example.com&#10;youtube.com&#10;discord.gg"
                            rows={3}
                            className="text-xs"
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Bad Word Filter - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Káromkodás Szűrő</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="badWordFilterEnabled"
                      checked={config.moderation.badWordFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.badWordFilter.enabled", checked)}
                    />
                    <Label htmlFor="badWordFilterEnabled" className="text-xs">
                      Káromkodás szűrő engedélyezése
                    </Label>
                  </div>

                  {config.moderation.badWordFilter.enabled && (
                    <div>
                      <Label htmlFor="customWords" className="text-xs">
                        Egyedi tiltott szavak (soronként egy)
                      </Label>
                      <Textarea
                        id="customWords"
                        value={config.moderation.badWordFilter.customWords.join("\n")}
                        onChange={(e) =>
                          handleSettingChange(
                            "moderation.badWordFilter.customWords",
                            e.target.value.split("\n").filter(Boolean),
                          )
                        }
                        placeholder="tiltott_szó1&#10;tiltott_szó2"
                        rows={4}
                        className="text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raid Protection - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Raid Védelem</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="raidProtectionEnabled"
                      checked={config.moderation.raidProtection.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.raidProtection.enabled", checked)}
                    />
                    <Label htmlFor="raidProtectionEnabled" className="text-xs">
                      Raid védelem engedélyezése
                    </Label>
                  </div>

                  {config.moderation.raidProtection.enabled && (
                    <div>
                      <Label htmlFor="raidThreshold" className="text-xs">
                        Raid küszöb (csatlakozó tagok percenként)
                      </Label>
                      <Input
                        id="raidThreshold"
                        type="number"
                        value={config.moderation.raidProtection.threshold}
                        onChange={(e) =>
                          handleSettingChange("moderation.raidProtection.threshold", Number.parseInt(e.target.value))
                        }
                        min="1"
                        max="100"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Auto Role - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Auto Role</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoRoleEnabled"
                      checked={config.moderation.autoRole.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.autoRole.enabled", checked)}
                    />
                    <Label htmlFor="autoRoleEnabled" className="text-xs">
                      Auto szerepkör hozzárendelés belépéskor
                    </Label>
                  </div>

                  {config.moderation.autoRole.enabled && (
                    <div>
                      <Label htmlFor="autoRoleId" className="text-xs">
                        Szerepkör ID
                      </Label>
                      <Input
                        id="autoRoleId"
                        value={config.moderation.autoRole.roleId}
                        onChange={(e) => handleSettingChange("moderation.autoRole.roleId", e.target.value)}
                        placeholder="Szerepkör ID megadása"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Helpdesk Tab - Smaller */}
          <TabsContent value="helpdesk" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Helpdesk Illustration */}
              <Card className="modern-card bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <HeadphonesIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">
                        Helpdesk & Támogatás
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Professzionális ticket rendszer és üdvözlő üzenetek kezelése.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ticket System - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ticket Rendszer</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ticketSystemEnabled"
                      checked={config.support.ticketSystem.enabled}
                      onCheckedChange={(checked) => handleSettingChange("support.ticketSystem.enabled", checked)}
                    />
                    <Label htmlFor="ticketSystemEnabled" className="text-xs">
                      Ticket rendszer engedélyezése
                    </Label>
                  </div>

                  {config.support.ticketSystem.enabled && (
                    <>
                      <div>
                        <Label htmlFor="ticketChannel" className="text-xs">
                          Ticket csatorna ID
                        </Label>
                        <Input
                          id="ticketChannel"
                          value={config.support.ticketSystem.channelId}
                          onChange={(e) => handleSettingChange("support.ticketSystem.channelId", e.target.value)}
                          placeholder="Csatorna ID megadása"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supportRole" className="text-xs">
                          Support szerepkör ID
                        </Label>
                        <Input
                          id="supportRole"
                          value={config.support.ticketSystem.priorityRoleId}
                          onChange={(e) => handleSettingChange("support.ticketSystem.priorityRoleId", e.target.value)}
                          placeholder="Support csapat szerepkör ID"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ticketCategories" className="text-xs">
                          Ticket kategóriák (soronként egy)
                        </Label>
                        <Textarea
                          id="ticketCategories"
                          value={config.support.ticketSystem.categories.join("\n")}
                          onChange={(e) =>
                            handleSettingChange(
                              "support.ticketSystem.categories",
                              e.target.value.split("\n").filter(Boolean),
                            )
                          }
                          placeholder="Általános támogatás&#10;Technikai probléma&#10;Jelentés&#10;Egyéb"
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Welcome Messages - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Üdvözlő Üzenetek</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="welcomeEnabled"
                      checked={config.support.welcome.enabled}
                      onCheckedChange={(checked) => handleSettingChange("support.welcome.enabled", checked)}
                    />
                    <Label htmlFor="welcomeEnabled" className="text-xs">
                      Üdvözlő üzenetek engedélyezése
                    </Label>
                  </div>

                  {config.support.welcome.enabled && (
                    <>
                      <div>
                        <Label htmlFor="welcomeChannel" className="text-xs">
                          Üdvözlő csatorna ID
                        </Label>
                        <Input
                          id="welcomeChannel"
                          value={config.support.welcome.channelId}
                          onChange={(e) => handleSettingChange("support.welcome.channelId", e.target.value)}
                          placeholder="Csatorna ID megadása"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="welcomeMessage" className="text-xs">
                          Üdvözlő üzenet
                        </Label>
                        <Textarea
                          id="welcomeMessage"
                          value={config.support.welcome.message}
                          onChange={(e) => handleSettingChange("support.welcome.message", e.target.value)}
                          placeholder="Üdvözlünk {user} a {server} szerveren!"
                          rows={2}
                          className="text-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Használható változók: {"{user}"} - felhasználó neve, {"{server}"} - szerver neve
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="welcomeDmEnabled"
                          checked={config.support.welcome.dmEnabled}
                          onCheckedChange={(checked) => handleSettingChange("support.welcome.dmEnabled", checked)}
                        />
                        <Label htmlFor="welcomeDmEnabled" className="text-xs">
                          Üdvözlő üzenet küldése privát üzenetben is
                        </Label>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab - Smaller */}
          <TabsContent value="events" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Events Illustration */}
              <Card className="modern-card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <CalendarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">
                        Események & Automatizáció
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Időzített üzenetek, belépés/kilépés események és kulcsszavas reakciók.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Messages - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Napi Időzített Üzenetek</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dailyMessagesEnabled"
                      checked={config.events.dailyMessages.enabled}
                      onCheckedChange={(checked) => handleSettingChange("events.dailyMessages.enabled", checked)}
                    />
                    <Label htmlFor="dailyMessagesEnabled" className="text-xs">
                      Napi üzenetek engedélyezése
                    </Label>
                  </div>

                  {config.events.dailyMessages.enabled && (
                    <>
                      <div>
                        <Label htmlFor="dailyTime" className="text-xs">
                          Időpont (HH:MM formátumban)
                        </Label>
                        <Input
                          id="dailyTime"
                          type="time"
                          value={config.events.dailyMessages.time}
                          onChange={(e) => handleSettingChange("events.dailyMessages.time", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dailyChannel" className="text-xs">
                          Csatorna ID
                        </Label>
                        <Input
                          id="dailyChannel"
                          value={config.events.dailyMessages.channelId}
                          onChange={(e) => handleSettingChange("events.dailyMessages.channelId", e.target.value)}
                          placeholder="Csatorna ID megadása"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dailyMessage" className="text-xs">
                          Napi üzenet
                        </Label>
                        <Textarea
                          id="dailyMessage"
                          value={config.events.dailyMessages.message}
                          onChange={(e) => handleSettingChange("events.dailyMessages.message", e.target.value)}
                          placeholder="Jó reggelt mindenkinek! 🌅"
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Join/Leave Events - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Belépés/Kilépés Események</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="joinLeaveEnabled"
                      checked={config.events.joinLeave.enabled}
                      onCheckedChange={(checked) => handleSettingChange("events.joinLeave.enabled", checked)}
                    />
                    <Label htmlFor="joinLeaveEnabled" className="text-xs">
                      Belépés/kilépés események engedélyezése
                    </Label>
                  </div>

                  {config.events.joinLeave.enabled && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="joinChannelId" className="text-xs">
                            Belépés csatorna ID
                          </Label>
                          <Input
                            id="joinChannelId"
                            value={config.events.joinLeave.joinChannelId}
                            onChange={(e) => handleSettingChange("events.joinLeave.joinChannelId", e.target.value)}
                            placeholder="Csatorna ID"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="leaveChannelId" className="text-xs">
                            Kilépés csatorna ID
                          </Label>
                          <Input
                            id="leaveChannelId"
                            value={config.events.joinLeave.leaveChannelId}
                            onChange={(e) => handleSettingChange("events.joinLeave.leaveChannelId", e.target.value)}
                            placeholder="Csatorna ID"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="joinMessage" className="text-xs">
                          Belépés üzenet
                        </Label>
                        <Textarea
                          id="joinMessage"
                          value={config.events.joinLeave.joinMessage}
                          onChange={(e) => handleSettingChange("events.joinLeave.joinMessage", e.target.value)}
                          placeholder="🎉 {user} csatlakozott a szerverhez!"
                          rows={1}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="leaveMessage" className="text-xs">
                          Kilépés üzenet
                        </Label>
                        <Textarea
                          id="leaveMessage"
                          value={config.events.joinLeave.leaveMessage}
                          onChange={(e) => handleSettingChange("events.joinLeave.leaveMessage", e.target.value)}
                          placeholder="👋 {user} elhagyta a szervert."
                          rows={1}
                          className="text-xs"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Tab - Smaller */}
          <TabsContent value="integrations" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Integrations Illustration */}
              <Card className="modern-card bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-re-950 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <PuzzleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">Integrációk</h2>
                      <p className="text-sm text-muted-foreground">
                        Külső szolgáltatások és speciális funkciók integrálása.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Giveaway Integration - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Giveaway Rendszer</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="giveawayEnabled"
                      checked={config.integrations.giveaway.enabled}
                      onCheckedChange={(checked) => handleSettingChange("integrations.giveaway.enabled", checked)}
                    />
                    <Label htmlFor="giveawayEnabled" className="text-xs">
                      Giveaway rendszer engedélyezése
                    </Label>
                  </div>

                  {config.integrations.giveaway.enabled && (
                    <div>
                      <Label htmlFor="giveawayChannel" className="text-xs">
                        Alapértelmezett giveaway csatorna ID
                      </Label>
                      <Input
                        id="giveawayChannel"
                        value={config.integrations.giveaway.defaultChannelId}
                        onChange={(e) => handleSettingChange("integrations.giveaway.defaultChannelId", e.target.value)}
                        placeholder="Csatorna ID megadása"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plugins Tab - Smaller */}
          <TabsContent value="plugins" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Plugins Illustration */}
              <Card className="modern-card bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-200 dark:border-cyan-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                      <PlugIcon className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">Plugin Rendszer</h2>
                      <p className="text-sm text-muted-foreground">Kiegészítő funkciók és modulok kezelése.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Plugins - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Elérhető Pluginok</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {config.plugins.available.map((plugin) => (
                      <div
                        key={plugin}
                        className="flex items-center justify-between p-2 border border-border rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <PlugIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{plugin}</span>
                        </div>
                        <Switch
                          checked={config.plugins.enabled.includes(plugin)}
                          onCheckedChange={(checked) => {
                            const newEnabled = checked
                              ? [...config.plugins.enabled, plugin]
                              : config.plugins.enabled.filter((p) => p !== plugin)
                            handleSettingChange("plugins.enabled", newEnabled)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab - Smaller */}
          <TabsContent value="settings" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Settings Illustration */}
              <Card className="modern-card bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 border-gray-200 dark:border-gray-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                      <SettingsIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">
                        Általános Beállítások
                      </h2>
                      <p className="text-sm text-muted-foreground">Naplózás és egyéb rendszerbeállítások.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logging Settings - Smaller */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Naplózási Beállítások</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="logsEnabled"
                      checked={config.settings.logs.enabled}
                      onCheckedChange={(checked) => handleSettingChange("settings.logs.enabled", checked)}
                    />
                    <Label htmlFor="logsEnabled" className="text-xs">
                      Naplózás engedélyezése
                    </Label>
                  </div>

                  {config.settings.logs.enabled && (
                    <>
                      <div>
                        <Label htmlFor="logChannel" className="text-xs">
                          Napló csatorna ID
                        </Label>
                        <Input
                          id="logChannel"
                          value={config.settings.logs.channelId}
                          onChange={(e) => handleSettingChange("settings.logs.channelId", e.target.value)}
                          placeholder="Csatorna ID megadása"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Naplózandó események</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logMessageEdits"
                              checked={config.settings.logs.messageEdits}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.messageEdits", checked)}
                            />
                            <Label htmlFor="logMessageEdits" className="text-xs">
                              Üzenet szerkesztések
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logModActions"
                              checked={config.settings.logs.modActions}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.modActions", checked)}
                            />
                            <Label htmlFor="logModActions" className="text-xs">
                              Moderációs műveletek
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logMemberJoins"
                              checked={config.settings.logs.memberJoins}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.memberJoins", checked)}
                            />
                            <Label htmlFor="logMemberJoins" className="text-xs">
                              Tag belépések
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logMemberLeaves"
                              checked={config.settings.logs.memberLeaves}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.memberLeaves", checked)}
                            />
                            <Label htmlFor="logMemberLeaves" className="text-xs">
                              Tag kilépések
                            </Label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Tab - Only visible for specific user */}
          {isAdmin && (
            <TabsContent value="admin" className="mt-4 animate-fade-in">
              <div className="space-y-3 sm:space-y-4">
                {/* Admin Warning */}
                <Alert className="border-destructive bg-destructive/10">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Admin Panel:</strong> Ez a panel csak rendszergazdák számára látható. Itt található a
                    rendszer és hibakeresési információk.
                  </AlertDescription>
                </Alert>

                {/* System Information */}
                <Card className="modern-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">Rendszer Információk</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p>
                          <strong>Szerver ID:</strong> {config.serverId}
                        </p>
                        <p>
                          <strong>Felhasználó ID:</strong> {config.userId}
                        </p>
                        <p>
                          <strong>Bot Státusz:</strong> {config.botStatus}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p>
                          <strong>Moderációs Szint:</strong> {config.moderation.moderationLevel}
                        </p>
                        <p>
                          <strong>Aktív Pluginok:</strong> {config.plugins.enabled.length}
                        </p>
                        <p>
                          <strong>Naplózás:</strong> {config.settings.logs.enabled ? "Aktív" : "Inaktív"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Debug Information */}
                <Card className="modern-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">Debug Információk</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-xs text-muted-foreground overflow-x-auto">
                        {JSON.stringify(
                          {
                            serverId: config.serverId,
                            userId: config.userId,
                            botStatus: config.botStatus,
                            activeFeatures: {
                              moderation: Object.values(config.moderation).filter((setting: any) => setting.enabled)
                                .length,
                              support: Object.values(config.support).filter((setting: any) => setting.enabled).length,
                              events: Object.values(config.events).filter((setting: any) => setting.enabled).length,
                              integrations: Object.values(config.integrations).filter((setting: any) => setting.enabled)
                                .length,
                            },
                            plugins: config.plugins.enabled,
                            logs: config.settings.logs.enabled,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Save Button - Fixed at bottom on mobile */}
        <div className="fixed bottom-4 left-4 right-4 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:mt-6 z-40">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-10 sm:h-9 text-sm font-medium shadow-lg sm:shadow-none"
            >
              {saving ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Mentés...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Konfiguráció Mentése
                </>
              )}
            </Button>

            {saveSuccess && (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm animate-fade-in">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Sikeresen mentve!</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center space-x-2 text-destructive text-sm animate-fade-in">
                <XCircleIcon className="h-4 w-4" />
                <span>{saveError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom padding for mobile fixed button */}
        <div className="h-20 sm:h-0"></div>
      </main>
    </div>
  )
}
