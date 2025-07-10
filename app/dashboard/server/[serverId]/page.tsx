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
  PuzzleIcon,
  PlugIcon,
} from "lucide-react"
import Image from "next/image"
import { signOut } from "next-auth/react"

interface ServerSettings {
  serverId: string
  serverName: string
  userId: string
  settings: {
    moderationLevel: "off" | "on" | "lockdown"
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
      }
      autoAnswer: {
        enabled: boolean
        qaPairs: string
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
      let current: any = newConfig.settings

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading server configuration...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuration Not Found</h2>
        <p className="text-gray-600 text-center mb-4">Could not load server configuration. Please try again.</p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Dashboard
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
                  <DropdownMenuLabel>Switch Server</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Dashboard
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
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-gray-700 hover:bg-gray-50"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Log out
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
                  Home
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
                  value="integration"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <PuzzleIcon className="mr-2 h-4 w-4" />
                  Integration
                </TabsTrigger>
                <TabsTrigger
                  value="plugin"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <PlugIcon className="mr-2 h-4 w-4" />
                  Plugin
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

          {/* Home Tab */}
          <TabsContent value="home" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Server Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <h3 className="text-2xl font-bold text-blue-600">Active</h3>
                    <p className="text-gray-600">Bot Status</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <h3 className="text-2xl font-bold text-green-600">
                      {Object.values(config.settings).filter((setting: any) => setting.enabled).length}
                    </h3>
                    <p className="text-gray-600">Features Enabled</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <h3 className="text-2xl font-bold text-purple-600">{config.serverName}</h3>
                    <p className="text-gray-600">Server Name</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sentinel Tab (Moderation) */}
          <TabsContent value="sentinel" className="mt-6">
            <div className="space-y-6">
              {/* General Moderation */}
              <Card>
                <CardHeader>
                  <CardTitle>General Moderation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="moderationLevel">Moderation Level</Label>
                    <Select
                      value={config.settings.moderationLevel}
                      onValueChange={(value: "off" | "on" | "lockdown") =>
                        handleSettingChange("moderationLevel", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select moderation level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="on">On</SelectItem>
                        <SelectItem value="lockdown">Lockdown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Link Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Link Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="linkFilterEnabled"
                      checked={config.settings.linkFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("linkFilter.enabled", checked)}
                    />
                    <Label htmlFor="linkFilterEnabled">Enable Link Filter</Label>
                  </div>

                  {config.settings.linkFilter.enabled && (
                    <>
                      <div>
                        <Label htmlFor="linkFilterConfig">Filter Type</Label>
                        <Select
                          value={config.settings.linkFilter.config}
                          onValueChange={(value) => handleSettingChange("linkFilter.config", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_links">Block All Links</SelectItem>
                            <SelectItem value="whitelist_only">Allow Whitelisted Only</SelectItem>
                            <SelectItem value="phishing_only">Block Phishing Links Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.settings.linkFilter.config === "whitelist_only" && (
                        <div>
                          <Label htmlFor="whitelist">Whitelisted Domains (one per line)</Label>
                          <Textarea
                            id="whitelist"
                            value={config.settings.linkFilter.whitelist.join("\n")}
                            onChange={(e) =>
                              handleSettingChange("linkFilter.whitelist", e.target.value.split("\n").filter(Boolean))
                            }
                            placeholder="example.com&#10;another.org"
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
                  <CardTitle>Bad Word Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="badWordFilterEnabled"
                      checked={config.settings.badWordFilter.enabled}
                      onCheckedChange={(checked) => handleSettingChange("badWordFilter.enabled", checked)}
                    />
                    <Label htmlFor="badWordFilterEnabled">Enable Bad Word Filter</Label>
                  </div>

                  {config.settings.badWordFilter.enabled && (
                    <div>
                      <Label htmlFor="customWords">Custom Bad Words (one per line)</Label>
                      <Textarea
                        id="customWords"
                        value={config.settings.badWordFilter.customWords.join("\n")}
                        onChange={(e) =>
                          handleSettingChange("badWordFilter.customWords", e.target.value.split("\n").filter(Boolean))
                        }
                        placeholder="word1&#10;word2"
                        rows={6}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raid Protection */}
              <Card>
                <CardHeader>
                  <CardTitle>Raid Protection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="raidProtectionEnabled"
                      checked={config.settings.raidProtection.enabled}
                      onCheckedChange={(checked) => handleSettingChange("raidProtection.enabled", checked)}
                    />
                    <Label htmlFor="raidProtectionEnabled">Enable Raid Protection</Label>
                  </div>

                  {config.settings.raidProtection.enabled && (
                    <div>
                      <Label htmlFor="raidThreshold">Raid Threshold (members joining per minute)</Label>
                      <Input
                        id="raidThreshold"
                        type="number"
                        value={config.settings.raidProtection.threshold}
                        onChange={(e) =>
                          handleSettingChange("raidProtection.threshold", Number.parseInt(e.target.value))
                        }
                        min="1"
                        max="100"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Auto Role */}
              <Card>
                <CardHeader>
                  <CardTitle>Auto Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoRoleEnabled"
                      checked={config.settings.autoRole.enabled}
                      onCheckedChange={(checked) => handleSettingChange("autoRole.enabled", checked)}
                    />
                    <Label htmlFor="autoRoleEnabled">Auto Assign Role on Join</Label>
                  </div>

                  {config.settings.autoRole.enabled && (
                    <div>
                      <Label htmlFor="autoRoleId">Role ID</Label>
                      <Input
                        id="autoRoleId"
                        value={config.settings.autoRole.roleId}
                        onChange={(e) => handleSettingChange("autoRole.roleId", e.target.value)}
                        placeholder="Enter role ID"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Helpdesk Tab */}
          <TabsContent value="helpdesk" className="mt-6">
            <div className="space-y-6">
              {/* Welcome Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="welcomeEnabled"
                      checked={config.settings.welcome.enabled}
                      onCheckedChange={(checked) => handleSettingChange("welcome.enabled", checked)}
                    />
                    <Label htmlFor="welcomeEnabled">Enable Welcome Messages</Label>
                  </div>

                  {config.settings.welcome.enabled && (
                    <>
                      <div>
                        <Label htmlFor="welcomeChannel">Welcome Channel ID</Label>
                        <Input
                          id="welcomeChannel"
                          value={config.settings.welcome.channelId}
                          onChange={(e) => handleSettingChange("welcome.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="welcomeMessage">Welcome Message</Label>
                        <Textarea
                          id="welcomeMessage"
                          value={config.settings.welcome.message}
                          onChange={(e) => handleSettingChange("welcome.message", e.target.value)}
                          placeholder="Welcome {user} to {server}!"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="welcomeDmEnabled"
                          checked={config.settings.welcome.dmEnabled}
                          onCheckedChange={(checked) => handleSettingChange("welcome.dmEnabled", checked)}
                        />
                        <Label htmlFor="welcomeDmEnabled">Send Welcome Message in DM</Label>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Support System */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ticketSystemEnabled"
                      checked={config.settings.support.ticketSystem.enabled}
                      onCheckedChange={(checked) => handleSettingChange("support.ticketSystem.enabled", checked)}
                    />
                    <Label htmlFor="ticketSystemEnabled">Enable Ticket System</Label>
                  </div>

                  {config.settings.support.ticketSystem.enabled && (
                    <>
                      <div>
                        <Label htmlFor="ticketChannel">Ticket Channel ID</Label>
                        <Input
                          id="ticketChannel"
                          value={config.settings.support.ticketSystem.channelId}
                          onChange={(e) => handleSettingChange("support.ticketSystem.channelId", e.target.value)}
                          placeholder="Enter channel ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supportRole">Support Role ID</Label>
                        <Input
                          id="supportRole"
                          value={config.settings.support.ticketSystem.priorityRoleId}
                          onChange={(e) => handleSettingChange("support.ticketSystem.priorityRoleId", e.target.value)}
                          placeholder="Enter role ID for support staff"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Giveaway Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="giveawayEnabled"
                    checked={config.settings.giveaway.enabled}
                    onCheckedChange={(checked) => handleSettingChange("giveaway.enabled", checked)}
                  />
                  <Label htmlFor="giveawayEnabled">Enable Giveaway Module</Label>
                </div>

                {config.settings.giveaway.enabled && (
                  <div>
                    <Label htmlFor="defaultGiveawayChannel">Default Giveaway Channel ID</Label>
                    <Input
                      id="defaultGiveawayChannel"
                      value={config.settings.giveaway.defaultChannelId}
                      onChange={(e) => handleSettingChange("giveaway.defaultChannelId", e.target.value)}
                      placeholder="Enter channel ID"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plugin Tab */}
          <TabsContent value="plugin" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Plugins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <PlugIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No plugins available</h3>
                  <p className="text-gray-600">Plugin system coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Logging Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="logsEnabled"
                    checked={config.settings.logs.enabled}
                    onCheckedChange={(checked) => handleSettingChange("logs.enabled", checked)}
                  />
                  <Label htmlFor="logsEnabled">Enable Logging</Label>
                </div>

                {config.settings.logs.enabled && (
                  <>
                    <div>
                      <Label htmlFor="logChannel">Log Channel ID</Label>
                      <Input
                        id="logChannel"
                        value={config.settings.logs.channelId}
                        onChange={(e) => handleSettingChange("logs.channelId", e.target.value)}
                        placeholder="Enter channel ID"
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Log Types</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="messageEdits"
                            checked={config.settings.logs.messageEdits}
                            onCheckedChange={(checked) => handleSettingChange("logs.messageEdits", checked)}
                          />
                          <Label htmlFor="messageEdits">Message Edits</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="modActions"
                            checked={config.settings.logs.modActions}
                            onCheckedChange={(checked) => handleSettingChange("logs.modActions", checked)}
                          />
                          <Label htmlFor="modActions">Moderation Actions</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="memberJoins"
                            checked={config.settings.logs.memberJoins}
                            onCheckedChange={(checked) => handleSettingChange("logs.memberJoins", checked)}
                          />
                          <Label htmlFor="memberJoins">Member Joins</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="memberLeaves"
                            checked={config.settings.logs.memberLeaves}
                            onCheckedChange={(checked) => handleSettingChange("logs.memberLeaves", checked)}
                          />
                          <Label htmlFor="memberLeaves">Member Leaves</Label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                <AlertDescription className="text-green-800">Configuration saved successfully!</AlertDescription>
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
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
