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
} from "lucide-react"
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
        <div className="text-center">
          <Loader2Icon className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Szerver konfiguráció betöltése...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <XCircleIcon className="h-12 w-12 text-destructive mb-3" />
        <h2 className="text-xl font-bold text-foreground mb-2">Konfiguráció nem található</h2>
        <p className="text-muted-foreground text-center mb-4 text-sm">
          Nem sikerült betölteni a szerver konfigurációt. Kérjük próbálja újra.
        </p>
        <Button onClick={() => router.push("/dashboard")} variant="outline" size="sm">
          <ArrowLeftIcon className="mr-2 h-3 w-3" /> Vissza a vezérlőpulthoz
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3">
              <Image src="/bot-icon.png" alt="Dash Bot" width={32} height={32} className="rounded-full" />
              <h1 className="text-xl font-bold text-foreground">Dash</h1>
            </div>

            {/* Server Chooser */}
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                    <Image
                      src="/placeholder-logo.svg"
                      alt={config.serverName}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <span className="font-medium text-sm">{config.serverName}</span>
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

              {/* User Info Display */}
              {session?.user && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-muted rounded-md">
                  <UserIcon className="h-3 w-3 text-muted-foreground" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">{session.user.name}</p>
                    <p className="text-muted-foreground text-xs">{session.user.email}</p>
                  </div>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
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
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="home" className="w-full">
          {/* Scrollable Tabs - All Visible */}
          <div className="mb-6">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="home" className="text-xs px-3 py-1 h-7">
                  <HomeIcon className="mr-1 h-3 w-3" />
                  Főoldal
                </TabsTrigger>
                <TabsTrigger value="sentinel" className="text-xs px-3 py-1 h-7">
                  <ShieldIcon className="mr-1 h-3 w-3" />
                  Sentinel
                </TabsTrigger>
                <TabsTrigger value="helpdesk" className="text-xs px-3 py-1 h-7">
                  <HeadphonesIcon className="mr-1 h-3 w-3" />
                  Helpdesk
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs px-3 py-1 h-7">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="integrations" className="text-xs px-3 py-1 h-7">
                  <PuzzleIcon className="mr-1 h-3 w-3" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="plugins" className="text-xs px-3 py-1 h-7">
                  <PlugIcon className="mr-1 h-3 w-3" />
                  Plugins
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs px-3 py-1 h-7">
                  <SettingsIcon className="mr-1 h-3 w-3" />
                  Settings
                </TabsTrigger>
                {/* Admin Tab - Only visible for specific user */}
                {isAdmin && (
                  <TabsTrigger value="admin" className="text-xs px-3 py-1 h-7 bg-destructive/10 text-destructive">
                    <ShieldCheckIcon className="mr-1 h-3 w-3" />
                    Admin
                  </TabsTrigger>
                )}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Home Tab - Főoldal */}
          <TabsContent value="home" className="mt-4">
            <div className="space-y-4">
              {/* Bot Status - Smaller */}
              <Card className="border-border">
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
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <TrendingUpIcon className="h-4 w-4" />
                    <span>Szerver Statisztikák</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
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
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <ActivityIcon className="h-4 w-4" />
                    <span>Gyors Áttekintés</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
          <TabsContent value="sentinel" className="mt-4">
            <div className="space-y-4">
              {/* Info Block with Info Button */}
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                    <InfoIcon className="h-4 w-4" />
                    <span>Sentinel AI Moderátor</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400">
                          <InfoIcon className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-sm">Hogyan lett betanítva a bot?</DialogTitle>
                          <DialogDescription className="text-xs">
                            A Sentinel AI több mint 10,000 valós moderációs eset alapján lett betanítva:
                            <br />
                            <br />• 3,500 spam üzenet elemzése
                            <br />• 2,800 káros link azonosítása
                            <br />• 1,900 toxikus viselkedés mintája
                            <br />• 1,200 raid támadás elemzése
                            <br />• 600 phishing kísérlet
                            <br />
                            <br />
                            Az AI folyamatosan tanul és fejlődik minden új esetből.
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
              <Card className="border-border">
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
              <Card className="border-border">
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
              <Card className="border-border">
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
              <Card className="border-border">
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
              <Card className="border-border">
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
          <TabsContent value="helpdesk" className="mt-4">
            <div className="space-y-4">
              {/* Ticket System - Smaller */}
              <Card className="border-border">
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
              <Card className="border-border">
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
          <TabsContent value="events" className="mt-4">
            <div className="space-y-4">
              {/* Daily Messages - Smaller */}
              <Card className="border-border">
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
              <Card className="border-border">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <TabsContent value="integrations" className="mt-4">
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Giveaway Integráció</CardTitle>
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
          <TabsContent value="plugins" className="mt-4">
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Plugin Kezelő</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-xs mb-3">
                    Itt kezelheti a szerver pluginjait. A pluginok további funkciókat adnak a bothoz.
                  </p>
                  <div className="space-y-2">
                    {config.plugins.available.length > 0 ? (
                      config.plugins.available.map((plugin) => (
                        <div key={plugin} className="flex items-center justify-between p-2 border rounded-md">
                          <div>
                            <h4 className="font-medium text-sm">{plugin}</h4>
                            <p className="text-xs text-muted-foreground">Plugin leírása</p>
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
                      ))
                    ) : (
                      <p className="text-muted-foreground text-xs">Nincsenek elérhető pluginok.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab - Smaller */}
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Naplózás Beállítások</CardTitle>
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
                        <Label className="text-xs">Mit naplózzon a bot?</Label>
                        <div className="space-y-2">
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
            <TabsContent value="admin" className="mt-4">
              <div className="space-y-4">
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Admin Panel</strong> - Ez a panel csak adminisztrátorok számára látható. Itt kezelheti a
                    rendszer szintű beállításokat.
                  </AlertDescription>
                </Alert>

                <Card className="border-destructive/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">Rendszer Információk</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-muted rounded-md">
                        <h4 className="text-xs font-medium text-muted-foreground">Felhasználó ID</h4>
                        <p className="text-sm font-mono">{config.userId}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <h4 className="text-xs font-medium text-muted-foreground">Szerver ID</h4>
                        <p className="text-sm font-mono">{config.serverId}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <h4 className="text-xs font-medium text-muted-foreground">Adatbázis Struktúra</h4>
                        <p className="text-xs">
                          users/{config.userId}/servers/{config.serverId}/
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <h4 className="text-xs font-medium text-muted-foreground">Admin Jogosultság</h4>
                        <Badge variant="destructive" className="text-xs">
                          Aktív
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">Debug Információk</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(
                          {
                            serverId: config.serverId,
                            userId: config.userId,
                            botStatus: config.botStatus,
                            activeFeatures: {
                              moderation: config.moderation.moderationLevel !== "off",
                              tickets: config.support.ticketSystem.enabled,
                              welcome: config.support.welcome.enabled,
                              logs: config.settings.logs.enabled,
                            },
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

        {/* Save Button - Smaller */}
        <div className="fixed bottom-4 right-4">
          <Button onClick={handleSaveConfig} disabled={saving} size="sm" className="shadow-lg">
            {saving ? (
              <>
                <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                Mentés...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-3 w-3" />
                Beállítások Mentése
              </>
            )}
          </Button>
        </div>

        {/* Success/Error Messages - Smaller */}
        {saveSuccess && (
          <div className="fixed bottom-16 right-4">
            <Alert className="w-80 bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-100">
              <CheckCircleIcon className="h-3 w-3" />
              <AlertDescription className="text-xs">Beállítások sikeresen mentve!</AlertDescription>
            </Alert>
          </div>
        )}

        {saveError && (
          <div className="fixed bottom-16 right-4">
            <Alert className="w-80" variant="destructive">
              <XCircleIcon className="h-3 w-3" />
              <AlertDescription className="text-xs">{saveError}</AlertDescription>
            </Alert>
          </div>
        )}
      </main>
    </div>
  )
}
