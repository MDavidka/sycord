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
  InfoIcon,
  ShieldCheckIcon,
  MenuIcon,
  ServerIcon,
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
          <p className="text-muted-foreground">Loading server configuration...</p>
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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Configuration not found</h2>
          <p className="text-muted-foreground text-center mb-6 text-sm sm:text-base max-w-md">
            Failed to load server configuration. Please try again.
          </p>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Dashboard
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
                <p className="text-xs text-muted-foreground hidden sm:block">Server Configuration</p>
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
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <ServerIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{config.serverName}</p>
                        <p className="text-xs text-muted-foreground">Server ID: {config.serverId.slice(0, 8)}...</p>
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
                      Back to Dashboard
                    </Button>

                    <Button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      variant="ghost"
                      className="justify-start text-muted-foreground hover:text-foreground mt-auto"
                    >
                      <LogOutIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Server Chooser */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex items-center space-x-2 bg-transparent">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                      <ServerIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-sm max-w-32 truncate">{config.serverName}</span>
                    <ChevronDownIcon className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel className="text-xs">Switch Server</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")} className="text-xs">
                    <ArrowLeftIcon className="mr-2 h-3 w-3" />
                    Back to Dashboard
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
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs" onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOutIcon className="mr-2 h-3 w-3" />
                    Sign Out
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
          {/* Optimized Tabs */}
          <div className="mb-4 sm:mb-6">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-7 sm:h-8 items-center justify-center rounded-md bg-muted p-0.5 text-muted-foreground">
                <TabsTrigger value="home" className="text-xs px-2 py-1 h-6 sm:h-7 data-[state=active]:bg-background">
                  <HomeIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Home</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sentinel"
                  className="text-xs px-2 py-1 h-6 sm:h-7 data-[state=active]:bg-background"
                >
                  <ShieldIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Sentinel</span>
                </TabsTrigger>
                <TabsTrigger
                  value="helpdesk"
                  className="text-xs px-2 py-1 h-6 sm:h-7 data-[state=active]:bg-background"
                >
                  <HeadphonesIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Helpdesk</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs px-2 py-1 h-6 sm:h-7 data-[state=active]:bg-background">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Events</span>
                </TabsTrigger>
                <TabsTrigger
                  value="integrations"
                  className="text-xs px-2 py-1 h-6 sm:h-7 data-[state=active]:bg-background"
                >
                  <PuzzleIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Integrations</span>
                </TabsTrigger>
                <TabsTrigger value="plugins" className="text-xs px-2 py-1 h-6 sm:h-7 data-[state=active]:bg-background">
                  <PlugIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Plugins</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="text-xs px-2 py-1 h-6 sm:h-7 data-[state=active]:bg-background"
                >
                  <SettingsIcon className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                {/* Admin Tab - Only visible for specific user */}
                {isAdmin && (
                  <TabsTrigger
                    value="admin"
                    className="text-xs px-2 py-1 h-6 sm:h-7 bg-destructive/10 text-destructive data-[state=active]:bg-destructive/20"
                  >
                    <ShieldCheckIcon className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">Admin</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Home Tab */}
          <TabsContent value="home" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Server Stats in Big Box */}
              <Card className="modern-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <TrendingUpIcon className="h-5 w-5" />
                    <span>Server Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <UsersIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                      <h3 className="text-2xl font-bold text-foreground">{config.serverStats.totalMembers}</h3>
                      <p className="text-muted-foreground text-sm">Members</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <CrownIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                      <h3 className="text-2xl font-bold text-foreground">{config.serverStats.totalAdmins}</h3>
                      <p className="text-muted-foreground text-sm">Admins</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <BotIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                      <h3 className="text-2xl font-bold text-foreground">{config.serverStats.totalBots}</h3>
                      <p className="text-muted-foreground text-sm">Bots</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div
                        className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                          config.botStatus === "online"
                            ? "bg-green-500 animate-pulse"
                            : config.botStatus === "maintenance"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <h3 className="text-sm font-bold text-foreground">
                        {config.botStatus === "online"
                          ? "Online"
                          : config.botStatus === "maintenance"
                            ? "Maintenance"
                            : "Offline"}
                      </h3>
                      <p className="text-muted-foreground text-sm">Bot Status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Changelog */}
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
                        New
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

              {/* Quick Stats */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <ActivityIcon className="h-4 w-4" />
                    <span>Quick Overview</span>
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
                      <p className="text-xs text-muted-foreground">Active Features</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <h4 className="text-sm font-bold text-foreground capitalize">
                        {config.moderation.moderationLevel}
                      </h4>
                      <p className="text-xs text-muted-foreground">Moderation Level</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <h4 className="text-sm font-bold text-foreground">
                        {config.support.ticketSystem.enabled ? "Active" : "Inactive"}
                      </h4>
                      <p className="text-xs text-muted-foreground">Ticket System</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <h4 className="text-sm font-bold text-foreground">
                        {config.settings.logs.enabled ? "Active" : "Inactive"}
                      </h4>
                      <p className="text-xs text-muted-foreground">Logging</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sentinel Tab */}
          <TabsContent value="sentinel" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Moderation Level with 3-way switch and info button */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <ShieldIcon className="h-4 w-4" />
                    <span>Sentinel AI Moderator</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <InfoIcon className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-sm flex items-center space-x-2">
                            <ShieldIcon className="h-4 w-4 text-primary" />
                            <span>How was the bot trained?</span>
                          </DialogTitle>
                          <DialogDescription className="text-xs space-y-2">
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="font-medium mb-2">
                                Sentinel AI was trained on over 10,000 real moderation cases:
                              </p>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>• Spam message analysis</span>
                                  <span className="font-mono">3,500</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Malicious link detection</span>
                                  <span className="font-mono">2,800</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Toxic behavior patterns</span>
                                  <span className="font-mono">1,900</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Raid attack analysis</span>
                                  <span className="font-mono">1,200</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Phishing attempts</span>
                                  <span className="font-mono">600</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-center text-muted-foreground">
                              The AI continuously learns and improves from every new case.
                            </p>
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <Label htmlFor="moderationLevel" className="text-xs mb-2 block">
                      Choose moderation level
                    </Label>
                    <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => handleSettingChange("moderation.moderationLevel", "off")}
                        className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                          config.moderation.moderationLevel === "off"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Off
                      </button>
                      <button
                        onClick={() => handleSettingChange("moderation.moderationLevel", "basic")}
                        className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                          config.moderation.moderationLevel === "basic"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Basic
                      </button>
                      <button
                        onClick={() => handleSettingChange("moderation.moderationLevel", "advanced")}
                        className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                          config.moderation.moderationLevel === "advanced"
                            ? "bg-destructive/20 text-destructive shadow-sm border border-destructive/30"
                            : "text-muted-foreground hover:text-destructive"
                        }`}
                      >
                        Advanced
                      </button>
                    </div>
                  </div>

                  {config.moderation.moderationLevel !== "off" && (
                    <Alert className="py-2">
                      <InfoIcon className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {config.moderation.moderationLevel === "basic"
                          ? "Basic moderation active: spam protection, malicious link filtering."
                          : "Advanced moderation active: full AI analysis, proactive protection, detailed logging."}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Link Filter */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Link Filter</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="linkFilterEnabled"
                      checked={config.moderation.linkFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.linkFilter.enabled", checked)}
                    />
                    <Label htmlFor="linkFilterEnabled" className="text-xs">
                      Enable link filter
                    </Label>
                  </div>

                  {config.moderation.linkFilter.enabled && (
                    <>
                      <div>
                        <Label htmlFor="linkFilterConfig" className="text-xs">
                          Filter type
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
                              Block all links
                            </SelectItem>
                            <SelectItem value="whitelist_only" className="text-xs">
                              Allow only whitelisted links
                            </SelectItem>
                            <SelectItem value="phishing_only" className="text-xs">
                              Block only malicious links
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.moderation.linkFilter.config === "whitelist_only" && (
                        <div>
                          <Label htmlFor="whitelist" className="text-xs">
                            Allowed domains (one per line)
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

              {/* Bad Word Filter */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bad Word Filter</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="badWordFilterEnabled"
                      checked={config.moderation.badWordFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.badWordFilter.enabled", checked)}
                    />
                    <Label htmlFor="badWordFilterEnabled" className="text-xs">
                      Enable bad word filter
                    </Label>
                  </div>

                  {config.moderation.badWordFilter.enabled && (
                    <div>
                      <Label htmlFor="customWords" className="text-xs">
                        Custom banned words (one per line)
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
                        placeholder="banned_word1&#10;banned_word2"
                        rows={4}
                        className="text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raid Protection */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Raid Protection</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="raidProtectionEnabled"
                      checked={config.moderation.raidProtection.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.raidProtection.enabled", checked)}
                    />
                    <Label htmlFor="raidProtectionEnabled" className="text-xs">
                      Enable raid protection
                    </Label>
                  </div>

                  {config.moderation.raidProtection.enabled && (
                    <div>
                      <Label htmlFor="raidThreshold" className="text-xs">
                        Raid threshold (joining members per minute)
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

              {/* Auto Role */}
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
                      Auto assign role on join
                    </Label>
                  </div>

                  {config.moderation.autoRole.enabled && (
                    <div>
                      <Label htmlFor="autoRoleId" className="text-xs">
                        Role ID
                      </Label>
                      <Input
                        id="autoRoleId"
                        value={config.moderation.autoRole.roleId}
                        onChange={(e) => handleSettingChange("moderation.autoRole.roleId", e.target.value)}
                        placeholder="Enter role ID"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Helpdesk Tab */}
          <TabsContent value="helpdesk" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Ticket System */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ticket System</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ticketSystemEnabled"
                      checked={config.support.ticketSystem.enabled}
                      onCheckedChange={(checked) => handleSettingChange("support.ticketSystem.enabled", checked)}
                    />
                    <Label htmlFor="ticketSystemEnabled" className="text-xs">
                      Enable ticket system
                    </Label>
                  </div>

                  {config.support.ticketSystem.enabled && (
                    <>
                      <div>
                        <Label htmlFor="ticketChannel" className="text-xs">
                          Ticket channel ID
                        </Label>
                        <Input
                          id="ticketChannel"
                          value={config.support.ticketSystem.channelId}
                          onChange={(e) => handleSettingChange("support.ticketSystem.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supportRole" className="text-xs">
                          Support role ID
                        </Label>
                        <Input
                          id="supportRole"
                          value={config.support.ticketSystem.priorityRoleId}
                          onChange={(e) => handleSettingChange("support.ticketSystem.priorityRoleId", e.target.value)}
                          placeholder="Support team role ID"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ticketCategories" className="text-xs">
                          Ticket categories (one per line)
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
                          placeholder="General Support&#10;Technical Issue&#10;Report&#10;Other"
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Welcome Messages */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Welcome Messages</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="welcomeEnabled"
                      checked={config.support.welcome.enabled}
                      onCheckedChange={(checked) => handleSettingChange("support.welcome.enabled", checked)}
                    />
                    <Label htmlFor="welcomeEnabled" className="text-xs">
                      Enable welcome messages
                    </Label>
                  </div>

                  {config.support.welcome.enabled && (
                    <>
                      <div>
                        <Label htmlFor="welcomeChannel" className="text-xs">
                          Welcome channel ID
                        </Label>
                        <Input
                          id="welcomeChannel"
                          value={config.support.welcome.channelId}
                          onChange={(e) => handleSettingChange("support.welcome.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="welcomeMessage" className="text-xs">
                          Welcome message
                        </Label>
                        <Textarea
                          id="welcomeMessage"
                          value={config.support.welcome.message}
                          onChange={(e) => handleSettingChange("support.welcome.message", e.target.value)}
                          placeholder="Welcome {user} to {server}!"
                          rows={2}
                          className="text-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available variables: {"{user}"} - user name, {"{server}"} - server name
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="welcomeDmEnabled"
                          checked={config.support.welcome.dmEnabled}
                          onCheckedChange={(checked) => handleSettingChange("support.welcome.dmEnabled", checked)}
                        />
                        <Label htmlFor="welcomeDmEnabled" className="text-xs">
                          Also send welcome message via DM
                        </Label>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              {/* Daily Messages */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Daily Scheduled Messages</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dailyMessagesEnabled"
                      checked={config.events.dailyMessages.enabled}
                      onCheckedChange={(checked) => handleSettingChange("events.dailyMessages.enabled", checked)}
                    />
                    <Label htmlFor="dailyMessagesEnabled" className="text-xs">
                      Enable daily messages
                    </Label>
                  </div>

                  {config.events.dailyMessages.enabled && (
                    <>
                      <div>
                        <Label htmlFor="dailyTime" className="text-xs">
                          Time (HH:MM format)
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
                          Channel ID
                        </Label>
                        <Input
                          id="dailyChannel"
                          value={config.events.dailyMessages.channelId}
                          onChange={(e) => handleSettingChange("events.dailyMessages.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dailyMessage" className="text-xs">
                          Daily message
                        </Label>
                        <Textarea
                          id="dailyMessage"
                          value={config.events.dailyMessages.message}
                          onChange={(e) => handleSettingChange("events.dailyMessages.message", e.target.value)}
                          placeholder="Good morning everyone! 🌅"
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Join/Leave Events */}
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Join/Leave Events</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="joinLeaveEnabled"
                      checked={config.events.joinLeave.enabled}
                      onCheckedChange={(checked) => handleSettingChange("events.joinLeave.enabled", checked)}
                    />
                    <Label htmlFor="joinLeaveEnabled" className="text-xs">
                      Enable join/leave events
                    </Label>
                  </div>

                  {config.events.joinLeave.enabled && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="joinChannelId" className="text-xs">
                            Join channel ID
                          </Label>
                          <Input
                            id="joinChannelId"
                            value={config.events.joinLeave.joinChannelId}
                            onChange={(e) => handleSettingChange("events.joinLeave.joinChannelId", e.target.value)}
                            placeholder="Channel ID"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="leaveChannelId" className="text-xs">
                            Leave channel ID
                          </Label>
                          <Input
                            id="leaveChannelId"
                            value={config.events.joinLeave.leaveChannelId}
                            onChange={(e) => handleSettingChange("events.joinLeave.leaveChannelId", e.target.value)}
                            placeholder="Channel ID"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="joinMessage" className="text-xs">
                          Join message
                        </Label>
                        <Textarea
                          id="joinMessage"
                          value={config.events.joinLeave.joinMessage}
                          onChange={(e) => handleSettingChange("events.joinLeave.joinMessage", e.target.value)}
                          placeholder="🎉 {user} joined the server!"
                          rows={1}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="leaveMessage" className="text-xs">
                          Leave message
                        </Label>
                        <Textarea
                          id="leaveMessage"
                          value={config.events.joinLeave.leaveMessage}
                          onChange={(e) => handleSettingChange("events.joinLeave.leaveMessage", e.target.value)}
                          placeholder="👋 {user} left the server."
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

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Giveaway Integration</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="giveawayEnabled"
                      checked={config.integrations.giveaway.enabled}
                      onCheckedChange={(checked) => handleSettingChange("integrations.giveaway.enabled", checked)}
                    />
                    <Label htmlFor="giveawayEnabled" className="text-xs">
                      Enable giveaway system
                    </Label>
                  </div>

                  {config.integrations.giveaway.enabled && (
                    <div>
                      <Label htmlFor="giveawayChannel" className="text-xs">
                        Default giveaway channel ID
                      </Label>
                      <Input
                        id="giveawayChannel"
                        value={config.integrations.giveaway.defaultChannelId}
                        onChange={(e) => handleSettingChange("integrations.giveaway.defaultChannelId", e.target.value)}
                        placeholder="Enter channel ID"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plugins Tab */}
          <TabsContent value="plugins" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Plugin Manager</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-xs mb-3">
                    Manage server plugins here. Plugins add additional functionality to the bot.
                  </p>
                  <div className="space-y-2">
                    {config.plugins.available.length > 0 ? (
                      config.plugins.available.map((plugin) => (
                        <div key={plugin} className="flex items-center justify-between p-2 border rounded-md">
                          <div>
                            <h4 className="font-medium text-sm">{plugin}</h4>
                            <p className="text-xs text-muted-foreground">Plugin description</p>
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
                      <p className="text-muted-foreground text-xs">No plugins available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4 animate-fade-in">
            <div className="space-y-3 sm:space-y-4">
              <Card className="modern-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Logging Settings</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="logsEnabled"
                      checked={config.settings.logs.enabled}
                      onCheckedChange={(checked) => handleSettingChange("settings.logs.enabled", checked)}
                    />
                    <Label htmlFor="logsEnabled" className="text-xs">
                      Enable logging
                    </Label>
                  </div>

                  {config.settings.logs.enabled && (
                    <>
                      <div>
                        <Label htmlFor="logChannel" className="text-xs">
                          Log channel ID
                        </Label>
                        <Input
                          id="logChannel"
                          value={config.settings.logs.channelId}
                          onChange={(e) => handleSettingChange("settings.logs.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">What should the bot log?</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logMessageEdits"
                              checked={config.settings.logs.messageEdits}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.messageEdits", checked)}
                            />
                            <Label htmlFor="logMessageEdits" className="text-xs">
                              Message edits
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logModActions"
                              checked={config.settings.logs.modActions}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.modActions", checked)}
                            />
                            <Label htmlFor="logModActions" className="text-xs">
                              Moderation actions
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logMemberJoins"
                              checked={config.settings.logs.memberJoins}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.memberJoins", checked)}
                            />
                            <Label htmlFor="logMemberJoins" className="text-xs">
                              Member joins
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logMemberLeaves"
                              checked={config.settings.logs.memberLeaves}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.memberLeaves", checked)}
                            />
                            <Label htmlFor="logMemberLeaves" className="text-xs">
                              Member leaves
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
                    <strong>Admin Panel:</strong> This panel is only visible to system administrators. Here you can find
                    system and debug information.
                  </AlertDescription>
                </Alert>

                {/* System Information */}
                <Card className="modern-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p>
                          <strong>Server ID:</strong> {config.serverId}
                        </p>
                        <p>
                          <strong>User ID:</strong> {config.userId}
                        </p>
                        <p>
                          <strong>Bot Status:</strong> {config.botStatus}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p>
                          <strong>Moderation Level:</strong> {config.moderation.moderationLevel}
                        </p>
                        <p>
                          <strong>Active Plugins:</strong> {config.plugins.enabled.length}
                        </p>
                        <p>
                          <strong>Logging:</strong> {config.settings.logs.enabled ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Debug Information */}
                <Card className="modern-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">Debug Information</CardTitle>
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
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>

            {saveSuccess && (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm animate-fade-in">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Successfully saved!</span>
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
