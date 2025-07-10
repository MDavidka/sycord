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
  settings: {
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
    welcome: {
      enabled: boolean
      channelId: string
      message: string
      dmEnabled: boolean
    }
    support: {
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
    giveaway: {
      enabled: boolean
      defaultChannelId: string
    }
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
        if (keys[i] === "settings") {
          current = current.settings
        } else {
          current = current[keys[i]]
        }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Szerver konfiguráció betöltése...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Konfiguráció nem található</h2>
        <p className="text-gray-600 text-center mb-4">
          Nem sikerült betölteni a szerver konfigurációt. Kérjük próbálja újra.
        </p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Vissza a vezérlőpulthoz
        </Button>
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

            {/* Server Chooser */}
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                    <Image
                      src="/placeholder-logo.svg"
                      alt={config.serverName}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="font-medium">{config.serverName}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Szerver váltás</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Vissza a vezérlőpulthoz
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Info Display */}
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
                    Beállítások
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-gray-700 hover:bg-gray-50"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Kijelentkezés
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="home" className="w-full">
          {/* Scrollable Tabs */}
          <div className="mb-8">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500">
                <TabsTrigger
                  value="home"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Főoldal
                </TabsTrigger>
                <TabsTrigger
                  value="sentinel"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <ShieldIcon className="mr-2 h-4 w-4" />
                  Sentinel
                </TabsTrigger>
                <TabsTrigger
                  value="helpdesk"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <HeadphonesIcon className="mr-2 h-4 w-4" />
                  Helpdesk
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="integrations"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <PuzzleIcon className="mr-2 h-4 w-4" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger
                  value="plugins"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <PlugIcon className="mr-2 h-4 w-4" />
                  Plugins
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>

          {/* Home Tab - Főoldal */}
          <TabsContent value="home" className="mt-6">
            <div className="space-y-6">
              {/* Bot Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BotIcon className="h-5 w-5" />
                    <span>Bot Státusz</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          config.botStatus === "online"
                            ? "bg-green-500 animate-pulse"
                            : config.botStatus === "maintenance"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <span className="font-medium">
                        {config.botStatus === "online"
                          ? "Elérhető"
                          : config.botStatus === "maintenance"
                            ? "Karbantartás"
                            : "Nem elérhető"}
                      </span>
                    </div>
                    <Badge
                      variant={config.botStatus === "online" ? "default" : "secondary"}
                      className={
                        config.botStatus === "online"
                          ? "bg-green-100 text-green-800"
                          : config.botStatus === "maintenance"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }
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

              {/* Server Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUpIcon className="h-5 w-5" />
                    <span>Szerver Statisztikák</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                      <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="text-2xl font-bold text-blue-600">{config.serverStats.totalMembers}</h3>
                      <p className="text-gray-600">Tagok</p>
                    </div>
                    <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                      <CrownIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h3 className="text-2xl font-bold text-purple-600">{config.serverStats.totalAdmins}</h3>
                      <p className="text-gray-600">Adminok</p>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                      <BotIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="text-2xl font-bold text-green-600">{config.serverStats.totalBots}</h3>
                      <p className="text-gray-600">Botok</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Changelog */}
              {config.changelog.visible && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-800">
                      <InfoIcon className="h-5 w-5" />
                      <span>Changelog - {config.changelog.version}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Új
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-900">{config.changelog.title}</h4>
                      <p className="text-blue-800">{config.changelog.content}</p>
                      <div className="flex items-center space-x-2 text-sm text-blue-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>{config.changelog.date}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ActivityIcon className="h-5 w-5" />
                    <span>Gyors Áttekintés</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-lg font-bold text-gray-900">
                        {Object.values(config.settings).filter((setting: any) => setting.enabled).length}
                      </h4>
                      <p className="text-sm text-gray-600">Aktív funkció</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-lg font-bold text-gray-900">{config.settings.moderationLevel}</h4>
                      <p className="text-sm text-gray-600">Moderációs szint</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-lg font-bold text-gray-900">
                        {config.settings.support.ticketSystem.enabled ? "Aktív" : "Inaktív"}
                      </h4>
                      <p className="text-sm text-gray-600">Ticket rendszer</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-lg font-bold text-gray-900">
                        {config.settings.logs.enabled ? "Aktív" : "Inaktív"}
                      </h4>
                      <p className="text-sm text-gray-600">Naplózás</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sentinel Tab - Moderációs rendszer */}
          <TabsContent value="sentinel" className="mt-6">
            <div className="space-y-6">
              {/* Info Block */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <InfoIcon className="h-5 w-5" />
                    <span>Sentinel AI Moderátor</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800 mb-4">
                    A Sentinel több ezer valós moderációs eset alapján lett betanítva, hogy automatikusan kezelje a
                    szerver biztonságát és rendjét. Fejlett AI algoritmusok segítségével felismeri a spam, káros
                    tartalom és egyéb szabálysértések mintáit.
                  </p>
                  <div className="flex items-center space-x-2">
                    <AlertTriangleIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      A magasabb moderációs szintek szigorúbb szabályokat alkalmaznak.
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Moderation Level */}
              <Card>
                <CardHeader>
                  <CardTitle>Moderációs Szint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="moderationLevel">Válasszon moderációs szintet</Label>
                    <Select
                      value={config.settings.moderationLevel}
                      onValueChange={(value: "off" | "basic" | "advanced") =>
                        handleSettingChange("settings.moderationLevel", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Válasszon moderációs szintet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Kikapcsolva - Nincs automatikus moderáció</SelectItem>
                        <SelectItem value="basic">Basic - Alapvető spam és káros tartalom szűrés</SelectItem>
                        <SelectItem value="advanced">Advanced - Teljes AI moderáció minden funkcióval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.settings.moderationLevel !== "off" && (
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertDescription>
                        {config.settings.moderationLevel === "basic"
                          ? "Alapvető moderáció aktív: spam védelem, káros linkek szűrése."
                          : "Fejlett moderáció aktív: teljes AI elemzés, proaktív védelem, részletes naplózás."}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Link Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Link Szűrő</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="linkFilterEnabled"
                      checked={config.settings.linkFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("settings.linkFilter.enabled", checked)}
                    />
                    <Label htmlFor="linkFilterEnabled">Link szűrő engedélyezése</Label>
                  </div>

                  {config.settings.linkFilter.enabled && (
                    <>
                      <div>
                        <Label htmlFor="linkFilterConfig">Szűrő típusa</Label>
                        <Select
                          value={config.settings.linkFilter.config}
                          onValueChange={(value) => handleSettingChange("settings.linkFilter.config", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_links">Minden link blokkolása</SelectItem>
                            <SelectItem value="whitelist_only">Csak engedélyezett linkek</SelectItem>
                            <SelectItem value="phishing_only">Csak káros linkek blokkolása</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.settings.linkFilter.config === "whitelist_only" && (
                        <div>
                          <Label htmlFor="whitelist">Engedélyezett domainek (soronként egy)</Label>
                          <Textarea
                            id="whitelist"
                            value={config.settings.linkFilter.whitelist.join("\n")}
                            onChange={(e) =>
                              handleSettingChange(
                                "settings.linkFilter.whitelist",
                                e.target.value.split("\n").filter(Boolean),
                              )
                            }
                            placeholder="example.com&#10;youtube.com&#10;discord.gg"
                            rows={4}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Bad Word Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Káromkodás Szűrő</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="badWordFilterEnabled"
                      checked={config.settings.badWordFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("settings.badWordFilter.enabled", checked)}
                    />
                    <Label htmlFor="badWordFilterEnabled">Káromkodás szűrő engedélyezése</Label>
                  </div>

                  {config.settings.badWordFilter.enabled && (
                    <div>
                      <Label htmlFor="customWords">Egyedi tiltott szavak (soronként egy)</Label>
                      <Textarea
                        id="customWords"
                        value={config.settings.badWordFilter.customWords.join("\n")}
                        onChange={(e) =>
                          handleSettingChange(
                            "settings.badWordFilter.customWords",
                            e.target.value.split("\n").filter(Boolean),
                          )
                        }
                        placeholder="tiltott_szó1&#10;tiltott_szó2"
                        rows={6}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raid Protection */}
              <Card>
                <CardHeader>
                  <CardTitle>Raid Védelem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="raidProtectionEnabled"
                      checked={config.settings.raidProtection.enabled}
                      onCheckedChange={(checked) => handleSettingChange("settings.raidProtection.enabled", checked)}
                    />
                    <Label htmlFor="raidProtectionEnabled">Raid védelem engedélyezése</Label>
                  </div>

                  {config.settings.raidProtection.enabled && (
                    <div>
                      <Label htmlFor="raidThreshold">Raid küszöb (csatlakozó tagok percenként)</Label>
                      <Input
                        id="raidThreshold"
                        type="number"
                        value={config.settings.raidProtection.threshold}
                        onChange={(e) =>
                          handleSettingChange("settings.raidProtection.threshold", Number.parseInt(e.target.value))
                        }
                        min="1"
                        max="100"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Helpdesk Tab - Ticket rendszer */}
          <TabsContent value="helpdesk" className="mt-6">
            <div className="space-y-6">
              {/* Ticket System */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Rendszer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ticketSystemEnabled"
                      checked={config.settings.support.ticketSystem.enabled}
                      onCheckedChange={(checked) =>
                        handleSettingChange("settings.support.ticketSystem.enabled", checked)
                      }
                    />
                    <Label htmlFor="ticketSystemEnabled">Ticket rendszer engedélyezése</Label>
                  </div>

                  {config.settings.support.ticketSystem.enabled && (
                    <>
                      <div>
                        <Label htmlFor="ticketChannel">Ticket csatorna ID</Label>
                        <Input
                          id="ticketChannel"
                          value={config.settings.support.ticketSystem.channelId}
                          onChange={(e) =>
                            handleSettingChange("settings.support.ticketSystem.channelId", e.target.value)
                          }
                          placeholder="Csatorna ID megadása"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supportRole">Support szerepkör ID</Label>
                        <Input
                          id="supportRole"
                          value={config.settings.support.ticketSystem.priorityRoleId}
                          onChange={(e) =>
                            handleSettingChange("settings.support.ticketSystem.priorityRoleId", e.target.value)
                          }
                          placeholder="Support csapat szerepkör ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ticketCategories">Ticket kategóriák (soronként egy)</Label>
                        <Textarea
                          id="ticketCategories"
                          value={config.settings.support.ticketSystem.categories.join("\n")}
                          onChange={(e) =>
                            handleSettingChange(
                              "settings.support.ticketSystem.categories",
                              e.target.value.split("\n").filter(Boolean),
                            )
                          }
                          placeholder="Általános támogatás&#10;Technikai probléma&#10;Jelentés&#10;Egyéb"
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Welcome Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Üdvözlő Üzenetek</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="welcomeEnabled"
                      checked={config.settings.welcome.enabled}
                      onCheckedChange={(checked) => handleSettingChange("settings.welcome.enabled", checked)}
                    />
                    <Label htmlFor="welcomeEnabled">Üdvözlő üzenetek engedélyezése</Label>
                  </div>

                  {config.settings.welcome.enabled && (
                    <>
                      <div>
                        <Label htmlFor="welcomeChannel">Üdvözlő csatorna ID</Label>
                        <Input
                          id="welcomeChannel"
                          value={config.settings.welcome.channelId}
                          onChange={(e) => handleSettingChange("settings.welcome.channelId", e.target.value)}
                          placeholder="Csatorna ID megadása"
                        />
                      </div>
                      <div>
                        <Label htmlFor="welcomeMessage">Üdvözlő üzenet</Label>
                        <Textarea
                          id="welcomeMessage"
                          value={config.settings.welcome.message}
                          onChange={(e) => handleSettingChange("settings.welcome.message", e.target.value)}
                          placeholder="Üdvözlünk {user} a {server} szerveren!"
                          rows={3}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Használható változók: {"{user}"} - felhasználó neve, {"{server}"} - szerver neve
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="welcomeDmEnabled"
                          checked={config.settings.welcome.dmEnabled}
                          onCheckedChange={(checked) => handleSettingChange("settings.welcome.dmEnabled", checked)}
                        />
                        <Label htmlFor="welcomeDmEnabled">Üdvözlő üzenet küldése privát üzenetben is</Label>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Admin Panel for Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle>Admin Felület</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <HeadphonesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket kezelő felület</h3>
                    <p className="text-gray-600 mb-4">Itt tudja megtekinteni és kezelni a beérkező ticket-eket.</p>
                    <Button variant="outline" disabled>
                      Ticket-ek megtekintése (Hamarosan)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab - Események automatizálása */}
          <TabsContent value="events" className="mt-6">
            <div className="space-y-6">
              {/* Daily Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Napi Időzített Üzenetek</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dailyMessagesEnabled"
                      checked={config.settings.events.dailyMessages.enabled}
                      onCheckedChange={(checked) =>
                        handleSettingChange("settings.events.dailyMessages.enabled", checked)
                      }
                    />
                    <Label htmlFor="dailyMessagesEnabled">Napi üzenetek engedélyezése</Label>
                  </div>

                  {config.settings.events.dailyMessages.enabled && (
                    <>
                      <div>
                        <Label htmlFor="dailyTime">Időpont (HH:MM formátumban)</Label>
                        <Input
                          id="dailyTime"
                          type="time"
                          value={config.settings.events.dailyMessages.time}
                          onChange={(e) => handleSettingChange("settings.events.dailyMessages.time", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dailyChannel">Csatorna ID</Label>
                        <Input
                          id="dailyChannel"
                          value={config.settings.events.dailyMessages.channelId}
                          onChange={(e) =>
                            handleSettingChange("settings.events.dailyMessages.channelId", e.target.value)
                          }
                          placeholder="Csatorna ID megadása"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dailyMessage">Napi üzenet</Label>
                        <Textarea
                          id="dailyMessage"
                          value={config.settings.events.dailyMessages.message}
                          onChange={(e) => handleSettingChange("settings.events.dailyMessages.message", e.target.value)}
                          placeholder="Jó reggelt mindenkinek! 🌅"
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Join/Leave Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Belépés/Kilépés Események</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="joinLeaveEnabled"
                      checked={config.settings.events.joinLeave.enabled}
                      onCheckedChange={(checked) => handleSettingChange("settings.events.joinLeave.enabled", checked)}
                    />
                    <Label htmlFor="joinLeaveEnabled">Belépés/kilépés események engedélyezése</Label>
                  </div>

                  {config.settings.events.joinLeave.enabled && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="joinChannelId">Belépés csatorna ID</Label>
                          <Input
                            id="joinChannelId"
                            value={config.settings.events.joinLeave.joinChannelId}
                            onChange={(e) =>
                              handleSettingChange("settings.events.joinLeave.joinChannelId", e.target.value)
                            }
                            placeholder="Csatorna ID"
                          />
                        </div>
                        <div>
                          <Label htmlFor="leaveChannelId">Kilépés csatorna ID</Label>
                          <Input
                            id="leaveChannelId"
                            value={config.settings.events.joinLeave.leaveChannelId}
                            onChange={(e) =>
                              handleSettingChange("settings.events.joinLeave.leaveChannelId", e.target.value)
                            }
                            placeholder="Csatorna ID"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="joinMessage">Belépés üzenet</Label>
                        <Textarea
                          id="joinMessage"
                          value={config.settings.events.joinLeave.joinMessage}
                          onChange={(e) => handleSettingChange("settings.events.joinLeave.joinMessage", e.target.value)}
                          placeholder="🎉 {user} csatlakozott a szerverhez!"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="leaveMessage">Kilépés üzenet</Label>
                        <Textarea
                          id="leaveMessage"
                          value={config.settings.events.joinLeave.leaveMessage}
                          onChange={(e) =>
                            handleSettingChange("settings.events.joinLeave.leaveMessage", e.target.value)
                          }
                          placeholder="👋 {user} elhagyta a szervert."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Keyword Reactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Kulcsszavas Reakciók</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="keywordReactionsEnabled"
                      checked={config.settings.events.keywordReactions.enabled}
                      onCheckedChange={(checked) =>
                        handleSettingChange("settings.events.keywordReactions.enabled", checked)
                      }
                    />
                    <Label htmlFor="keywordReactionsEnabled">Kulcsszavas reakciók engedélyezése</Label>
                  </div>

                  {config.settings.events.keywordReactions.enabled && (
                    <div>
                      <Label>Kulcsszó-reakció párok</Label>
                      <div className="space-y-2">
                        {config.settings.events.keywordReactions.keywords.map((item, index) => (
                          <div key={index} className="flex space-x-2">
                            <Input
                              placeholder="Kulcsszó"
                              value={item.word}
                              onChange={(e) => {
                                const newKeywords = [...config.settings.events.keywordReactions.keywords]
                                newKeywords[index].word = e.target.value
                                handleSettingChange("settings.events.keywordReactions.keywords", newKeywords)
                              }}
                            />
                            <Input
                              placeholder="Reakció (emoji)"
                              value={item.reaction}
                              onChange={(e) => {
                                const newKeywords = [...config.settings.events.keywordReactions.keywords]
                                newKeywords[index].reaction = e.target.value
                                handleSettingChange("settings.events.keywordReactions.keywords", newKeywords)
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newKeywords = config.settings.events.keywordReactions.keywords.filter(
                                  (_, i) => i !== index,
                                )
                                handleSettingChange("settings.events.keywordReactions.keywords", newKeywords)
                              }}
                            >
                              Törlés
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newKeywords = [
                              ...config.settings.events.keywordReactions.keywords,
                              { word: "", reaction: "" },
                            ]
                            handleSettingChange("settings.events.keywordReactions.keywords", newKeywords)
                          }}
                        >
                          Új kulcsszó hozzáadása
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Tab - Integrációk */}
          <TabsContent value="integrations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PuzzleIcon className="h-5 w-5" />
                  <span>Integrációk</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Béta
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PuzzleIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Integrációk hamarosan!</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Hamarosan elérhető lesz a külső szolgáltatásokkal való integráció, mint például Spotify, Twitch, és
                    egyedi Webhook-ok.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Tervezett integrációk:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="outline">Spotify</Badge>
                      <Badge variant="outline">Twitch</Badge>
                      <Badge variant="outline">YouTube</Badge>
                      <Badge variant="outline">Webhook-ok</Badge>
                      <Badge variant="outline">RSS Feed</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plugins Tab - Bővítmények */}
          <TabsContent value="plugins" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Plugin Galéria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PlugIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Plugin rendszer fejlesztés alatt</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Hamarosan lehetőség lesz egyedi bővítmények feltöltésére és telepítésére. Az adminok saját modulokat
                    hozhatnak létre, a felhasználók pedig egy kattintással telepíthetik őket.
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Egyedi Parancsok</h4>
                        <p className="text-sm text-gray-600">Saját bot parancsok létrehozása</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Automatizáció</h4>
                        <p className="text-sm text-gray-600">Komplex automatizált folyamatok</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Integráció</h4>
                        <p className="text-sm text-gray-600">Külső API-k beintegrálása</p>
                      </div>
                    </div>
                    <Button variant="outline" disabled>
                      Plugin feltöltése (Hamarosan)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Beállítások */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5" />
                  <span>Rendszer Beállítások</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    Coming Soon
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <SettingsIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Fejlett beállítások hamarosan</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Ez a szekció később kerül fejlesztésre, ahol részletes rendszerbeállításokat és konfigurációkat
                    kezelhet majd.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Tervezett funkciók:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="outline">Részletes naplózás</Badge>
                      <Badge variant="outline">Biztonsági beállítások</Badge>
                      <Badge variant="outline">Teljesítmény optimalizálás</Badge>
                      <Badge variant="outline">Backup kezelés</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {saveSuccess && (
              <Alert className="w-auto border-green-200 bg-green-50">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">Konfiguráció sikeresen mentve!</AlertDescription>
              </Alert>
            )}
            {saveError && (
              <Alert className="w-auto" variant="destructive">
                <XCircleIcon className="h-4 w-4" />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
          </div>

          <Button onClick={handleSaveConfig} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Mentés...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Változások mentése
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
