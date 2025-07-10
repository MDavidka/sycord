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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2Icon className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-muted-foreground">Loading server configuration...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Configuration not found</h2>
          <p className="text-muted-foreground text-center mb-6 text-sm sm:text-base max-w-md">
            Failed to load server configuration. Please try again.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="border-blue-200 hover:bg-blue-50 dark:border-blue-800"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100 dark:bg-gray-900/80 dark:border-blue-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Image src="/bot-icon.png" alt="Dash Bot" width={20} height={20} className="rounded-lg" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dash
                </h1>
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <ServerIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{config.serverName}</p>
                        <p className="text-xs text-muted-foreground">Server ID: {config.serverId.slice(0, 8)}...</p>
                      </div>
                    </div>

                    {session?.user && (
                      <div className="flex items-center space-x-3 mb-6 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex items-center space-x-2 border-blue-200 hover:bg-blue-50 dark:border-blue-800 bg-transparent"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <ServerIcon className="h-3 w-3 text-white" />
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
                <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-950 rounded-md">
                  <UserIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
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
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4">
        <Tabs defaultValue="home" className="w-full">
          {/* Modern Tabs */}
          <div className="mb-4 sm:mb-6">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm p-1 text-muted-foreground border border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <TabsTrigger
                  value="home"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <HomeIcon className="mr-1.5 h-4 w-4" />
                  Home
                </TabsTrigger>
                <TabsTrigger
                  value="sentinel"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <ShieldIcon className="mr-1.5 h-4 w-4" />
                  Sentinel
                </TabsTrigger>
                <TabsTrigger
                  value="helpdesk"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <HeadphonesIcon className="mr-1.5 h-4 w-4" />
                  Helpdesk
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <CalendarIcon className="mr-1.5 h-4 w-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="integrations"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <PuzzleIcon className="mr-1.5 h-4 w-4" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger
                  value="plugins"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <PlugIcon className="mr-1.5 h-4 w-4" />
                  Plugins
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <SettingsIcon className="mr-1.5 h-4 w-4" />
                  Settings
                </TabsTrigger>
                {/* Admin Tab - Only visible for specific user */}
                {isAdmin && (
                  <TabsTrigger
                    value="admin"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-red-600 dark:text-red-400"
                  >
                    <ShieldCheckIcon className="mr-1.5 h-4 w-4" />
                    Admin
                  </TabsTrigger>
                )}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Home Tab */}
          <TabsContent value="home" className="mt-4 animate-fade-in">
            <div className="space-y-6">
              {/* Hero Section */}
              <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-200 dark:border-blue-800 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                        <BotIcon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background animate-bounce flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Welcome to {config.serverName}!
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        Manage all bot functions and settings from this dashboard.
                      </p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        >
                          <SparklesIcon className="mr-1 h-3 w-3" />
                          AI Moderation
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                        >
                          <ZapIcon className="mr-1 h-3 w-3" />
                          Quick Setup
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        >
                          <MessageSquareIcon className="mr-1 h-3 w-3" />
                          24/7 Support
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Server Stats in Big Box */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <TrendingUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Server Overview
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UsersIcon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {config.serverStats.totalMembers}
                      </h3>
                      <p className="text-muted-foreground text-sm">Members</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CrownIcon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {config.serverStats.totalAdmins}
                      </h3>
                      <p className="text-muted-foreground text-sm">Admins</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BotIcon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {config.serverStats.totalBots}
                      </h3>
                      <p className="text-muted-foreground text-sm">Bots</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-center mb-3">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            config.botStatus === "online"
                              ? "bg-green-500 animate-pulse"
                              : config.botStatus === "maintenance"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                      </div>
                      <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-1">
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
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                      <InfoIcon className="h-5 w-5" />
                      <span>Changelog - {config.changelog.version}</span>
                      <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs">
                        New
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">{config.changelog.title}</h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">{config.changelog.content}</p>
                      <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-300">
                        <ClockIcon className="h-4 w-4" />
                        <span>{config.changelog.date}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <ActivityIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>Quick Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                      <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {Object.values(config.moderation).filter((setting: any) => setting.enabled).length +
                          Object.values(config.support).filter((setting: any) => setting.enabled).length +
                          Object.values(config.events).filter((setting: any) => setting.enabled).length}
                      </h4>
                      <p className="text-xs text-muted-foreground">Active Features</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
                      <h4 className="text-lg font-bold text-purple-600 dark:text-purple-400 capitalize">
                        {config.moderation.moderationLevel}
                      </h4>
                      <p className="text-xs text-muted-foreground">Moderation Level</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                      <h4 className="text-lg font-bold text-green-600 dark:text-green-400">
                        {config.support.ticketSystem.enabled ? "Active" : "Inactive"}
                      </h4>
                      <p className="text-xs text-muted-foreground">Ticket System</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
                      <h4 className="text-lg font-bold text-orange-600 dark:text-orange-400">
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
            <div className="space-y-6">
              {/* Moderation Level with 3-way switch and info button */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <ShieldIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Sentinel AI Moderator
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                        >
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <ShieldIcon className="h-5 w-5 text-blue-600" />
                            <span>How was the bot trained?</span>
                          </DialogTitle>
                          <DialogDescription className="space-y-3">
                            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                                Sentinel AI was trained on over 10,000 real moderation cases:
                              </p>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-blue-800 dark:text-blue-200">
                                  <span>• Spam message analysis</span>
                                  <span className="font-mono font-bold">3,500</span>
                                </div>
                                <div className="flex justify-between text-blue-800 dark:text-blue-200">
                                  <span>• Malicious link detection</span>
                                  <span className="font-mono font-bold">2,800</span>
                                </div>
                                <div className="flex justify-between text-blue-800 dark:text-blue-200">
                                  <span>• Toxic behavior patterns</span>
                                  <span className="font-mono font-bold">1,900</span>
                                </div>
                                <div className="flex justify-between text-blue-800 dark:text-blue-200">
                                  <span>• Raid attack analysis</span>
                                  <span className="font-mono font-bold">1,200</span>
                                </div>
                                <div className="flex justify-between text-blue-800 dark:text-blue-200">
                                  <span>• Phishing attempts</span>
                                  <span className="font-mono font-bold">600</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-center text-muted-foreground text-sm">
                              The AI continuously learns and improves from every new case.
                            </p>
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Choose moderation level</Label>
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl p-1 border border-blue-200 dark:border-blue-800">
                      <button
                        onClick={() => handleSettingChange("moderation.moderationLevel", "off")}
                        className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          config.moderation.moderationLevel === "off"
                            ? "bg-white dark:bg-gray-800 text-foreground shadow-md border border-blue-200 dark:border-blue-700"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        Off
                      </button>
                      <button
                        onClick={() => handleSettingChange("moderation.moderationLevel", "basic")}
                        className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          config.moderation.moderationLevel === "basic"
                            ? "bg-white dark:bg-gray-800 text-foreground shadow-md border border-blue-200 dark:border-blue-700"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        Basic
                      </button>
                      <button
                        onClick={() => handleSettingChange("moderation.moderationLevel", "advanced")}
                        className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          config.moderation.moderationLevel === "advanced"
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md border border-red-300"
                            : "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        }`}
                      >
                        Advanced
                      </button>
                    </div>
                  </div>

                  {config.moderation.moderationLevel !== "off" && (
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                      <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        {config.moderation.moderationLevel === "basic"
                          ? "Basic moderation active: spam protection, malicious link filtering."
                          : "Advanced moderation active: full AI analysis, proactive protection, detailed logging."}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Link Filter */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Link Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="linkFilterEnabled"
                      checked={config.moderation.linkFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.linkFilter.enabled", checked)}
                    />
                    <Label htmlFor="linkFilterEnabled" className="text-sm font-medium">
                      Enable link filter
                    </Label>
                  </div>

                  {config.moderation.linkFilter.enabled && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Filter type</Label>
                        <Select
                          value={config.moderation.linkFilter.config}
                          onValueChange={(value) => handleSettingChange("moderation.linkFilter.config", value)}
                        >
                          <SelectTrigger className="mt-1 border-blue-200 dark:border-blue-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_links">Block all links</SelectItem>
                            <SelectItem value="whitelist_only">Allow only whitelisted links</SelectItem>
                            <SelectItem value="phishing_only">Block only malicious links</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.moderation.linkFilter.config === "whitelist_only" && (
                        <div>
                          <Label className="text-sm font-medium">Allowed domains (one per line)</Label>
                          <Textarea
                            value={config.moderation.linkFilter.whitelist.join("\n")}
                            onChange={(e) =>
                              handleSettingChange(
                                "moderation.linkFilter.whitelist",
                                e.target.value.split("\n").filter(Boolean),
                              )
                            }
                            placeholder="example.com&#10;youtube.com&#10;discord.gg"
                            rows={4}
                            className="mt-1 border-blue-200 dark:border-blue-800"
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Bad Word Filter */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Bad Word Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="badWordFilterEnabled"
                      checked={config.moderation.badWordFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.badWordFilter.enabled", checked)}
                    />
                    <Label htmlFor="badWordFilterEnabled" className="text-sm font-medium">
                      Enable bad word filter
                    </Label>
                  </div>

                  {config.moderation.badWordFilter.enabled && (
                    <div>
                      <Label className="text-sm font-medium">Custom banned words (one per line)</Label>
                      <Textarea
                        value={config.moderation.badWordFilter.customWords.join("\n")}
                        onChange={(e) =>
                          handleSettingChange(
                            "moderation.badWordFilter.customWords",
                            e.target.value.split("\n").filter(Boolean),
                          )
                        }
                        placeholder="banned_word1&#10;banned_word2"
                        rows={4}
                        className="mt-1 border-blue-200 dark:border-blue-800"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raid Protection */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Raid Protection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="raidProtectionEnabled"
                      checked={config.moderation.raidProtection.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.raidProtection.enabled", checked)}
                    />
                    <Label htmlFor="raidProtectionEnabled" className="text-sm font-medium">
                      Enable raid protection
                    </Label>
                  </div>

                  {config.moderation.raidProtection.enabled && (
                    <div>
                      <Label className="text-sm font-medium">Raid threshold (joining members per minute)</Label>
                      <Input
                        type="number"
                        value={config.moderation.raidProtection.threshold}
                        onChange={(e) =>
                          handleSettingChange("moderation.raidProtection.threshold", Number.parseInt(e.target.value))
                        }
                        min="1"
                        max="100"
                        className="mt-1 border-blue-200 dark:border-blue-800"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Auto Role */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Auto Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="autoRoleEnabled"
                      checked={config.moderation.autoRole.enabled}
                      onCheckedChange={(checked) => handleSettingChange("moderation.autoRole.enabled", checked)}
                    />
                    <Label htmlFor="autoRoleEnabled" className="text-sm font-medium">
                      Auto assign role on join
                    </Label>
                  </div>

                  {config.moderation.autoRole.enabled && (
                    <div>
                      <Label className="text-sm font-medium">Role ID</Label>
                      <Input
                        value={config.moderation.autoRole.roleId}
                        onChange={(e) => handleSettingChange("moderation.autoRole.roleId", e.target.value)}
                        placeholder="Enter role ID"
                        className="mt-1 border-blue-200 dark:border-blue-800"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Helpdesk Tab */}
          <TabsContent value="helpdesk" className="mt-4 animate-fade-in">
            <div className="space-y-6">
              {/* Welcome Messages */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Welcome Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="welcomeEnabled"
                      checked={config.support.welcome.enabled}
                      onCheckedChange={(checked) => handleSettingChange("support.welcome.enabled", checked)}
                    />
                    <Label htmlFor="welcomeEnabled" className="text-sm font-medium">
                      Enable welcome messages
                    </Label>
                  </div>

                  {config.support.welcome.enabled && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Welcome channel ID</Label>
                        <Input
                          value={config.support.welcome.channelId}
                          onChange={(e) => handleSettingChange("support.welcome.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Welcome message</Label>
                        <Textarea
                          value={config.support.welcome.message}
                          onChange={(e) => handleSettingChange("support.welcome.message", e.target.value)}
                          placeholder="Welcome {user} to our server!"
                          rows={3}
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>

                      <div className="flex items-center space-x-3">
                        <Switch
                          id="welcomeDmEnabled"
                          checked={config.support.welcome.dmEnabled}
                          onCheckedChange={(checked) => handleSettingChange("support.welcome.dmEnabled", checked)}
                        />
                        <Label htmlFor="welcomeDmEnabled" className="text-sm font-medium">
                          Also send welcome DM
                        </Label>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Ticket System */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ticket System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="ticketSystemEnabled"
                      checked={config.support.ticketSystem.enabled}
                      onCheckedChange={(checked) => handleSettingChange("support.ticketSystem.enabled", checked)}
                    />
                    <Label htmlFor="ticketSystemEnabled" className="text-sm font-medium">
                      Enable ticket system
                    </Label>
                  </div>

                  {config.support.ticketSystem.enabled && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Ticket channel ID</Label>
                        <Input
                          value={config.support.ticketSystem.channelId}
                          onChange={(e) => handleSettingChange("support.ticketSystem.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Priority role ID</Label>
                        <Input
                          value={config.support.ticketSystem.priorityRoleId}
                          onChange={(e) => handleSettingChange("support.ticketSystem.priorityRoleId", e.target.value)}
                          placeholder="Enter role ID for priority support"
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Ticket categories (one per line)</Label>
                        <Textarea
                          value={config.support.ticketSystem.categories.join("\n")}
                          onChange={(e) =>
                            handleSettingChange(
                              "support.ticketSystem.categories",
                              e.target.value.split("\n").filter(Boolean),
                            )
                          }
                          placeholder="General Support&#10;Bug Report&#10;Feature Request"
                          rows={4}
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Auto Answer */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Auto Answer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="autoAnswerEnabled"
                      checked={config.support.autoAnswer.enabled}
                      onCheckedChange={(checked) => handleSettingChange("support.autoAnswer.enabled", checked)}
                    />
                    <Label htmlFor="autoAnswerEnabled" className="text-sm font-medium">
                      Enable auto answer
                    </Label>
                  </div>

                  {config.support.autoAnswer.enabled && (
                    <div>
                      <Label className="text-sm font-medium">Q&A pairs (JSON format)</Label>
                      <Textarea
                        value={config.support.autoAnswer.qaPairs}
                        onChange={(e) => handleSettingChange("support.autoAnswer.qaPairs", e.target.value)}
                        placeholder='{"how to join": "Click the invite link!", "rules": "Check #rules channel"}'
                        rows={6}
                        className="mt-1 border-blue-200 dark:border-blue-800 font-mono text-sm"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-4 animate-fade-in">
            <div className="space-y-6">
              {/* Daily Messages */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Daily Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="dailyMessagesEnabled"
                      checked={config.events.dailyMessages.enabled}
                      onCheckedChange={(checked) => handleSettingChange("events.dailyMessages.enabled", checked)}
                    />
                    <Label htmlFor="dailyMessagesEnabled" className="text-sm font-medium">
                      Enable daily messages
                    </Label>
                  </div>

                  {config.events.dailyMessages.enabled && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Time (24h format)</Label>
                        <Input
                          type="time"
                          value={config.events.dailyMessages.time}
                          onChange={(e) => handleSettingChange("events.dailyMessages.time", e.target.value)}
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Channel ID</Label>
                        <Input
                          value={config.events.dailyMessages.channelId}
                          onChange={(e) => handleSettingChange("events.dailyMessages.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Daily message</Label>
                        <Textarea
                          value={config.events.dailyMessages.message}
                          onChange={(e) => handleSettingChange("events.dailyMessages.message", e.target.value)}
                          placeholder="Good morning everyone! Have a great day!"
                          rows={3}
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Join/Leave Messages */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Join/Leave Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="joinLeaveEnabled"
                      checked={config.events.joinLeave.enabled}
                      onCheckedChange={(checked) => handleSettingChange("events.joinLeave.enabled", checked)}
                    />
                    <Label htmlFor="joinLeaveEnabled" className="text-sm font-medium">
                      Enable join/leave messages
                    </Label>
                  </div>

                  {config.events.joinLeave.enabled && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Join channel ID</Label>
                          <Input
                            value={config.events.joinLeave.joinChannelId}
                            onChange={(e) => handleSettingChange("events.joinLeave.joinChannelId", e.target.value)}
                            placeholder="Enter channel ID"
                            className="mt-1 border-blue-200 dark:border-blue-800"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Leave channel ID</Label>
                          <Input
                            value={config.events.joinLeave.leaveChannelId}
                            onChange={(e) => handleSettingChange("events.joinLeave.leaveChannelId", e.target.value)}
                            placeholder="Enter channel ID"
                            className="mt-1 border-blue-200 dark:border-blue-800"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Join message</Label>
                        <Textarea
                          value={config.events.joinLeave.joinMessage}
                          onChange={(e) => handleSettingChange("events.joinLeave.joinMessage", e.target.value)}
                          placeholder="Welcome {user} to the server!"
                          rows={2}
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Leave message</Label>
                        <Textarea
                          value={config.events.joinLeave.leaveMessage}
                          onChange={(e) => handleSettingChange("events.joinLeave.leaveMessage", e.target.value)}
                          placeholder="{user} has left the server."
                          rows={2}
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Keyword Reactions */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Keyword Reactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="keywordReactionsEnabled"
                      checked={config.events.keywordReactions.enabled}
                      onCheckedChange={(checked) => handleSettingChange("events.keywordReactions.enabled", checked)}
                    />
                    <Label htmlFor="keywordReactionsEnabled" className="text-sm font-medium">
                      Enable keyword reactions
                    </Label>
                  </div>

                  {config.events.keywordReactions.enabled && (
                    <div>
                      <Label className="text-sm font-medium">Keywords and reactions</Label>
                      <div className="space-y-2 mt-2">
                        {config.events.keywordReactions.keywords.map((item, index) => (
                          <div key={index} className="flex space-x-2">
                            <Input
                              value={item.word}
                              onChange={(e) => {
                                const newKeywords = [...config.events.keywordReactions.keywords]
                                newKeywords[index].word = e.target.value
                                handleSettingChange("events.keywordReactions.keywords", newKeywords)
                              }}
                              placeholder="keyword"
                              className="flex-1 border-blue-200 dark:border-blue-800"
                            />
                            <Input
                              value={item.reaction}
                              onChange={(e) => {
                                const newKeywords = [...config.events.keywordReactions.keywords]
                                newKeywords[index].reaction = e.target.value
                                handleSettingChange("events.keywordReactions.keywords", newKeywords)
                              }}
                              placeholder="😀"
                              className="w-20 border-blue-200 dark:border-blue-800"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newKeywords = config.events.keywordReactions.keywords.filter(
                                  (_, i) => i !== index,
                                )
                                handleSettingChange("events.keywordReactions.keywords", newKeywords)
                              }}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newKeywords = [...config.events.keywordReactions.keywords, { word: "", reaction: "" }]
                            handleSettingChange("events.keywordReactions.keywords", newKeywords)
                          }}
                          className="border-blue-200 hover:bg-blue-50 dark:border-blue-800"
                        >
                          Add Keyword
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-4 animate-fade-in">
            <div className="space-y-6">
              {/* Giveaway Integration */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Giveaway System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="giveawayEnabled"
                      checked={config.integrations.giveaway.enabled}
                      onCheckedChange={(checked) => handleSettingChange("integrations.giveaway.enabled", checked)}
                    />
                    <Label htmlFor="giveawayEnabled" className="text-sm font-medium">
                      Enable giveaway system
                    </Label>
                  </div>

                  {config.integrations.giveaway.enabled && (
                    <div>
                      <Label className="text-sm font-medium">Default giveaway channel ID</Label>
                      <Input
                        value={config.integrations.giveaway.defaultChannelId}
                        onChange={(e) => handleSettingChange("integrations.giveaway.defaultChannelId", e.target.value)}
                        placeholder="Enter channel ID"
                        className="mt-1 border-blue-200 dark:border-blue-800"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plugins Tab */}
          <TabsContent value="plugins" className="mt-4 animate-fade-in">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Available Plugins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {config.plugins.available.map((plugin) => (
                      <div
                        key={plugin}
                        className="flex items-center justify-between p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-white/50 dark:bg-gray-800/50"
                      >
                        <div>
                          <h4 className="font-medium text-foreground capitalize">{plugin.replace("_", " ")}</h4>
                          <p className="text-sm text-muted-foreground">Plugin description</p>
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4 animate-fade-in">
            <div className="space-y-6">
              {/* Logging */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Logging</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="logsEnabled"
                      checked={config.settings.logs.enabled}
                      onCheckedChange={(checked) => handleSettingChange("settings.logs.enabled", checked)}
                    />
                    <Label htmlFor="logsEnabled" className="text-sm font-medium">
                      Enable logging
                    </Label>
                  </div>

                  {config.settings.logs.enabled && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Log channel ID</Label>
                        <Input
                          value={config.settings.logs.channelId}
                          onChange={(e) => handleSettingChange("settings.logs.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                          className="mt-1 border-blue-200 dark:border-blue-800"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Log types</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <Switch
                              id="logMessageEdits"
                              checked={config.settings.logs.messageEdits}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.messageEdits", checked)}
                            />
                            <Label htmlFor="logMessageEdits" className="text-sm">
                              Message edits and deletions
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Switch
                              id="logModActions"
                              checked={config.settings.logs.modActions}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.modActions", checked)}
                            />
                            <Label htmlFor="logModActions" className="text-sm">
                              Moderation actions
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Switch
                              id="logMemberJoins"
                              checked={config.settings.logs.memberJoins}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.memberJoins", checked)}
                            />
                            <Label htmlFor="logMemberJoins" className="text-sm">
                              Member joins
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Switch
                              id="logMemberLeaves"
                              checked={config.settings.logs.memberLeaves}
                              onCheckedChange={(checked) => handleSettingChange("settings.logs.memberLeaves", checked)}
                            />
                            <Label htmlFor="logMemberLeaves" className="text-sm">
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
              <div className="space-y-6">
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <ShieldCheckIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    <strong>Admin Panel:</strong> This tab is only visible to system administrators.
                  </AlertDescription>
                </Alert>

                <Card className="bg-white/80 backdrop-blur-sm border-red-100 dark:bg-gray-800/80 dark:border-red-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-600 dark:text-red-400">System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Server ID</h4>
                        <p className="text-sm font-mono text-red-600 dark:text-red-400">{config.serverId}</p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">User ID</h4>
                        <p className="text-sm font-mono text-red-600 dark:text-red-400">{config.userId}</p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Bot Status</h4>
                        <p className="text-sm font-mono text-red-600 dark:text-red-400 capitalize">
                          {config.botStatus}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Config Version</h4>
                        <p className="text-sm font-mono text-red-600 dark:text-red-400">v2.1.0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-red-100 dark:bg-gray-800/80 dark:border-red-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-600 dark:text-red-400">Debug Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <pre className="text-xs text-red-800 dark:text-red-200 overflow-x-auto">
                        {JSON.stringify(
                          {
                            serverId: config.serverId,
                            userId: config.userId,
                            botStatus: config.botStatus,
                            activeFeatures: {
                              moderation: config.moderation.moderationLevel,
                              ticketSystem: config.support.ticketSystem.enabled,
                              logging: config.settings.logs.enabled,
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

        {/* Save Button */}
        <div className="sticky bottom-4 flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm border border-blue-200 dark:bg-gray-800/90 dark:border-blue-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center space-x-4">
              {saveError && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 py-2 px-3">
                  <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200 text-sm">{saveError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 py-2 px-3">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                    Configuration saved successfully!
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
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
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
