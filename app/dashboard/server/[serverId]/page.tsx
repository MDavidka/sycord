"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PluginsTab } from "@/components/plugins-tab"
import {
  Shield,
  Users,
  Settings,
  MessageSquare,
  Gift,
  Bot,
  AlertTriangle,
  Home,
  ShieldCheck,
  HelpCircle,
  Calendar,
  Puzzle,
  Cog,
  Link2,
} from "lucide-react"
import type { ServerConfig, DiscordChannel, DiscordRole } from "@/lib/types"

interface ServerPageProps {
  params: {
    serverId: string
  }
}

export default function ServerPage({ params }: ServerPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [config, setConfig] = useState<ServerConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [channels, setChannels] = useState<DiscordChannel[]>([])
  const [roles, setRoles] = useState<DiscordRole[]>([])
  const [isBotAdded, setIsBotAdded] = useState(false)
  const [activeTab, setActiveTab] = useState("home")

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }

    fetchServerConfig()
    fetchChannels()
    fetchRoles()
    checkBotStatus()
  }, [session, status, params.serverId])

  const fetchServerConfig = async () => {
    try {
      const response = await fetch(`/api/user-config/${params.serverId}`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch (error) {
      console.error("Error fetching server config:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChannels = async () => {
    try {
      const response = await fetch(`/api/discord/channels/${params.serverId}`)
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels || [])
      }
    } catch (error) {
      console.error("Error fetching channels:", error)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/discord/roles/${params.serverId}`)
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const checkBotStatus = async () => {
    try {
      const response = await fetch(`/api/verify-bot/${params.serverId}`)
      if (response.ok) {
        const data = await response.json()
        setIsBotAdded(data.isBotAdded)
      }
    } catch (error) {
      console.error("Error checking bot status:", error)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch(`/api/settings/${params.serverId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        console.log("Configuration saved successfully")
      }
    } catch (error) {
      console.error("Error saving config:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (path: string, value: any) => {
    if (!config) return

    const keys = path.split(".")
    const newConfig = { ...config }
    let current: any = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setConfig(newConfig)
  }

  const inviteBot = async () => {
    try {
      const response = await fetch("/api/invite-server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId: params.serverId }),
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.inviteUrl, "_blank")
      }
    } catch (error) {
      console.error("Error inviting bot:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Server not found</h1>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {config.server_icon && (
            <img
              src={`https://cdn.discordapp.com/icons/${config.server_id}/${config.server_icon}.png`}
              alt={config.server_name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{config.server_name}</h1>
            <p className="text-gray-600">Server Configuration</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={isBotAdded ? "default" : "destructive"}>{isBotAdded ? "Bot Added" : "Bot Not Added"}</Badge>
          {!isBotAdded && (
            <Button onClick={inviteBot}>
              <Bot className="w-4 h-4 mr-2" />
              Invite Bot
            </Button>
          )}
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Bot Status Alert */}
      {!isBotAdded && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The Dash bot is not added to this server. Please invite the bot to enable all features.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="home" className="flex items-center space-x-2">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </TabsTrigger>
          <TabsTrigger value="sentinel" className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Sentinel</span>
          </TabsTrigger>
          <TabsTrigger value="helpdesk" className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4" />
            <span>Helpdesk</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Link2 className="w-4 h-4" />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="plugins" className="flex items-center space-x-2">
            <Puzzle className="w-4 h-4" />
            <span>Plugins</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Cog className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Home Tab */}
        <TabsContent value="home" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Server Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Server Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{config.server_stats.total_members}</div>
                    <div className="text-sm text-gray-600">Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{config.server_stats.total_admins}</div>
                    <div className="text-sm text-gray-600">Admins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{config.server_stats.total_bots}</div>
                    <div className="text-sm text-gray-600">Bots</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setActiveTab("sentinel")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Configure Moderation
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setActiveTab("events")}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Setup Giveaways
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setActiveTab("helpdesk")}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enable Support System
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Welcome System */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome System</CardTitle>
              <CardDescription>Configure how new members are welcomed to your server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="welcome-enabled">Enable Welcome Messages</Label>
                <Switch
                  id="welcome-enabled"
                  checked={config.welcome.enabled}
                  onCheckedChange={(checked) => updateConfig("welcome.enabled", checked)}
                />
              </div>

              {config.welcome.enabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Welcome Channel</Label>
                      <Select
                        value={config.welcome.channel_id}
                        onValueChange={(value) => updateConfig("welcome.channel_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              #{channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dm-enabled"
                        checked={config.welcome.dm_enabled}
                        onCheckedChange={(checked) => updateConfig("welcome.dm_enabled", checked)}
                      />
                      <Label htmlFor="dm-enabled">Send DM to new members</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={config.welcome.message}
                      onChange={(e) => updateConfig("welcome.message", e.target.value)}
                      placeholder="Welcome {user} to {server}! Please read the rules and enjoy your stay."
                      rows={3}
                    />
                    <p className="text-sm text-gray-600">
                      Use {"{user}"} for the member mention and {"{server}"} for the server name.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentinel Tab (Moderation) */}
        <TabsContent value="sentinel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Moderation Level</span>
              </CardTitle>
              <CardDescription>Choose your server's overall security level</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={config.moderation_level}
                onValueChange={(value) => updateConfig("moderation_level", value)}
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="off" id="off" />
                  <div className="space-y-1">
                    <Label htmlFor="off" className="font-medium">
                      Off
                    </Label>
                    <p className="text-sm text-gray-600">Minimal protection</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="on" id="on" />
                  <div className="space-y-1">
                    <Label htmlFor="on" className="font-medium">
                      Standard
                    </Label>
                    <p className="text-sm text-gray-600">Balanced protection</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="lockdown" id="lockdown" />
                  <div className="space-y-1">
                    <Label htmlFor="lockdown" className="font-medium">
                      Lockdown
                    </Label>
                    <p className="text-sm text-gray-600">Maximum security</p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Basic Protection */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Link Filter */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Link Filter</Label>
                    <p className="text-sm text-gray-600">Block malicious links and spam</p>
                  </div>
                  <Switch
                    checked={config.moderation.link_filter.enabled}
                    onCheckedChange={(checked) => updateConfig("moderation.link_filter.enabled", checked)}
                  />
                </div>
                {config.moderation.link_filter.enabled && (
                  <div className="pl-4 space-y-2">
                    <Label>Filter Mode</Label>
                    <Select
                      value={config.moderation.link_filter.config}
                      onValueChange={(value) => updateConfig("moderation.link_filter.config", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phishing_only">Phishing Only</SelectItem>
                        <SelectItem value="whitelist_only">Whitelist Only</SelectItem>
                        <SelectItem value="all_links">All Links</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Bad Word Filter */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Bad Word Filter</Label>
                    <p className="text-sm text-gray-600">Filter inappropriate language</p>
                  </div>
                  <Switch
                    checked={config.moderation.bad_word_filter.enabled}
                    onCheckedChange={(checked) => updateConfig("moderation.bad_word_filter.enabled", checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Raid Protection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Raid Protection</Label>
                    <p className="text-sm text-gray-600">Protect against mass join attacks</p>
                  </div>
                  <Switch
                    checked={config.moderation.raid_protection.enabled}
                    onCheckedChange={(checked) => updateConfig("moderation.raid_protection.enabled", checked)}
                  />
                </div>
                {config.moderation.raid_protection.enabled && (
                  <div className="pl-4">
                    <Label>Join Threshold (per minute)</Label>
                    <Input
                      type="number"
                      value={config.moderation.raid_protection.threshold}
                      onChange={(e) =>
                        updateConfig("moderation.raid_protection.threshold", Number.parseInt(e.target.value))
                      }
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Security */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Permission Abuse */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Permission Abuse Detection</Label>
                    <p className="text-sm text-gray-600">Monitor suspicious permission changes</p>
                  </div>
                  <Switch
                    checked={config.moderation.permission_abuse.enabled}
                    onCheckedChange={(checked) => updateConfig("moderation.permission_abuse.enabled", checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Malicious Bot Detection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Malicious Bot Detection</Label>
                    <p className="text-sm text-gray-600">Detect and prevent malicious bots</p>
                  </div>
                  <Switch
                    checked={config.moderation.malicious_bot_detection.enabled}
                    onCheckedChange={(checked) => updateConfig("moderation.malicious_bot_detection.enabled", checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Token/Webhook Abuse */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Token/Webhook Abuse Protection</Label>
                    <p className="text-sm text-gray-600">Prevent token and webhook abuse</p>
                  </div>
                  <Switch
                    checked={config.moderation.token_webhook_abuse.enabled}
                    onCheckedChange={(checked) => updateConfig("moderation.token_webhook_abuse.enabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Helpdesk Tab (Support) */}
        <TabsContent value="helpdesk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Ticket System</span>
              </CardTitle>
              <CardDescription>Help your members with a professional ticket system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ticket-enabled">Enable Ticket System</Label>
                <Switch
                  id="ticket-enabled"
                  checked={config.support.ticket_system.enabled}
                  onCheckedChange={(checked) => updateConfig("support.ticket_system.enabled", checked)}
                />
              </div>

              {config.support.ticket_system.enabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Ticket Channel</Label>
                      <Select
                        value={config.support.ticket_system.channel_id}
                        onValueChange={(value) => updateConfig("support.ticket_system.channel_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              #{channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority Role</Label>
                      <Select
                        value={config.support.ticket_system.priority_role_id}
                        onValueChange={(value) => updateConfig("support.ticket_system.priority_role_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              @{role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto Answer</CardTitle>
              <CardDescription>Automatically respond to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-answer-enabled">Enable Auto Answer</Label>
                <Switch
                  id="auto-answer-enabled"
                  checked={config.support.auto_answer.enabled}
                  onCheckedChange={(checked) => updateConfig("support.auto_answer.enabled", checked)}
                />
              </div>

              {config.support.auto_answer.enabled && (
                <div className="space-y-2">
                  <Label>Q&A Pairs (JSON format)</Label>
                  <Textarea
                    value={config.support.auto_answer.qa_pairs}
                    onChange={(e) => updateConfig("support.auto_answer.qa_pairs", e.target.value)}
                    placeholder='{"How do I join?": "Click the invite link!", "What are the rules?": "Check #rules channel"}'
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab (Giveaway) */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="w-5 h-5" />
                <span>Giveaway System</span>
              </CardTitle>
              <CardDescription>Engage your community with exciting giveaways</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="giveaway-enabled">Enable Giveaways</Label>
                <Switch
                  id="giveaway-enabled"
                  checked={config.giveaway.enabled}
                  onCheckedChange={(checked) => updateConfig("giveaway.enabled", checked)}
                />
              </div>

              {config.giveaway.enabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Default Giveaway Channel</Label>
                    <Select
                      value={config.giveaway.default_channel_id}
                      onValueChange={(value) => updateConfig("giveaway.default_channel_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full">
                    <Gift className="w-4 h-4 mr-2" />
                    Create New Giveaway
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link2 className="w-5 h-5" />
                <span>External Integrations</span>
              </CardTitle>
              <CardDescription>Connect your server with external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Webhook Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">Send server events to external webhooks</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Configure Webhooks
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">API Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">Manage your server programmatically</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Generate API Key
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plugins Tab */}
        <TabsContent value="plugins">
          <PluginsTab serverId={params.serverId} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>Configure general server settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Server Timezone</Label>
                  <Select defaultValue="UTC">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label className="font-medium">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="font-medium">Auto-Save Configuration</Label>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm text-gray-600">Automatically save changes</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your server configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <Label className="font-medium text-red-600">Reset Configuration</Label>
                  <p className="text-sm text-gray-600">Reset all settings to default values</p>
                </div>
                <Button variant="destructive" size="sm">
                  Reset All
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <Label className="font-medium text-red-600">Remove Server</Label>
                  <p className="text-sm text-gray-600">Remove this server from your dashboard</p>
                </div>
                <Button variant="destructive" size="sm">
                  Remove Server
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
