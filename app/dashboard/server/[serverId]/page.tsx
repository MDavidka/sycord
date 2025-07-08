"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Shield,
  MessageSquare,
  Gift,
  LinkIcon,
  Filter,
  Hash,
  ChevronDown,
  Home,
  Link2Icon as LinkIcon2,
  ArrowRight,
  Plus,
  Copy,
  Check,
  LogIn,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Info,
  Eye,
  Bot,
  Webhook,
  MessageCircle,
  FileText,
  Zap,
  UserCheck,
  Users,
  Crown,
  Package,
  Settings,
  CheckCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import PluginsTab from "@/components/plugins-tab"

// Define UserData interface
interface UserData {
  name: string
  email: string
  joined_since: string
}

interface BotSettings {
  name: string
  avatar: string
  status: "online" | "idle" | "dnd" | "offline"
  version: string
}

// Update the ServerConfig interface to match the new structure
interface ServerConfig {
  server_id: string
  server_name: string
  server_icon?: string
  is_bot_added: boolean
  moderation_level: "off" | "on" | "lockdown"
  roles_and_names: { [key: string]: string }
  welcome: {
    enabled: boolean
    channel_id?: string
    message?: string
    dm_enabled?: boolean
  }
  moderation: {
    // Basic filters
    link_filter: {
      enabled: boolean
      config: "all_links" | "whitelist_only" | "phishing_only"
      whitelist?: string[]
    }
    bad_word_filter: {
      enabled: boolean
      custom_words?: string[]
    }
    raid_protection: {
      enabled: boolean
      threshold?: number
    }
    suspicious_accounts: {
      enabled: boolean
      min_age_days?: number
    }
    auto_role: {
      enabled: boolean
      role_id?: string
    }

    // Advanced security features
    permission_abuse: {
      enabled: boolean
      notify_owner_on_role_change: boolean
      monitor_admin_actions: boolean
    }
    malicious_bot_detection: {
      enabled: boolean
      new_bot_notifications: boolean
      bot_activity_monitoring: boolean
      bot_timeout_threshold: number
    }
    token_webhook_abuse: {
      enabled: boolean
      webhook_creation_monitor: boolean
      webhook_auto_revoke: boolean
      webhook_verification_timeout: number
      leaked_webhook_scanner: boolean
    }
    invite_hijacking: {
      enabled: boolean
      invite_link_monitor: boolean
      vanity_url_watcher: boolean
    }
    mass_ping_protection: {
      enabled: boolean
      anti_mention_flood: boolean
      mention_rate_limit: number
      message_cooldown_on_raid: boolean
      cooldown_duration: number
    }
    malicious_file_scanner: {
      enabled: boolean
      suspicious_attachment_blocker: boolean
      auto_file_filter: boolean
      allowed_file_types?: string[]
    }
  }
  support: {
    ticket_system: {
      enabled: boolean
      channel_id?: string
      priority_role_id?: string
    }
    auto_answer: {
      enabled: boolean
      qa_pairs?: string
    }
  }
  giveaway: {
    enabled: boolean
    default_channel_id?: string
  }
  logs: {
    enabled: boolean
    channel_id?: string
    message_edits: boolean
    mod_actions: boolean
    member_joins: boolean
    member_leaves: boolean
  }
  last_updated?: string
  channels?: { [key: string]: string }
  server_stats?: {
    total_members?: number
    total_bots?: number
    total_admins?: number
  }
}

