"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, Bot, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface ServerConfig {
  server_id: string
  server_name: string
  server_icon?: string
  is_bot_added: boolean
  settings: {
    moderationLevel: string
    welcome: {
      enabled: boolean
      channelId?: string
      message?: string
      dmEnabled?: boolean
    }
    moderation: {
      linkFilter: {
        enabled: boolean
        config: string
      }
      badWordFilter: {
        enabled: boolean
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
      permissionAbuse: {
        enabled: boolean
        notifyOwnerOnRoleChange: boolean
        monitorAdminActions: boolean
      }
      maliciousBotDetection: {
        enabled: boolean
        newBotNotifications: boolean
        botActivityMonitoring: boolean
        botTimeoutThreshold: number
      }
      tokenWebhookAbuse: {
        enabled: boolean
        webhookCreationMonitor: boolean
        webhookAutoRevoke: boolean
        webhookVerificationTimeout: number
        leakedWebhookScanner: boolean
      }
      inviteHijacking: {
        enabled: boolean
        inviteLinkMonitor: boolean
        vanityUrlWatcher: boolean
      }
      massPingProtection: {
        enabled: boolean
        antiMentionFlood: boolean
        mentionRateLimit: number
        messageCooldownOnRaid: boolean
        cooldownDuration: number
      }
      maliciousFileScanner: {
        enabled: boolean
        suspiciousAttachmentBlocker: boolean
        autoFileFilter: boolean
        allowedFileTypes: string[]
      }
      // Other moderation settings...
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
      // Other support settings...
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
    // Other settings...
  }
  rolesAndNames: Record<string, string>
  channels: Record<string, string>
}

interface BotSettings {
  serverId: string
  name: string
  avatar: string
  status: string
  version: string
  updatedAt: string
}

export default function ServerPage({ params }: { params: { serverId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [config, setConfig] = useState<ServerConfig | null>(null)
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [isBotAdded, setIsBotAdded] = useState(false)
  const [verifyingBot, setVerifyingBot] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchServerConfig()
      fetchBotSettings()
    }
  }, [status, router, params.serverId])

  const fetchServerConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/user-config/${params.serverId}`)

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard")
          return
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setConfig(data.server)
      setIsBotAdded(data.isBotAdded)
    } catch (err) {
      console.error("Error fetching server config:", err)
      setError("Failed to load server configuration. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchBotSettings = async () => {
    try {
      const response = await fetch(`/api/bot-settings/${params.serverId}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setBotSettings(data)
    } catch (err) {
      console.error("Error fetching bot settings:", err)
      // Non-critical error, don't show to user
    }
  }

  const saveConfig = async () => {
    if (!config) return

    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/user-config/${params.serverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: config.settings,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      // Show success message or toast
    } catch (err) {
      console.error("Error saving config:", err)
      setError("Failed to save configuration. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const verifyBot = async () => {
    try {
      setVerifyingBot(true)
      const response = await fetch(`/api/verify-bot/${params.serverId}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setIsBotAdded(data.isBotInServer)

      // Refresh the config if bot is added
      if (data.isBotInServer) {
        fetchServerConfig()
      }
    } catch (err) {
      console.error("Error verifying bot:", err)
    } finally {
      setVerifyingBot(false)
    }
  }

  const handleConfigChange = (path: string, value: any) => {
    if (!config) return

    // Split the path into parts
    const parts = path.split(".")

    // Create a deep copy of the config
    const newConfig = JSON.parse(JSON.stringify(config))

    // Navigate to the correct property
    let current = newConfig.settings
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]]
    }

    // Update the value
    current[parts[parts.length - 1]] = value

    // Update the state
    setConfig(newConfig)
  }

  const getServerIcon = () => {
    if (config?.server_icon) {
      return config.server_icon
    }
    return null
  }

  const getServerInitials = () => {
    if (!config?.server_name) return "S"
    return config.server_name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  const getBotInviteUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID
    const permissions = "8" // Administrator permissions
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands&guild_id=${params.serverId}`
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <Skeleton className="h-10 w-full mb-6" />

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load server configuration. Please go back to the dashboard and try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  if (!isBotAdded) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={getServerIcon() || ""} alt={config.server_name} />
            <AvatarFallback>{getServerInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{config.server_name}</h1>
            <p className="text-gray-500">Server Configuration</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Bot to Server</CardTitle>
            <CardDescription>
              You need to add the bot to your Discord server before you can configure it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Bot className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-center mb-6">Invite the bot to start configuring your server</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <a href={getBotInviteUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Add to Discord
                </a>
              </Button>
              <Button variant="outline" onClick={verifyBot} disabled={verifyingBot}>
                {verifyingBot ? "Checking..." : "I've Added the Bot"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-12 w-12">
          <AvatarImage src={getServerIcon() || ""} alt={config.server_name} />
          <AvatarFallback>{getServerInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{config.server_name}</h1>
          <p className="text-gray-500">Server Configuration</p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1">
            General
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex-1">
            Moderation
          </TabsTrigger>
          <TabsTrigger value="welcome" className="flex-1">
            Welcome
          </TabsTrigger>
          <TabsTrigger value="support" className="flex-1">
            Support
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1">
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general settings for your server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="moderation-level">Moderation Level</Label>
                <Select
                  value={config.settings.moderationLevel}
                  onValueChange={(value) => handleConfigChange("moderationLevel", value)}
                >
                  <SelectTrigger id="moderation-level">
                    <SelectValue placeholder="Select moderation level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="lockdown">Lockdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bot settings section */}
              {botSettings && (
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Bot Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bot-name">Bot Name</Label>
                      <Input id="bot-name" value={botSettings.name} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bot-status">Bot Status</Label>
                      <Input id="bot-status" value={botSettings.status} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bot-version">Bot Version</Label>
                      <Input id="bot-version" value={botSettings.version} disabled />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Settings</CardTitle>
              <CardDescription>Configure moderation features for your server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="link-filter" className="text-base">
                    Link Filter
                  </Label>
                  <p className="text-sm text-gray-500">Filter links posted in your server</p>
                </div>
                <Switch
                  id="link-filter"
                  checked={config.settings.moderation.linkFilter.enabled}
                  onCheckedChange={(checked) => handleConfigChange("moderation.linkFilter.enabled", checked)}
                />
              </div>

              {config.settings.moderation.linkFilter.enabled && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="link-filter-config">Filter Type</Label>
                  <Select
                    value={config.settings.moderation.linkFilter.config}
                    onValueChange={(value) => handleConfigChange("moderation.linkFilter.config", value)}
                  >
                    <SelectTrigger id="link-filter-config">
                      <SelectValue placeholder="Select filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_links">All Links</SelectItem>
                      <SelectItem value="whitelist_only">Whitelist Only</SelectItem>
                      <SelectItem value="phishing_only">Phishing Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="bad-word-filter" className="text-base">
                    Bad Word Filter
                  </Label>
                  <p className="text-sm text-gray-500">Filter inappropriate language</p>
                </div>
                <Switch
                  id="bad-word-filter"
                  checked={config.settings.moderation.badWordFilter.enabled}
                  onCheckedChange={(checked) => handleConfigChange("moderation.badWordFilter.enabled", checked)}
                />
              </div>

              {/* Add more moderation settings here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="welcome" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Settings</CardTitle>
              <CardDescription>Configure welcome messages for new members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="welcome-enabled" className="text-base">
                    Welcome Messages
                  </Label>
                  <p className="text-sm text-gray-500">Send a message when new members join</p>
                </div>
                <Switch
                  id="welcome-enabled"
                  checked={config.settings.welcome.enabled}
                  onCheckedChange={(checked) => handleConfigChange("welcome.enabled", checked)}
                />
              </div>

              {config.settings.welcome.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="welcome-channel">Welcome Channel</Label>
                    <Input
                      id="welcome-channel"
                      placeholder="Channel ID"
                      value={config.settings.welcome.channelId || ""}
                      onChange={(e) => handleConfigChange("welcome.channelId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Textarea
                      id="welcome-message"
                      placeholder="Welcome message"
                      value={config.settings.welcome.message || ""}
                      onChange={(e) => handleConfigChange("welcome.message", e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      Use {"{user}"} to mention the user, {"{server}"} for server name
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="welcome-dm" className="text-base">
                        DM Welcome
                      </Label>
                      <p className="text-sm text-gray-500">Also send welcome message as a DM</p>
                    </div>
                    <Switch
                      id="welcome-dm"
                      checked={config.settings.welcome.dmEnabled || false}
                      onCheckedChange={(checked) => handleConfigChange("welcome.dmEnabled", checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Settings</CardTitle>
              <CardDescription>Configure support features for your server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ticket-system" className="text-base">
                    Ticket System
                  </Label>
                  <p className="text-sm text-gray-500">Allow users to create support tickets</p>
                </div>
                <Switch
                  id="ticket-system"
                  checked={config.settings.support.ticketSystem.enabled}
                  onCheckedChange={(checked) => handleConfigChange("support.ticketSystem.enabled", checked)}
                />
              </div>

              {config.settings.support.ticketSystem.enabled && (
                <div className="space-y-2">
                  <Label htmlFor="ticket-channel">Ticket Channel</Label>
                  <Input
                    id="ticket-channel"
                    placeholder="Channel ID"
                    value={config.settings.support.ticketSystem.channelId || ""}
                    onChange={(e) => handleConfigChange("support.ticketSystem.channelId", e.target.value)}
                  />
                </div>
              )}

              {/* Add more support settings here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logging Settings</CardTitle>
              <CardDescription>Configure logging features for your server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="logs-enabled" className="text-base">
                    Enable Logging
                  </Label>
                  <p className="text-sm text-gray-500">Log server events to a channel</p>
                </div>
                <Switch
                  id="logs-enabled"
                  checked={config.settings.logs.enabled}
                  onCheckedChange={(checked) => handleConfigChange("logs.enabled", checked)}
                />
              </div>

              {config.settings.logs.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="logs-channel">Log Channel</Label>
                    <Input
                      id="logs-channel"
                      placeholder="Channel ID"
                      value={config.settings.logs.channelId || ""}
                      onChange={(e) => handleConfigChange("logs.channelId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Events to Log</h3>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="log-message-edits" className="cursor-pointer">
                        Message Edits
                      </Label>
                      <Switch
                        id="log-message-edits"
                        checked={config.settings.logs.messageEdits}
                        onCheckedChange={(checked) => handleConfigChange("logs.messageEdits", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="log-mod-actions" className="cursor-pointer">
                        Moderation Actions
                      </Label>
                      <Switch
                        id="log-mod-actions"
                        checked={config.settings.logs.modActions}
                        onCheckedChange={(checked) => handleConfigChange("logs.modActions", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="log-member-joins" className="cursor-pointer">
                        Member Joins
                      </Label>
                      <Switch
                        id="log-member-joins"
                        checked={config.settings.logs.memberJoins}
                        onCheckedChange={(checked) => handleConfigChange("logs.memberJoins", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="log-member-leaves" className="cursor-pointer">
                        Member Leaves
                      </Label>
                      <Switch
                        id="log-member-leaves"
                        checked={config.settings.logs.memberLeaves}
                        onCheckedChange={(checked) => handleConfigChange("logs.memberLeaves", checked)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