export default function ServerConfigPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const serverId = params.serverId as string

  // Add state for info modal
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null)
  const [botSettings, setBotSettings] = useState<BotSettings>({
    name: "Dash",
    avatar: "/bot-icon.png",
    status: "online",
    version: "2.1.0",
  })
  const [userServers, setUserServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("home")

  // Giveaway state
  const [giveawayStep, setGiveawayStep] = useState(1)
  const [giveawayData, setGiveawayData] = useState<any>({
    method: null,
    title: "",
    prize: "",
    description: "",
    endDate: "",
    winners: 1,
    channel: "",
    requireMembership: false,
    requireRole: false,
    requireAccountAge: false,
    selectedRole: "",
    requireLogin: false,
    customUrl: "",
  })
  const [generatedLink, setGeneratedLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [giveawayCreated, setGiveawayCreated] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session && serverId) {
      loadData()
    }
  }, [session, serverId])

  const loadData = async () => {
    try {
      // Load user servers for navbar
      const userServersResponse = await fetch("/api/user-servers")
      if (userServersResponse.ok) {
        const userServersData = await userServersResponse.json()
        setUserServers(userServersData.servers)
      }

      // Load user and server configuration
      const configResponse = await fetch(`/api/user-config/${serverId}`)
      if (configResponse.ok) {
        const configData = await configResponse.json()
        setUserData(configData.user)
        setServerConfig(configData.server)
      }

      // Load bot settings
      const botResponse = await fetch(`/api/bot-settings/${serverId}`)
      if (botResponse.ok) {
        const botData = await botResponse.json()
        setBotSettings(botData.settings || botSettings)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateServerConfig = async (updates: Partial<ServerConfig>) => {
    if (!serverConfig) return

    const newConfig = { ...serverConfig, ...updates }
    setServerConfig(newConfig)

    // Auto-save
    try {
      await fetch(`/api/user-config/${serverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ server: newConfig }),
      })
    } catch (error) {
      console.error("Error auto-saving configuration:", error)
    }
  }

  const updateBotSettings = async (updates: Partial<BotSettings>) => {
    const newSettings = { ...botSettings, ...updates }
    setBotSettings(newSettings)

    try {
      await fetch(`/api/bot-settings/${serverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: newSettings }),
      })
    } catch (error) {
      console.error("Error updating bot settings:", error)
    }
  }

  const getRoleName = (roleId: string) => {
    if (!serverConfig?.roles_and_names[roleId]) return "Unknown Role"
    return serverConfig.roles_and_names[roleId]
  }

  const getChannelName = (channelId: string) => {
    if (!serverConfig?.channels || !serverConfig.channels[channelId]) {
      return "Unknown Channel"
    }
    return serverConfig.channels[channelId]
  }

  // Giveaway functions
  const handleMethodSelect = (method: "server" | "link") => {
    setGiveawayData({ ...giveawayData, method })
    setGiveawayStep(2)
  }

  const handleNextStep = () => {
    if (giveawayStep < 3) {
      setGiveawayStep(giveawayStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (giveawayStep > 1) {
      setGiveawayStep(giveawayStep - 1)
    }
  }

  const handleCreateGiveaway = () => {
    if (giveawayData.method === "link") {
      const baseUrl = "ltpd.xyz"
      const randomId = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")
      const urlPath = giveawayData.customUrl || randomId
      setGeneratedLink(`https://${baseUrl}/g/${urlPath}`)
    }
    setGiveawayCreated(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const resetGiveaway = () => {
    setGiveawayStep(1)
    setGiveawayData({
      method: null,
      title: "",
      prize: "",
      description: "",
      endDate: "",
      winners: 1,
      channel: "",
      requireMembership: false,
      requireRole: false,
      requireAccountAge: false,
      selectedRole: "",
      requireLogin: false,
      customUrl: "",
    })
    setGeneratedLink("")
    setLinkCopied(false)
    setGiveawayCreated(false)
  }

  // Add function to handle moderation level changes
  const handleModerationLevelChange = (level: "off" | "on" | "lockdown") => {
    if (!serverConfig) return

    const updatedModeration = { ...serverConfig.moderation }

    if (level === "off") {
      // Turn everything off
      Object.keys(updatedModeration).forEach((key) => {
        if (typeof updatedModeration[key] === "object" && updatedModeration[key]?.enabled !== undefined) {
          updatedModeration[key].enabled = false
        }
      })
    } else if (level === "on") {
      // Turn on basic security features
      updatedModeration.link_filter.enabled = true
      updatedModeration.bad_word_filter.enabled = true
      updatedModeration.permission_abuse.enabled = true
      updatedModeration.malicious_bot_detection.enabled = true
    } else if (level === "lockdown") {
      // Turn on all security features
      Object.keys(updatedModeration).forEach((key) => {
        if (typeof updatedModeration[key] === "object" && updatedModeration[key]?.enabled !== undefined) {
          updatedModeration[key].enabled = true
        }
      })
    }

    updateServerConfig({
      moderation_level: level,
      moderation: updatedModeration,
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading server configuration...</p>
        </div>
      </div>
    )
  }

  if (!session || !serverConfig) {
    return null
  }

  // Bot not added to server - show waiting state
  if (!serverConfig.is_bot_added) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <Image src="/bot-icon.png" alt="Dash Bot" width={28} height={28} className="rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Dash</h1>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gray-400 rounded"></div>
                      <span className="truncate max-w-32">{serverConfig.server_name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {userServers.map((server) => (
                    <DropdownMenuItem key={server.serverId} asChild>
                      <Link href={`/dashboard/server/${server.serverId}`}>
                        <div className="flex items-center space-x-2 w-full">
                          <div className="w-5 h-5 bg-gray-400 rounded"></div>
                          <span className="truncate">{server.serverName}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="border-gray-200 bg-white max-w-2xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Waiting for Bot</h2>
              <p className="text-gray-600 mb-8 text-base md:text-lg">
                The server configuration has been created, but the Dash bot hasn't joined this server yet. Once the bot
                is added, you'll be able to configure all settings.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-left">
                  <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Dummy configuration has been saved to the database</li>
                    <li>• Add the Dash bot to your Discord server</li>
                    <li>• Bot will automatically update the configuration</li>
                    <li>• All roles and channels will be populated</li>
                    <li>• You can then customize all settings</li>
                  </ul>
                </div>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full md:w-auto bg-transparent"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/bot-icon.png" alt="Dash Bot" width={28} height={28} className="rounded-lg" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dash</h1>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent">
                  <div className="flex items-center space-x-2">
                    {serverConfig.server_icon ? (
                      <Image
                        src={`https://cdn.discordapp.com/icons/${serverId}/${serverConfig.server_icon}.png?size=32`}
                        alt={serverConfig.server_name}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-gray-400 rounded"></div>
                    )}
                    <span className="truncate max-w-32">{serverConfig.server_name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {userServers.map((server) => (
                  <DropdownMenuItem key={server.serverId} asChild>
                    <Link href={`/dashboard/server/${server.serverId}`}>
                      <div className="flex items-center space-x-2 w-full">
                        <div className="w-5 h-5 bg-gray-400 rounded"></div>
                        <span className="truncate">{server.serverName}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <div className="flex items-center space-x-2 w-full">
                      <Plus className="h-4 w-4" />
                      <span>Add Server</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <nav className="flex space-x-1 overflow-x-auto">
            <Button
              variant={activeTab === "home" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("home")}
              className={`${
                activeTab === "home" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant={activeTab === "sentinel" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("sentinel")}
              className={`${
                activeTab === "sentinel" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Sentinel
            </Button>
            <Button
              variant={activeTab === "helpdesk" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("helpdesk")}
              className={`${
                activeTab === "helpdesk" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Helpdesk
            </Button>
            <Button
              variant={activeTab === "events" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("events")}
              className={`${
                activeTab === "events" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Gift className="h-4 w-4 mr-2" />
              Events
            </Button>
            <Button
              variant={activeTab === "integrations" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("integrations")}
              className={`${
                activeTab === "integrations" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Integrations
            </Button>
            <Button
              variant={activeTab === "plugins" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("plugins")}
              className={`${
                activeTab === "plugins" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Package className="h-4 w-4 mr-2" />
              Plugins
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className={`${
                activeTab === "settings" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* Simplified Server Info */}
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Server Icon and Name */}
                  <div className="flex items-center space-x-3">
                    {serverConfig.server_icon ? (
                      <Image
                        src={`https://cdn.discordapp.com/icons/${serverId}/${serverConfig.server_icon}.png?size=64`}
                        alt={serverConfig.server_name}
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                        <Hash className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{serverConfig.server_name}</h3>
                    </div>
                  </div>

                  {/* Server Statistics */}
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{serverConfig.server_stats?.total_members || 0}</div>
                      <div className="text-gray-600">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{serverConfig.server_stats?.total_bots || 0}</div>
                      <div className="text-gray-600">Bots</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{serverConfig.server_stats?.total_admins || 0}</div>
                      <div className="text-gray-600">Admins</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Welcome Flow System */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Welcome System</CardTitle>
                <CardDescription className="text-gray-600">Configure your server's welcome process</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Step 1: User Join Settings */}
                  <div className="relative">
                    <div
                      className={`p-3 rounded-lg border transition-all ${
                        serverConfig.welcome.enabled ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              serverConfig.welcome.enabled ? "bg-green-100" : "bg-gray-100"
                            }`}
                          >
                            <LogIn
                              className={`h-4 w-4 ${serverConfig.welcome.enabled ? "text-green-600" : "text-gray-600"}`}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm">User Join Settings</h3>
                            <p className="text-xs text-gray-600">Enable welcome system</p>
                          </div>
                        </div>
                        <Switch
                          checked={serverConfig.welcome.enabled}
                          onCheckedChange={(checked) =>
                            updateServerConfig({
                              welcome: { ...serverConfig.welcome, enabled: checked },
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Connection Line */}
                    {serverConfig.welcome.enabled && (
                      <div className="flex justify-center">
                        <div className="w-0.5 h-6 bg-green-500"></div>
                      </div>
                    )}
                  </div>

                  {/* Member Verification */}
                  {serverConfig.welcome.enabled && (
                    <div className="relative">
                      <div className="flex justify-center">
                        <button
                          onClick={() =>
                            updateServerConfig({
                              moderation: {
                                ...serverConfig.moderation,
                                suspicious_accounts: {
                                  ...serverConfig.moderation.suspicious_accounts,
                                  enabled: !serverConfig.moderation.suspicious_accounts.enabled,
                                },
                              },
                            })
                          }
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            serverConfig.moderation.suspicious_accounts.enabled
                              ? "bg-green-100 border border-green-300"
                              : "bg-gray-100 border border-gray-300"
                          }`}
                        >
                          <Shield
                            className={`h-4 w-4 ${
                              serverConfig.moderation.suspicious_accounts.enabled ? "text-green-600" : "text-gray-600"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 3-Way Route */}
                      {serverConfig.moderation.suspicious_accounts.enabled && (
                        <>
                          <div className="flex justify-center mt-2">
                            <div className="w-0.5 h-4 bg-green-500"></div>
                          </div>
                          <div className="flex justify-center">
                            <div className="w-48 h-0.5 bg-green-500"></div>
                          </div>
                          <div
                            className="flex justify-between items-start relative"
                            style={{ marginLeft: "calc(50% - 96px)", marginRight: "calc(50% - 96px)" }}
                          >
                            <div className="w-0.5 h-4 bg-green-500"></div>
                            <div className="w-0.5 h-4 bg-green-500"></div>
                            <div className="w-0.5 h-4 bg-green-500"></div>
                          </div>
                        </>
                      )}

                      {/* 3-Way Options */}
                      {serverConfig.moderation.suspicious_accounts.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                          {/* Suspicious Account Scanner */}
                          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                            <div className="flex items-center space-x-2 mb-2">
                              <UserCheck className="h-4 w-4 text-gray-600" />
                              <h4 className="font-medium text-gray-900 text-sm">Suspicious Scanner</h4>
                            </div>
                            <div>
                              <Label className="text-gray-900 text-xs mb-1 block">Min age (days)</Label>
                              <Input
                                type="number"
                                min="1"
                                max="365"
                                value={serverConfig.moderation.suspicious_accounts.min_age_days || 30}
                                onChange={(e) =>
                                  updateServerConfig({
                                    moderation: {
                                      ...serverConfig.moderation,
                                      suspicious_accounts: {
                                        ...serverConfig.moderation.suspicious_accounts,
                                        min_age_days: Number.parseInt(e.target.value) || 30,
                                      },
                                    },
                                  })
                                }
                                className="border-gray-300 h-7 text-xs"
                              />
                            </div>
                          </div>

                          {/* Bot Scanner */}
                          <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Bot className="h-4 w-4 text-green-600" />
                                <h4 className="font-medium text-gray-900 text-sm">Bot Scanner</h4>
                              </div>
                              <Switch
                                checked={serverConfig.moderation.malicious_bot_detection.enabled}
                                onCheckedChange={(checked) =>
                                  updateServerConfig({
                                    moderation: {
                                      ...serverConfig.moderation,
                                      malicious_bot_detection: {
                                        ...serverConfig.moderation.malicious_bot_detection,
                                        enabled: checked,
                                      },
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>

                          {/* Alt Detector */}
                          <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Eye className="h-4 w-4 text-green-600" />
                                <h4 className="font-medium text-gray-900 text-sm">Alt Detector</h4>
                              </div>
                              <Switch
                                checked={serverConfig.moderation.raid_protection.enabled}
                                onCheckedChange={(checked) =>
                                  updateServerConfig({
                                    moderation: {
                                      ...serverConfig.moderation,
                                      raid_protection: {
                                        ...serverConfig.moderation.raid_protection,
                                        enabled: checked,
                                      },
                                    },
                                  })
                                }
                              />
                            </div>
                            {serverConfig.moderation.raid_protection.enabled && (
                              <div>
                                <Label className="text-gray-900 text-xs mb-1 block">Threshold</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={serverConfig.moderation.raid_protection.threshold || 10}
                                  onChange={(e) =>
                                    updateServerConfig({
                                      moderation: {
                                        ...serverConfig.moderation,
                                        raid_protection: {
                                          ...serverConfig.moderation.raid_protection,
                                          threshold: Number.parseInt(e.target.value) || 10,
                                        },
                                      },
                                    })
                                  }
                                  className="border-gray-300 h-7 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Connection Line to Welcome Message */}
                      <div className="flex justify-center mt-4">
                        <div className="w-0.5 h-6 bg-green-500"></div>
                      </div>
                    </div>
                  )}

                  {/* Welcome Message */}
                  {serverConfig.welcome.enabled && (
                    <div className="relative">
                      <div
                        className={`p-3 rounded-lg border transition-all ${
                          serverConfig.welcome.message ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                serverConfig.welcome.message ? "bg-green-100" : "bg-gray-100"
                              }`}
                            >
                              <MessageSquare
                                className={`h-4 w-4 ${
                                  serverConfig.welcome.message ? "text-green-600" : "text-gray-600"
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 text-sm">Welcome Message</h3>
                              <p className="text-xs text-gray-600">Send message to new members</p>
                            </div>
                          </div>
                          <Switch
                            checked={!!serverConfig.welcome.message}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                welcome: {
                                  ...serverConfig.welcome,
                                  message: checked ? "Welcome {user} to {server}!" : "",
                                },
                              })
                            }
                          />
                        </div>

                        {serverConfig.welcome.message && (
                          <div className="space-y-3">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-300 h-7 text-xs bg-transparent"
                              >
                                Simple Text
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-300 h-7 text-xs bg-transparent"
                              >
                                Embedded
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Welcome {user} to {server}!"
                              value={serverConfig.welcome.message || ""}
                              onChange={(e) =>
                                updateServerConfig({
                                  welcome: { ...serverConfig.welcome, message: e.target.value },
                                })
                              }
                              className="border-gray-300 min-h-[80px] text-sm"
                            />
                            <p className="text-xs text-gray-500">
                              Use {"{user}"} for username and {"{server}"} for server name
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Connection Line to Role Assignment */}
                      <div className="flex justify-center mt-4">
                        <div className="w-0.5 h-6 bg-green-500"></div>
                      </div>
                    </div>
                  )}

                  {/* Role Assignment */}
                  {serverConfig.welcome.enabled && (
                    <div className="relative">
                      <div
                        className={`p-3 rounded-lg border transition-all ${
                          serverConfig.moderation.auto_role.enabled
                            ? "border-green-300 bg-green-50"
                            : "border-gray-300 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                serverConfig.moderation.auto_role.enabled ? "bg-green-100" : "bg-gray-100"
                              }`}
                            >
                              <Crown
                                className={`h-4 w-4 ${
                                  serverConfig.moderation.auto_role.enabled ? "text-green-600" : "text-gray-600"
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 text-sm">Role Assignment</h3>
                              <p className="text-xs text-gray-600">Auto-assign roles to new members</p>
                            </div>
                          </div>
                          <Switch
                            checked={serverConfig.moderation.auto_role.enabled}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  auto_role: { ...serverConfig.moderation.auto_role, enabled: checked },
                                },
                              })
                            }
                          />
                        </div>

                        {serverConfig.moderation.auto_role.enabled && (
                          <div>
                            <Label className="text-gray-900 text-sm mb-2 block">Default Role</Label>
                            <Select
                              value={serverConfig.moderation.auto_role.role_id || ""}
                              onValueChange={(value) =>
                                updateServerConfig({
                                  moderation: {
                                    ...serverConfig.moderation,
                                    auto_role: { ...serverConfig.moderation.auto_role, role_id: value },
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="border-gray-300 h-8">
                                <SelectValue placeholder="Select a role">
                                  {serverConfig.moderation.auto_role.role_id && (
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full mr-2 bg-green-500" />
                                      {getRoleName(serverConfig.moderation.auto_role.role_id)}
                                    </div>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(serverConfig.roles_and_names).map(([id, name]) => (
                                  <SelectItem key={id} value={id}>
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full mr-2 bg-green-500" />
                                      {name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sentinel Tab */}
        {activeTab === "sentinel" && (
          <div className="space-y-6">
            {/* Moderation Level Selector */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <CardTitle className="text-gray-900 flex items-center text-xl">
                      <Shield className="h-6 w-6 mr-3" />
                      Moderation Level
                    </CardTitle>
                    <CardDescription className="text-gray-600">Choose your server's security level</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInfoModal(true)}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    How we trained our bot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={serverConfig.moderation_level === "off" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModerationLevelChange("off")}
                    className={`${
                      serverConfig.moderation_level === "off"
                        ? "bg-gray-900 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Off
                  </Button>

                  <Button
                    variant={serverConfig.moderation_level === "on" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModerationLevelChange("on")}
                    className={`${
                      serverConfig.moderation_level === "on"
                        ? "bg-gray-900 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    On
                  </Button>

                  <Button
                    variant={serverConfig.moderation_level === "lockdown" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModerationLevelChange("lockdown")}
                    className={`${
                      serverConfig.moderation_level === "lockdown"
                        ? "bg-gray-900 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Lockdown
                  </Button>
                </div>

                {serverConfig.moderation_level === "lockdown" && (
                  <Alert className="mt-4 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Lockdown mode enables all security features. Your server will have maximum protection but some
                      legitimate activities may be restricted.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bad Word Filter */}
              <Card className="border-gray-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 flex items-center text-base">
                    <Filter className="h-4 w-4 mr-2" />
                    Bad Word Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 text-sm">Enable Filter</span>
                    <Switch
                      checked={serverConfig.moderation.bad_word_filter.enabled}
                      onCheckedChange={(checked) =>
                        updateServerConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            bad_word_filter: { ...serverConfig.moderation.bad_word_filter, enabled: checked },
                          },
                        })
                      }
                    />
                  </div>
                  {serverConfig.moderation.bad_word_filter.enabled && (
                    <div>
                      <Label className="text-gray-900 text-xs mb-1 block">Custom Words</Label>
                      <Textarea
                        placeholder="word1, word2, word3"
                        value={serverConfig.moderation.bad_word_filter.custom_words?.join(", ") || ""}
                        onChange={(e) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              bad_word_filter: {
                                ...serverConfig.moderation.bad_word_filter,
                                custom_words: e.target.value.split(",").map((w) => w.trim()),
                              },
                            },
                          })
                        }
                        className="border-gray-300 min-h-[60px] text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Link Filter */}
              <Card className="border-gray-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 flex items-center text-base">
                    <LinkIcon2 className="h-4 w-4 mr-2" />
                    Link Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 text-sm">Enable Filter</span>
                    <Switch
                      checked={serverConfig.moderation.link_filter.enabled}
                      onCheckedChange={(checked) =>
                        updateServerConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            link_filter: { ...serverConfig.moderation.link_filter, enabled: checked },
                          },
                        })
                      }
                    />
                  </div>
                  {serverConfig.moderation.link_filter.enabled && (
                    <div>
                      <Label className="text-gray-900 text-xs mb-1 block">Filter Type</Label>
                      <Select
                        value={serverConfig.moderation.link_filter.config}
                        onValueChange={(value: "all_links" | "whitelist_only" | "phishing_only") =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              link_filter: { ...serverConfig.moderation.link_filter, config: value },
                            },
                          })
                        }
                      >
                        <SelectTrigger className="border-gray-300 h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_links">All Links</SelectItem>
                          <SelectItem value="whitelist_only">Whitelist Only</SelectItem>
                          <SelectItem value="phishing_only">Phishing Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raid Protection */}
              <Card className="border-gray-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 flex items-center text-base">
                    <Shield className="h-4 w-4 mr-2" />
                    Raid Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 text-sm">Enable Protection</span>
                    <Switch
                      checked={serverConfig.moderation.raid_protection.enabled}
                      onCheckedChange={(checked) =>
                        updateServerConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            raid_protection: { ...serverConfig.moderation.raid_protection, enabled: checked },
                          },
                        })
                      }
                    />
                  </div>
                  {serverConfig.moderation.raid_protection.enabled && (
                    <div>
                      <Label className="text-gray-900 text-xs mb-1 block">Join Threshold</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={serverConfig.moderation.raid_protection.threshold || 10}
                        onChange={(e) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              raid_protection: {
                                ...serverConfig.moderation.raid_protection,
                                threshold: Number.parseInt(e.target.value) || 10,
                              },
                            },
                          })
                        }
                        className="border-gray-300 h-7 text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Advanced Security Features */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Advanced Security</CardTitle>
                <CardDescription className="text-gray-600">
                  Advanced protection against sophisticated attacks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Permission Abuse */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Permission Abuse</h3>
                        <p className="text-xs text-gray-600">Monitor role and permission changes</p>
                      </div>
                      <Switch
                        checked={serverConfig.moderation.permission_abuse.enabled}
                        onCheckedChange={(checked) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              permission_abuse: { ...serverConfig.moderation.permission_abuse, enabled: checked },
                            },
                          })
                        }
                      />
                    </div>
                    {serverConfig.moderation.permission_abuse.enabled && (
                      <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Notify on role changes</span>
                          <Switch
                            checked={serverConfig.moderation.permission_abuse.notify_owner_on_role_change}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  permission_abuse: {
                                    ...serverConfig.moderation.permission_abuse,
                                    notify_owner_on_role_change: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Monitor admin actions</span>
                          <Switch
                            checked={serverConfig.moderation.permission_abuse.monitor_admin_actions}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  permission_abuse: {
                                    ...serverConfig.moderation.permission_abuse,
                                    monitor_admin_actions: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Malicious Bot Detection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Malicious Bot Detection</h3>
                        <p className="text-xs text-gray-600">Detect and block harmful bots</p>
                      </div>
                      <Switch
                        checked={serverConfig.moderation.malicious_bot_detection.enabled}
                        onCheckedChange={(checked) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              malicious_bot_detection: {
                                ...serverConfig.moderation.malicious_bot_detection,
                                enabled: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    {serverConfig.moderation.malicious_bot_detection.enabled && (
                      <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">New bot notifications</span>
                          <Switch
                            checked={serverConfig.moderation.malicious_bot_detection.new_bot_notifications}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  malicious_bot_detection: {
                                    ...serverConfig.moderation.malicious_bot_detection,
                                    new_bot_notifications: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Activity monitoring</span>
                          <Switch
                            checked={serverConfig.moderation.malicious_bot_detection.bot_activity_monitoring}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  malicious_bot_detection: {
                                    ...serverConfig.moderation.malicious_bot_detection,
                                    bot_activity_monitoring: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Token/Webhook Abuse */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Token/Webhook Abuse</h3>
                        <p className="text-xs text-gray-600">Protect against token and webhook abuse</p>
                      </div>
                      <Switch
                        checked={serverConfig.moderation.token_webhook_abuse.enabled}
                        onCheckedChange={(checked) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              token_webhook_abuse: { ...serverConfig.moderation.token_webhook_abuse, enabled: checked },
                            },
                          })
                        }
                      />
                    </div>
                    {serverConfig.moderation.token_webhook_abuse.enabled && (
                      <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Monitor webhook creation</span>
                          <Switch
                            checked={serverConfig.moderation.token_webhook_abuse.webhook_creation_monitor}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  token_webhook_abuse: {
                                    ...serverConfig.moderation.token_webhook_abuse,
                                    webhook_creation_monitor: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Auto-revoke webhooks</span>
                          <Switch
                            checked={serverConfig.moderation.token_webhook_abuse.webhook_auto_revoke}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  token_webhook_abuse: {
                                    ...serverConfig.moderation.token_webhook_abuse,
                                    webhook_auto_revoke: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Leaked webhook scanner</span>
                          <Switch
                            checked={serverConfig.moderation.token_webhook_abuse.leaked_webhook_scanner}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  token_webhook_abuse: {
                                    ...serverConfig.moderation.token_webhook_abuse,
                                    leaked_webhook_scanner: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mass Ping Protection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Mass Ping Protection</h3>
                        <p className="text-xs text-gray-600">Prevent mention spam and raids</p>
                      </div>
                      <Switch
                        checked={serverConfig.moderation.mass_ping_protection.enabled}
                        onCheckedChange={(checked) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              mass_ping_protection: {
                                ...serverConfig.moderation.mass_ping_protection,
                                enabled: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    {serverConfig.moderation.mass_ping_protection.enabled && (
                      <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Anti-mention flood</span>
                          <Switch
                            checked={serverConfig.moderation.mass_ping_protection.anti_mention_flood}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  mass_ping_protection: {
                                    ...serverConfig.moderation.mass_ping_protection,
                                    anti_mention_flood: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-700 mb-1 block">Mention rate limit</Label>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={serverConfig.moderation.mass_ping_protection.mention_rate_limit || 5}
                            onChange={(e) =>
                              updateServerConfig({
                                moderation: {
                                  ...serverConfig.moderation,
                                  mass_ping_protection: {
                                    ...serverConfig.moderation.mass_ping_protection,
                                    mention_rate_limit: Number.parseInt(e.target.value) || 5,
                                  },
                                },
                              })
                            }
                            className="border-gray-300 h-6 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Helpdesk Tab */}
        {activeTab === "helpdesk" && (
          <div className="space-y-6">
            {/* Ticket System */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <MessageSquare className="h-6 w-6 mr-3" />
                  Ticket System
                </CardTitle>
                <CardDescription className="text-gray-600">Manage support tickets and user inquiries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Enable Ticket System</h3>
                    <p className="text-sm text-gray-600">Allow users to create support tickets</p>
                  </div>
                  <Switch
                    checked={serverConfig.support.ticket_system.enabled}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        support: {
                          ...serverConfig.support,
                          ticket_system: { ...serverConfig.support.ticket_system, enabled: checked },
                        },
                      })
                    }
                  />
                </div>

                {serverConfig.support.ticket_system.enabled && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <Label className="text-gray-900 mb-2 block">Ticket Channel</Label>
                      <Select
                        value={serverConfig.support.ticket_system.channel_id || ""}
                        onValueChange={(value) =>
                          updateServerConfig({
                            support: {
                              ...serverConfig.support,
                              ticket_system: { ...serverConfig.support.ticket_system, channel_id: value },
                            },
                          })
                        }
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="Select a channel">
                            {serverConfig.support.ticket_system.channel_id && (
                              <div className="flex items-center">
                                <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                {getChannelName(serverConfig.support.ticket_system.channel_id)}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {serverConfig.channels &&
                            Object.entries(serverConfig.channels).map(([id, name]) => (
                              <SelectItem key={id} value={id}>
                                <div className="flex items-center">
                                  <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                  {name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-900 mb-2 block">Priority Role</Label>
                      <Select
                        value={serverConfig.support.ticket_system.priority_role_id || ""}
                        onValueChange={(value) =>
                          updateServerConfig({
                            support: {
                              ...serverConfig.support,
                              ticket_system: { ...serverConfig.support.ticket_system, priority_role_id: value },
                            },
                          })
                        }
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="Select a role">
                            {serverConfig.support.ticket_system.priority_role_id && (
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
                                {getRoleName(serverConfig.support.ticket_system.priority_role_id)}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(serverConfig.roles_and_names).map(([id, name]) => (
                            <SelectItem key={id} value={id}>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
                                {name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto Answer */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <MessageCircle className="h-6 w-6 mr-3" />
                  Auto Answer
                </CardTitle>
                <CardDescription className="text-gray-600">Automatically respond to common questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Enable Auto Answer</h3>
                    <p className="text-sm text-gray-600">Bot will automatically respond to FAQ</p>
                  </div>
                  <Switch
                    checked={serverConfig.support.auto_answer.enabled}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        support: {
                          ...serverConfig.support,
                          auto_answer: { ...serverConfig.support.auto_answer, enabled: checked },
                        },
                      })
                    }
                  />
                </div>

                {serverConfig.support.auto_answer.enabled && (
                  <div className="pt-4 border-t border-gray-200">
                    <Label className="text-gray-900 mb-2 block">Q&A Pairs</Label>
                    <Textarea
                      placeholder="Q: How do I join the server?&#10;A: Click the invite link!&#10;&#10;Q: What are the rules?&#10;A: Please check #rules channel."
                      value={serverConfig.support.auto_answer.qa_pairs || ""}
                      onChange={(e) =>
                        updateServerConfig({
                          support: {
                            ...serverConfig.support,
                            auto_answer: { ...serverConfig.support.auto_answer, qa_pairs: e.target.value },
                          },
                        })
                      }
                      className="border-gray-300 min-h-[120px]"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Format: Q: Question? A: Answer. Separate multiple Q&A pairs with blank lines.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {/* Giveaway System */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <Gift className="h-6 w-6 mr-3" />
                  Giveaway System
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Create and manage giveaways for your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-medium text-gray-900">Enable Giveaways</h3>
                    <p className="text-sm text-gray-600">Allow giveaway creation and management</p>
                  </div>
                  <Switch
                    checked={serverConfig.giveaway.enabled}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        giveaway: { ...serverConfig.giveaway, enabled: checked },
                      })
                    }
                  />
                </div>

                {serverConfig.giveaway.enabled && (
                  <div className="space-y-6">
                    {/* Default Channel Setting */}
                    <div>
                      <Label className="text-gray-900 mb-2 block">Default Giveaway Channel</Label>
                      <Select
                        value={serverConfig.giveaway.default_channel_id || ""}
                        onValueChange={(value) =>
                          updateServerConfig({
                            giveaway: { ...serverConfig.giveaway, default_channel_id: value },
                          })
                        }
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="Select a channel">
                            {serverConfig.giveaway.default_channel_id && (
                              <div className="flex items-center">
                                <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                {getChannelName(serverConfig.giveaway.default_channel_id)}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {serverConfig.channels &&
                            Object.entries(serverConfig.channels).map(([id, name]) => (
                              <SelectItem key={id} value={id}>
                                <div className="flex items-center">
                                  <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                  {name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Giveaway Creation Wizard */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Giveaway</h3>

                      {!giveawayCreated ? (
                        <>
                          {/* Step 1: Method Selection */}
                          {giveawayStep === 1 && (
                            <div className="space-y-4">
                              <h4 className="font-medium text-gray-900">Choose Giveaway Method</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                  onClick={() => handleMethodSelect("server")}
                                  className="p-4 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="flex items-center space-x-3 mb-2">
                                    <MessageSquare className="h-5 w-5 text-blue-600" />
                                    <h5 className="font-medium text-gray-900">Server Giveaway</h5>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Run giveaway directly in your Discord server with reactions
                                  </p>
                                </button>

                                <button
                                  onClick={() => handleMethodSelect("link")}
                                  className="p-4 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="flex items-center space-x-3 mb-2">
                                    <LinkIcon2 className="h-5 w-5 text-green-600" />
                                    <h5 className="font-medium text-gray-900">Link Giveaway</h5>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Create a shareable link for external giveaway participation
                                  </p>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Basic Information */}
                          {giveawayStep === 2 && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900">Giveaway Details</h4>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                  {giveawayData.method === "server" ? "Server" : "Link"} Giveaway
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-900 mb-1 block">Title</Label>
                                  <Input
                                    placeholder="Amazing Prize Giveaway!"
                                    value={giveawayData.title}
                                    onChange={(e) => setGiveawayData({ ...giveawayData, title: e.target.value })}
                                    className="border-gray-300"
                                  />
                                </div>

                                <div>
                                  <Label className="text-gray-900 mb-1 block">Prize</Label>
                                  <Input
                                    placeholder="$100 Gift Card"
                                    value={giveawayData.prize}
                                    onChange={(e) => setGiveawayData({ ...giveawayData, prize: e.target.value })}
                                    className="border-gray-300"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-gray-900 mb-1 block">Description</Label>
                                <Textarea
                                  placeholder="Enter the giveaway to win an amazing prize!"
                                  value={giveawayData.description}
                                  onChange={(e) => setGiveawayData({ ...giveawayData, description: e.target.value })}
                                  className="border-gray-300"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-900 mb-1 block">End Date</Label>
                                  <Input
                                    type="datetime-local"
                                    value={giveawayData.endDate}
                                    onChange={(e) => setGiveawayData({ ...giveawayData, endDate: e.target.value })}
                                    className="border-gray-300"
                                  />
                                </div>

                                <div>
                                  <Label className="text-gray-900 mb-1 block">Number of Winners</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={giveawayData.winners}
                                    onChange={(e) =>
                                      setGiveawayData({
                                        ...giveawayData,
                                        winners: Number.parseInt(e.target.value) || 1,
                                      })
                                    }
                                    className="border-gray-300"
                                  />
                                </div>
                              </div>

                              {giveawayData.method === "server" && (
                                <div>
                                  <Label className="text-gray-900 mb-1 block">Channel</Label>
                                  <Select
                                    value={giveawayData.channel}
                                    onValueChange={(value) => setGiveawayData({ ...giveawayData, channel: value })}
                                  >
                                    <SelectTrigger className="border-gray-300">
                                      <SelectValue placeholder="Select a channel">
                                        {giveawayData.channel && (
                                          <div className="flex items-center">
                                            <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                            {getChannelName(giveawayData.channel)}
                                          </div>
                                        )}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {serverConfig.channels &&
                                        Object.entries(serverConfig.channels).map(([id, name]) => (
                                          <SelectItem key={id} value={id}>
                                            <div className="flex items-center">
                                              <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                              {name}
                                            </div>
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {giveawayData.method === "link" && (
                                <div>
                                  <Label className="text-gray-900 mb-1 block">Custom URL (Optional)</Label>
                                  <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                      ltpd.xyz/g/
                                    </span>
                                    <Input
                                      placeholder="my-giveaway"
                                      value={giveawayData.customUrl}
                                      onChange={(e) => setGiveawayData({ ...giveawayData, customUrl: e.target.value })}
                                      className="border-gray-300 rounded-l-none"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generated URL</p>
                                </div>
                              )}

                              <div className="flex justify-between pt-4">
                                <Button
                                  variant="outline"
                                  onClick={handlePrevStep}
                                  className="border-gray-300 bg-transparent"
                                >
                                  <ArrowLeft className="h-4 w-4 mr-2" />
                                  Back
                                </Button>
                                <Button onClick={handleNextStep} className="bg-gray-900 text-white hover:bg-gray-800">
                                  Next
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Step 3: Requirements */}
                          {giveawayStep === 3 && (
                            <div className="space-y-4">
                              <h4 className="font-medium text-gray-900 mb-4">Entry Requirements</h4>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900 text-sm">Server Membership Required</h5>
                                    <p className="text-xs text-gray-600">Users must be members of this server</p>
                                  </div>
                                  <Switch
                                    checked={giveawayData.requireMembership}
                                    onCheckedChange={(checked) =>
                                      setGiveawayData({ ...giveawayData, requireMembership: checked })
                                    }
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900 text-sm">Specific Role Required</h5>
                                    <p className="text-xs text-gray-600">Users must have a specific role</p>
                                  </div>
                                  <Switch
                                    checked={giveawayData.requireRole}
                                    onCheckedChange={(checked) =>
                                      setGiveawayData({ ...giveawayData, requireRole: checked })
                                    }
                                  />
                                </div>

                                {giveawayData.requireRole && (
                                  <div className="ml-4">
                                    <Label className="text-gray-900 text-xs mb-1 block">Required Role</Label>
                                    <Select
                                      value={giveawayData.selectedRole}
                                      onValueChange={(value) =>
                                        setGiveawayData({ ...giveawayData, selectedRole: value })
                                      }
                                    >
                                      <SelectTrigger className="border-gray-300 h-8">
                                        <SelectValue placeholder="Select a role">
                                          {giveawayData.selectedRole && (
                                            <div className="flex items-center">
                                              <div className="w-2 h-2 rounded-full mr-2 bg-blue-500" />
                                              {getRoleName(giveawayData.selectedRole)}
                                            </div>
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(serverConfig.roles_and_names).map(([id, name]) => (
                                          <SelectItem key={id} value={id}>
                                            <div className="flex items-center">
                                              <div className="w-2 h-2 rounded-full mr-2 bg-blue-500" />
                                              {name}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900 text-sm">Account Age Requirement</h5>
                                    <p className="text-xs text-gray-600">Minimum Discord account age</p>
                                  </div>
                                  <Switch
                                    checked={giveawayData.requireAccountAge}
                                    onCheckedChange={(checked) =>
                                      setGiveawayData({ ...giveawayData, requireAccountAge: checked })
                                    }
                                  />
                                </div>

                                {giveawayData.method === "link" && (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="font-medium text-gray-900 text-sm">Discord Login Required</h5>
                                      <p className="text-xs text-gray-600">Users must login with Discord</p>
                                    </div>
                                    <Switch
                                      checked={giveawayData.requireLogin}
                                      onCheckedChange={(checked) =>
                                        setGiveawayData({ ...giveawayData, requireLogin: checked })
                                      }
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between pt-4">
                                <Button
                                  variant="outline"
                                  onClick={handlePrevStep}
                                  className="border-gray-300 bg-transparent"
                                >
                                  <ArrowLeft className="h-4 w-4 mr-2" />
                                  Back
                                </Button>
                                <Button
                                  onClick={handleCreateGiveaway}
                                  className="bg-green-600 text-white hover:bg-green-700"
                                >
                                  <Gift className="h-4 w-4 mr-2" />
                                  Create Giveaway
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Giveaway Created Success */
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Giveaway Created!</h4>
                          <p className="text-gray-600">Your giveaway has been successfully created.</p>

                          {giveawayData.method === "link" && generatedLink && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <Label className="text-gray-900 text-sm mb-2 block">Giveaway Link</Label>
                              <div className="flex space-x-2">
                                <Input value={generatedLink} readOnly className="border-gray-300 bg-white" />
                                <Button
                                  onClick={copyLink}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 flex-shrink-0 bg-transparent"
                                >
                                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                              {linkCopied && <p className="text-green-600 text-sm mt-2">Link copied to clipboard!</p>}
                            </div>
                          )}

                          <Button onClick={resetGiveaway} variant="outline" className="border-gray-300 bg-transparent">
                            Create Another Giveaway
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <LinkIcon className="h-6 w-6 mr-3" />
                  Third-Party Integrations
                </CardTitle>
                <CardDescription className="text-gray-600">Connect your server with external services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Webhook Integration */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Webhook className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Webhooks</h3>
                        <p className="text-xs text-gray-600">Custom webhook integrations</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full border-gray-300 bg-transparent">
                      Configure
                    </Button>
                  </div>

                  {/* Logging Integration */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Logging</h3>
                        <p className="text-xs text-gray-600">Advanced server logging</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700">Enable Logs</span>
                      <Switch
                        checked={serverConfig.logs.enabled}
                        onCheckedChange={(checked) =>
                          updateServerConfig({
                            logs: { ...serverConfig.logs, enabled: checked },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* API Integration */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">API Access</h3>
                        <p className="text-xs text-gray-600">REST API integration</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full border-gray-300 bg-transparent">
                      Generate Key
                    </Button>
                  </div>
                </div>

                {/* Logging Configuration */}
                {serverConfig.logs.enabled && (
                  <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-medium text-gray-900 mb-4">Logging Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-900 mb-2 block">Log Channel</Label>
                        <Select
                          value={serverConfig.logs.channel_id || ""}
                          onValueChange={(value) =>
                            updateServerConfig({
                              logs: { ...serverConfig.logs, channel_id: value },
                            })
                          }
                        >
                          <SelectTrigger className="border-gray-300 bg-white">
                            <SelectValue placeholder="Select a channel">
                              {serverConfig.logs.channel_id && (
                                <div className="flex items-center">
                                  <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                  {getChannelName(serverConfig.logs.channel_id)}
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {serverConfig.channels &&
                              Object.entries(serverConfig.channels).map(([id, name]) => (
                                <SelectItem key={id} value={id}>
                                  <div className="flex items-center">
                                    <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                    {name}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Message Edits</span>
                          <Switch
                            checked={serverConfig.logs.message_edits}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                logs: { ...serverConfig.logs, message_edits: checked },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Mod Actions</span>
                          <Switch
                            checked={serverConfig.logs.mod_actions}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                logs: { ...serverConfig.logs, mod_actions: checked },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Member Joins</span>
                          <Switch
                            checked={serverConfig.logs.member_joins}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                logs: { ...serverConfig.logs, member_joins: checked },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Member Leaves</span>
                          <Switch
                            checked={serverConfig.logs.member_leaves}
                            onCheckedChange={(checked) =>
                              updateServerConfig({
                                logs: { ...serverConfig.logs, member_leaves: checked },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plugins Tab */}
        {activeTab === "plugins" && <PluginsTab />}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Bot Settings */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <Bot className="h-6 w-6 mr-3" />
                  Bot Settings
                </CardTitle>
                <CardDescription className="text-gray-600">Configure bot name, profile, and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-900 mb-2 block">Bot Name</Label>
                    <Input
                      value={botSettings.name}
                      onChange={(e) => updateBotSettings({ name: e.target.value })}
                      placeholder="Bot Name"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 mb-2 block">Avatar URL</Label>
                    <Input
                      value={botSettings.avatar}
                      onChange={(e) => updateBotSettings({ avatar: e.target.value })}
                      placeholder="https://example.com/avatar.png"
                      className="border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-900 mb-2 block">Bot Status</Label>
                  <Select
                    value={botSettings.status}
                    onValueChange={(value: "online" | "idle" | "dnd" | "offline") =>
                      updateBotSettings({ status: value })
                    }
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue>
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full mr-2 ${
                              botSettings.status === "online"
                                ? "bg-green-500"
                                : botSettings.status === "idle"
                                  ? "bg-yellow-500"
                                  : botSettings.status === "dnd"
                                    ? "bg-red-500"
                                    : "bg-gray-500"
                            }`}
                          />
                          {botSettings.status.charAt(0).toUpperCase() + botSettings.status.slice(1)}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-green-500" />
                          Online
                        </div>
                      </SelectItem>
                      <SelectItem value="idle">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-yellow-500" />
                          Idle
                        </div>
                      </SelectItem>
                      <SelectItem value="dnd">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-red-500" />
                          Do Not Disturb
                        </div>
                      </SelectItem>
                      <SelectItem value="offline">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
                          Offline
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bot Information */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <Info className="h-6 w-6 mr-3" />
                  Bot Information
                </CardTitle>
                <CardDescription className="text-gray-600">Current bot status and version information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                      <span className="font-medium text-gray-900">Status</span>
                    </div>
                    <p className="text-sm text-gray-600">Online</p>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Package className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">Version</span>
                    </div>
                    <p className="text-sm text-gray-600">{botSettings.version}</p>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">Servers</span>
                    </div>
                    <p className="text-sm text-gray-600">{userServers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
