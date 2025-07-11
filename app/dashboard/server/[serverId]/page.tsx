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
  Send,
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
  Lock,
  EyeOff,
  Megaphone,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PluginsTab from "@/components/plugins-tab"

// Define UserData interface
interface UserData {
  name: string
  email: string
  joined_since: string
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
  // New fields for custom bot
  botProfilePictureUrl?: string
  customBotName?: string
  botToken?: string
}

interface AppSettings {
  maintenanceMode: {
    enabled: boolean
    estimatedTime?: string
  }
}

interface Announcement {
  _id: string
  message: string
  createdAt: string
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
  const [userServers, setUserServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("home") // Changed default active tab to "home"

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

  // Settings tab state
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const [customBotName, setCustomBotName] = useState("")
  const [botToken, setBotToken] = useState("")
  const [showToken, setShowToken] = useState(false)

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [newAnnouncement, setNewAnnouncement] = useState("")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session && serverId) {
      loadData()
      fetchAppSettings()
      fetchAnnouncements()
    }
  }, [session, serverId])

  useEffect(() => {
    if (serverConfig) {
      setProfilePictureUrl(serverConfig.botProfilePictureUrl || "")
      setCustomBotName(serverConfig.customBotName || "")
      setBotToken(serverConfig.botToken || "")
    }
  }, [serverConfig])

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

  const handleSaveBotSettings = async () => {
    await updateServerConfig({
      botProfilePictureUrl,
      customBotName,
      botToken,
    })
  }

  const fetchAppSettings = async () => {
    try {
      const response = await fetch("/api/app-settings")
      if (response.ok) {
        const data = await response.json()
        setAppSettings(data)
      }
    } catch (error) {
      console.error("Error fetching app settings:", error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/announcements")
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements)
      }
    } catch (error) {
      console.error("Error fetching announcements:", error)
    }
  }

  const handleMaintenanceToggle = async (checked: boolean) => {
    try {
      const response = await fetch("/api/app-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maintenanceMode: {
            enabled: checked,
            estimatedTime: checked ? "30 minutes" : "", // Default estimate
          },
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setAppSettings(data)
      }
    } catch (error) {
      console.error("Error updating app settings:", error)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!newAnnouncement.trim()) return

    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: newAnnouncement }),
      })
      if (response.ok) {
        setNewAnnouncement("")
        fetchAnnouncements() // Refresh announcements
      }
    } catch (error) {
      console.error("Error sending announcement:", error)
    }
  }

  const handleDismissAnnouncement = (id: string) => {
    setDismissedAnnouncements((prev) => [...prev, id])
    // In a real app, you might persist this to user settings in DB
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-white">Loading server configuration...</p>
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
      <div className="min-h-screen bg-black text-white">
        <header className="glass-card border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <Image src="/new-blue-logo.png" alt="Sycord Bot" width={28} height={28} className="rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold text-white">
                    <span className="text-white">Sycord</span>
                  </h1>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gray-600 rounded"></div>
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
                          <div className="w-5 h-5 bg-gray-600 rounded"></div>
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
          <Card className="glass-card max-w-2xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Waiting for Bot</h2>
              <p className="text-gray-400 mb-8 text-base md:text-lg">
                The server configuration has been created, but the Sycord bot hasn't joined this server yet. Once the
                bot is added, you'll be able to configure all settings.
              </p>
              <div className="space-y-4">
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 w-full md:w-auto bg-transparent"
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/new-blue-logo.png" alt="Sycord Bot" width={28} height={28} className="rounded-lg" />
              <div>
                <h1 className="text-lg font-bold text-white">
                  <span className="text-white">Sycord</span>
                </h1>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
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
                      <div className="w-5 h-5 bg-gray-600 rounded"></div>
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
                        <div className="w-5 h-5 bg-gray-600 rounded"></div>
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
      <div className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-2">
          <nav className="flex space-x-1 overflow-x-auto">
            <Button
              variant={activeTab === "home" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("home")}
              className={`${
                activeTab === "home" ? "bg-white text-black" : "text-white hover:bg-white/10"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant={activeTab === "sentinel" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("sentinel")}
              className={`${
                activeTab === "sentinel" ? "bg-white text-black" : "text-white hover:bg-white/10"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Sentinel
            </Button>
            <Button
              variant={activeTab === "helpdesk" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("helpdesk")}
              className={`${
                activeTab === "helpdesk" ? "bg-white text-black" : "text-white hover:bg-white/10"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Helpdesk
            </Button>
            <Button
              variant={activeTab === "events" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("events")}
              className={`${
                activeTab === "events" ? "bg-white text-black" : "text-white hover:bg-white/10"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Gift className="h-4 w-4 mr-2" />
              Events
            </Button>
            <Button
              variant={activeTab === "integrations" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("integrations")}
              className={`${
                activeTab === "integrations" ? "bg-white text-black" : "text-white hover:bg-white/10"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <LinkIcon className="h-4 w-4 mr-2" /> {/* Using LinkIcon for Integrations */}
              Integrations
            </Button>
            <Button
              variant={activeTab === "plugins" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("plugins")}
              className={`${
                activeTab === "plugins" ? "bg-white text-black" : "text-white hover:bg-white/10"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Package className="h-4 w-4 mr-2" />
              Plugins
            </Button>
            <Button
              variant={activeTab === "settings" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className={`${
                activeTab === "settings" ? "bg-white text-black" : "text-white hover:bg-white/10"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {session?.user?.email === "dmarton336@gmail.com" && (
              <Button
                variant={activeTab === "access-plus" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("access-plus")}
                className={`${
                  activeTab === "access-plus" ? "bg-white text-black" : "text-white hover:bg-white/10"
                } transition-colors flex-shrink-0 text-sm px-4 h-9`}
              >
                <Lock className="h-4 w-4 mr-2" />
                Access+
              </Button>
            )}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* Simplified Server Info */}
            <Card className="glass-card">
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
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                        <Hash className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-white">{serverConfig.server_name}</h3>
                    </div>
                  </div>

                  {/* Server Statistics */}
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-white">{serverConfig.server_stats?.total_members || 0}</div>
                      <div className="text-gray-400">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{serverConfig.server_stats?.total_bots || 0}</div>
                      <div className="text-gray-400">Bots</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{serverConfig.server_stats?.total_admins || 0}</div>
                      <div className="text-gray-400">Admins</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Announcements - Moved here */}
            {announcements.filter((ann) => !dismissedAnnouncements.includes(ann._id)).length > 0 && (
              <div className="space-y-4">
                {announcements
                  .filter((ann) => !dismissedAnnouncements.includes(ann._id))
                  .map((ann) => (
                    <Alert key={ann._id} className="border-gray-500/30 bg-gray-500/10">
                      <Megaphone className="h-4 w-4" />
                      <AlertDescription className="text-gray-400 flex justify-between items-center">
                        <span>{ann.message}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissAnnouncement(ann._id)}
                          className="text-gray-400 hover:bg-gray-500/20"
                        >
                          Dismiss
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            )}

            {/* Welcome Flow System */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white text-xl">Welcome System</CardTitle>
                <CardDescription className="text-gray-400">Configure your server's welcome process</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Step 1: User Join Settings */}
                  <div className="relative">
                    <div
                      className={`p-3 rounded-lg border transition-all ${
                        serverConfig.welcome.enabled
                          ? "border-gray-500/50 bg-gray-500/5"
                          : "border-gray-500/50 bg-gray-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              serverConfig.welcome.enabled ? "bg-gray-500/20" : "bg-gray-500/20"
                            }`}
                          >
                            <LogIn
                              className={`h-4 w-4 ${serverConfig.welcome.enabled ? "text-gray-400" : "text-gray-400"}`}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-white text-sm">User Join Settings</h3>
                            <p className="text-xs text-gray-400">Enable welcome system</p>
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
                        <div className="w-0.5 h-6 bg-gray-500"></div>
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
                              ? "bg-gray-500/20 border border-gray-500/50"
                              : "bg-gray-500/20 border border-gray-500/50"
                          }`}
                        >
                          <Shield
                            className={`h-4 w-4 ${
                              serverConfig.moderation.suspicious_accounts.enabled ? "text-gray-400" : "text-gray-400"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 3-Way Route */}
                      {serverConfig.moderation.suspicious_accounts.enabled && (
                        <>
                          <div className="flex justify-center mt-2">
                            <div className="w-0.5 h-4 bg-gray-500"></div>
                          </div>
                          <div className="flex justify-center">
                            <div className="w-48 h-0.5 bg-gray-500"></div>
                          </div>
                          <div
                            className="flex justify-between items-start relative"
                            style={{ marginLeft: "calc(50% - 96px)", marginRight: "calc(50% - 96px)" }}
                          >
                            <div className="w-0.5 h-4 bg-gray-500"></div>
                            <div className="w-0.5 h-4 bg-gray-500"></div>
                            <div className="w-0.5 h-4 bg-gray-500"></div>
                          </div>
                        </>
                      )}

                      {/* 3-Way Options */}
                      {serverConfig.moderation.suspicious_accounts.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                          {/* Suspicious Account Scanner */}
                          <div className="p-3 rounded-lg border border-gray-700/30 bg-gray-700/5">
                            <div className="flex items-center space-x-2 mb-2">
                              <UserCheck className="h-4 w-4 text-gray-400" />
                              <h4 className="font-medium text-white text-sm">Suspicious Scanner</h4>
                            </div>
                            <div>
                              <Label className="text-white text-xs mb-1 block">Min age (days)</Label>
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
                                className="bg-black/60 border-white/20 text-white h-7 text-xs"
                              />
                            </div>
                          </div>

                          {/* Bot Scanner */}
                          <div className="p-3 rounded-lg border border-gray-500/30 bg-gray-500/5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Bot className="h-4 w-4 text-gray-400" />
                                <h4 className="font-medium text-white text-sm">Bot Scanner</h4>
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
                          <div className="p-3 rounded-lg border border-gray-600/30 bg-gray-600/5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Eye className="h-4 w-4 text-gray-400" />
                                <h4 className="font-medium text-white text-sm">Alt Detector</h4>
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
                                <Label className="text-white text-xs mb-1 block">Threshold</Label>
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
                                  className="bg-black/60 border-white/20 text-white h-7 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Connection Line to Welcome Message */}
                      <div className="flex justify-center mt-4">
                        <div className="w-0.5 h-6 bg-gray-500"></div>
                      </div>
                    </div>
                  )}

                  {/* Welcome Message */}
                  {serverConfig.welcome.enabled && (
                    <div className="relative">
                      <div
                        className={`p-3 rounded-lg border transition-all ${
                          serverConfig.welcome.message
                            ? "border-gray-500/50 bg-gray-500/5"
                            : "border-gray-500/50 bg-gray-500/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                serverConfig.welcome.message ? "bg-gray-500/20" : "bg-gray-500/20"
                              }`}
                            >
                              <MessageSquare
                                className={`h-4 w-4 ${
                                  serverConfig.welcome.message ? "text-gray-400" : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-white text-sm">Welcome Message</h3>
                              <p className="text-xs text-gray-400">Send message to new members</p>
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
                                className="border-white/20 text-white hover:bg-white/10 h-7 text-xs bg-transparent"
                              >
                                Simple Text
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20 text-white hover:bg-white/10 h-7 text-xs bg-transparent"
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
                              className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px] text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                              Use {"{user}"} for username and {"{server}"} for server name
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Connection Line to Role Assignment */}
                      <div className="flex justify-center mt-4">
                        <div className="w-0.5 h-6 bg-gray-500"></div>
                      </div>
                    </div>
                  )}

                  {/* Role Assignment */}
                  {serverConfig.welcome.enabled && (
                    <div className="relative">
                      <div
                        className={`p-3 rounded-lg border transition-all ${
                          serverConfig.moderation.auto_role.enabled
                            ? "border-gray-500/50 bg-gray-500/5"
                            : "border-gray-500/50 bg-gray-500/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                serverConfig.moderation.auto_role.enabled ? "bg-gray-500/20" : "bg-gray-500/20"
                              }`}
                            >
                              <Crown
                                className={`h-4 w-4 ${
                                  serverConfig.moderation.auto_role.enabled ? "text-gray-400" : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-white text-sm">Role Assignment</h3>
                              <p className="text-xs text-gray-400">Auto-assign roles to new members</p>
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
                            <Label className="text-white text-sm mb-2 block">Default Role</Label>
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
                              <SelectTrigger className="bg-black/60 border-white/20 h-8">
                                <SelectValue placeholder="Select a role">
                                  {serverConfig.moderation.auto_role.role_id && (
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full mr-2 bg-gray-500" />
                                      {getRoleName(serverConfig.moderation.auto_role.role_id)}
                                    </div>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(serverConfig.roles_and_names).map(([id, name]) => (
                                  <SelectItem key={id} value={id}>
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full mr-2 bg-gray-500" />
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
            {/* Moderation Level Selector - Smaller buttons */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <CardTitle className="text-white flex items-center text-xl">
                      <Shield className="h-6 w-6 mr-3" />
                      Moderation Level
                    </CardTitle>
                    <CardDescription className="text-gray-400">Choose your server's security level</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInfoModal(true)}
                    className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10 w-full sm:w-auto"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    How we trained our bot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Smaller buttons side by side */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={serverConfig.moderation_level === "off" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModerationLevelChange("off")}
                    className={`${
                      serverConfig.moderation_level === "off"
                        ? "bg-white text-black"
                        : "border-white/20 text-white hover:bg-white/10"
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
                        ? "bg-white text-black"
                        : "border-white/20 text-white hover:bg-white/10"
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
                        ? "bg-white text-black"
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Lockdown
                  </Button>
                </div>

                {serverConfig.moderation_level === "lockdown" && (
                  <Alert className="mt-4 border-gray-500/30 bg-gray-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-gray-400">
                      Lockdown mode enables all security features. Your server will have maximum protection but some
                      legitimate activities may be restricted.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Basic Filters - Side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bad Word Filter */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center text-base">
                    <Filter className="h-4 w-4 mr-2" />
                    Bad Word Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Enable Filter</span>
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
                      <Label className="text-white text-xs mb-1 block">Custom Words</Label>
                      <Textarea
                        placeholder="word1, word2, word3"
                        value={serverConfig.moderation.bad_word_filter.custom_words?.join(", ") || ""}
                        onChange={(e) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              bad_word_filter: {
                                ...serverConfig.moderation.bad_word_filter,
                                custom_words: e.target.value
                                  .split(",")
                                  .map((w) => w.trim())
                                  .filter((w) => w),
                              },
                            },
                          })
                        }
                        className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[60px] text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Link Filter */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center text-base">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Enable Scanner</span>
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
                      <Label className="text-white text-xs mb-1 block">Scanning Mode</Label>
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
                        <SelectTrigger className="bg-black/60 border-white/20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phishing_only">Block fraud only</SelectItem>
                          <SelectItem value="all_links">Block all links</SelectItem>
                          <SelectItem value="whitelist_only">Whitelist only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Document Filter */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center text-base">
                    <FileText className="h-4 w-4 mr-2" />
                    Document Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Enable Scanner</span>
                    <Switch
                      checked={serverConfig.moderation.malicious_file_scanner.enabled}
                      onCheckedChange={(checked) =>
                        updateServerConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            malicious_file_scanner: {
                              ...serverConfig.moderation.malicious_file_scanner,
                              enabled: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  {serverConfig.moderation.malicious_file_scanner.enabled && (
                    <div>
                      <Label className="text-white text-xs mb-1 block">Allowed Types</Label>
                      <Input
                        placeholder="jpg, png, pdf"
                        value={serverConfig.moderation.malicious_file_scanner.allowed_file_types?.join(", ") || ""}
                        onChange={(e) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              malicious_file_scanner: {
                                ...serverConfig.moderation.malicious_file_scanner,
                                allowed_file_types: e.target.value
                                  .split(",")
                                  .map((t) => t.trim())
                                  .filter((t) => t),
                              },
                            },
                          })
                        }
                        className="bg-black/60 border-white/20 text-white placeholder-gray-400 h-8 text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Separator Line */}
            <div className="border-t border-white/20"></div>

            {/* Community Management */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Community Management
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Mass Ping Protection */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-base">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Mass Ping Protection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Enable Protection</span>
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
                      <div className="space-y-2">
                        <div>
                          <Label className="text-white text-xs mb-1 block">Rate Limit (per minute)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={serverConfig.moderation.mass_ping_protection.mention_rate_limit}
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
                            className="bg-black/60 border-white/20 text-white h-8"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Invite Link Protection */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-base">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Invite Protection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Enable Protection</span>
                      <Switch
                        checked={serverConfig.moderation.invite_hijacking.enabled}
                        onCheckedChange={(checked) =>
                          updateServerConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              invite_hijacking: { ...serverConfig.moderation.invite_hijacking, enabled: checked },
                            },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Admin & Bots */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                Admin & Bots
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Permission Abuse */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-base">
                      <Eye className="h-4 w-4 mr-2" />
                      Permission Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Enable Monitoring</span>
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
                  </CardContent>
                </Card>

                {/* Token/Webhook Abuse */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-base">
                      <Webhook className="h-4 w-4 mr-2" />
                      Webhook Protection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Enable Protection</span>
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
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Fraud Protection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Fraud Protection
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Malicious Bot Detection */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-base">
                      <Bot className="h-4 w-4 mr-2" />
                      Bot Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Enable Detection</span>
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
                  </CardContent>
                </Card>

                {/* Raid Protection */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-base">
                      <Shield className="h-4 w-4 mr-2" />
                      Raid Protection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Enable Protection</span>
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
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Info Modal */}
            {showInfoModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center text-xl">
                        <Zap className="h-6 w-6 mr-3" />
                        How We Trained Our Bot
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowInfoModal(false)}
                        className="text-white hover:bg-white/10"
                      >
                        ×
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-300 space-y-4 leading-relaxed">
                      <p>
                        We started by researching hundreds of real Discord server compromises, studying how attackers
                        exploited roles, bots, and permissions. Logs, case studies, and community reports helped us
                        identify patterns like sudden role escalations, webhook abuse, and bot-based infiltration.
                      </p>
                      <p>
                        We analyzed the timing, methods, and impact of phishing links, mass joins, and admin bypasses.
                        By comparing dozens of attacks, we built a deep understanding of both technical and human
                        vulnerabilities.
                      </p>
                      <p>
                        This research became the foundation for every security function we built into Sycord. Our bot
                        doesn't just follow generic rules - it understands real attack patterns and adapts to protect
                        your server accordingly.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Helpdesk Tab */}
        {activeTab === "helpdesk" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <MessageSquare className="h-6 w-6 mr-3" />
                  Support System
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure ticket system and automated support responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white text-base">Enable Ticket System</h3>
                    <p className="text-sm text-gray-400">Allow users to create support tickets</p>
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white text-sm mb-2 block">Ticket Channel</Label>
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
                          <SelectTrigger className="bg-black/60 border-white/20">
                            <SelectValue placeholder="Select channel">
                              {serverConfig.support.ticket_system.channel_id && (
                                <div className="flex items-center">
                                  <Hash className="h-4 w-4 mr-2" />
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
                                    <Hash className="h-4 w-4 mr-2" />
                                    {name}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white text-sm mb-2 block">Priority Role</Label>
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
                          <SelectTrigger className="bg-black/60 border-white/20">
                            <SelectValue placeholder="Select priority role">
                              {serverConfig.support.ticket_system.priority_role_id && (
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
                                  {getRoleName(serverConfig.support.ticket_system.priority_role_id)}
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(serverConfig.roles_and_names).map(([id, name]) => (
                              <SelectItem key={id} value={id}>
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
                                  {name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white text-sm mb-2 block">Auto-Answer Q&A Pairs</Label>
                      <Textarea
                        placeholder="Q: How do I reset my password?&#10;A: Click on 'Forgot Password' on the login page.&#10;&#10;Q: How do I contact support?&#10;A: Create a ticket using the !ticket command."
                        value={serverConfig.support.auto_answer.qa_pairs || ""}
                        onChange={(e) =>
                          updateServerConfig({
                            support: {
                              ...serverConfig.support,
                              auto_answer: { ...serverConfig.support.auto_answer, qa_pairs: e.target.value },
                            },
                          })
                        }
                        className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[120px]"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Format: Q: Question? A: Answer. Separate multiple Q&A pairs with blank lines.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Gift className="h-6 w-6 mr-3" />
                  Create a Giveaway
                </CardTitle>
                <CardDescription className="text-gray-400">Set up giveaways for your community members</CardDescription>
              </CardHeader>
              <CardContent>
                {!giveawayCreated ? (
                  <>
                    {/* Mobile-optimized Stepper */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                              giveawayStep >= 1 ? "bg-white text-black" : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            1
                          </div>
                          <span className={`text-xs mt-1 ${giveawayStep >= 1 ? "text-white" : "text-gray-400"}`}>
                            Method
                          </span>
                        </div>
                        <div className={`flex-1 h-1 mx-2 ${giveawayStep >= 2 ? "bg-white" : "bg-gray-700"}`}></div>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                              giveawayStep >= 2 ? "bg-white text-black" : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            2
                          </div>
                          <span className={`text-xs mt-1 ${giveawayStep >= 2 ? "text-white" : "text-gray-400"}`}>
                            Details
                          </span>
                        </div>
                        <div className={`flex-1 h-1 mx-2 ${giveawayStep >= 3 ? "bg-white" : "bg-gray-700"}`}></div>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                              giveawayStep >= 3 ? "bg-white text-black" : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            3
                          </div>
                          <span className={`text-xs mt-1 ${giveawayStep >= 3 ? "text-white" : "text-gray-400"}`}>
                            Requirements
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Delivery Method */}
                    {giveawayStep === 1 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-medium text-white">How would you like to share your giveaway?</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Choose how participants will access your giveaway
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <Button
                            variant="outline"
                            onClick={() => handleMethodSelect("server")}
                            className="h-auto py-6 border-white/20 text-white hover:bg-white/10 hover:border-white/40 flex flex-col items-center justify-center space-y-3 group"
                          >
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                              <Send className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-medium text-white">Server Message</h4>
                              <p className="text-xs text-gray-400 mt-1">Post directly to a channel in your server</p>
                            </div>
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleMethodSelect("link")}
                            className="h-auto py-6 border-white/20 text-white hover:bg-white/10 hover:border-white/40 flex flex-col items-center justify-center space-y-3 group"
                          >
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                              <LinkIcon2 className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-medium text-white">Share Link</h4>
                              <p className="text-xs text-gray-400 mt-1">Generate a link you can share anywhere</p>
                            </div>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Giveaway Details */}
                    {giveawayStep === 2 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-medium text-white">Giveaway Details</h3>
                          <p className="text-sm text-gray-400 mt-1">Fill in the information about your giveaway</p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-white text-sm mb-2 block">Title *</Label>
                            <Input
                              placeholder="Amazing Prize Giveaway!"
                              value={giveawayData.title}
                              onChange={(e) => setGiveawayData({ ...giveawayData, title: e.target.value })}
                              className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm mb-2 block">Prize *</Label>
                            <Input
                              placeholder="$100 Gift Card"
                              value={giveawayData.prize}
                              onChange={(e) => setGiveawayData({ ...giveawayData, prize: e.target.value })}
                              className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-white text-sm mb-2 block">End Date *</Label>
                              <Input
                                type="datetime-local"
                                value={giveawayData.endDate}
                                onChange={(e) => setGiveawayData({ ...giveawayData, endDate: e.target.value })}
                                className="bg-black/60 border-white/20 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-white text-sm mb-2 block">Number of Winners</Label>
                              <Input
                                type="number"
                                placeholder="1"
                                min="1"
                                value={giveawayData.winners}
                                onChange={(e) =>
                                  setGiveawayData({ ...giveawayData, winners: Number.parseInt(e.target.value) || 1 })
                                }
                                className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                              />
                            </div>
                          </div>

                          {giveawayData.method === "server" && (
                            <div>
                              <Label className="text-white text-sm mb-2 block">Channel *</Label>
                              <Select
                                value={giveawayData.channel}
                                onValueChange={(value) => setGiveawayData({ ...giveawayData, channel: value })}
                              >
                                <SelectTrigger className="bg-black/60 border-white/20">
                                  <SelectValue placeholder="Select channel">
                                    {giveawayData.channel && (
                                      <div className="flex items-center">
                                        <Hash className="h-4 w-4 mr-2" />
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
                                          <Hash className="h-4 w-4 mr-2" />
                                          {name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label className="text-white text-sm mb-2 block">Description</Label>
                            <Textarea
                              placeholder="Enter the giveaway description..."
                              value={giveawayData.description}
                              onChange={(e) => setGiveawayData({ ...giveawayData, description: e.target.value })}
                              className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={handlePrevStep}
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                          <Button
                            onClick={handleNextStep}
                            disabled={
                              !giveawayData.title ||
                              !giveawayData.prize ||
                              !giveawayData.endDate ||
                              (giveawayData.method === "server" && !giveawayData.channel)
                            }
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Requirements */}
                    {giveawayStep === 3 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-medium text-white">Entry Requirements (Optional)</h3>
                          <p className="text-sm text-gray-400 mt-1">Set requirements for who can enter your giveaway</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20">
                            <div>
                              <h4 className="font-medium text-white">Require server membership</h4>
                              <p className="text-sm text-gray-400">Only server members can enter</p>
                            </div>
                            <Switch
                              checked={giveawayData.requireMembership}
                              onCheckedChange={(checked) =>
                                setGiveawayData({ ...giveawayData, requireMembership: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20">
                            <div>
                              <h4 className="font-medium text-white">Require specific role</h4>
                              <p className="text-sm text-gray-400">Only users with a specific role can enter</p>
                            </div>
                            <Switch
                              checked={giveawayData.requireRole}
                              onCheckedChange={(checked) => setGiveawayData({ ...giveawayData, requireRole: checked })}
                            />
                          </div>

                          {giveawayData.requireRole && (
                            <div className="ml-4">
                              <Label className="text-white text-sm mb-2 block">Required Role</Label>
                              <Select
                                value={giveawayData.selectedRole}
                                onValueChange={(value) => setGiveawayData({ ...giveawayData, selectedRole: value })}
                              >
                                <SelectTrigger className="bg-black/60 border-white/20">
                                  <SelectValue placeholder="Select role">
                                    {giveawayData.selectedRole && (
                                      <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
                                        {getRoleName(giveawayData.selectedRole)}
                                      </div>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(serverConfig.roles_and_names).map(([id, name]) => (
                                    <SelectItem key={id} value={id}>
                                      <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
                                        {name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20">
                            <div>
                              <h4 className="font-medium text-white">Require account age (30+ days)</h4>
                              <p className="text-sm text-gray-400">Only accounts older than 30 days can enter</p>
                            </div>
                            <Switch
                              checked={giveawayData.requireAccountAge}
                              onCheckedChange={(checked) =>
                                setGiveawayData({ ...giveawayData, requireAccountAge: checked })
                              }
                            />
                          </div>

                          {giveawayData.method === "link" && (
                            <>
                              <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20">
                                <div>
                                  <h4 className="font-medium text-white">Require Discord login</h4>
                                  <p className="text-sm text-gray-400">Users must log in with Discord to enter</p>
                                </div>
                                <Switch
                                  checked={giveawayData.requireLogin}
                                  onCheckedChange={(checked) =>
                                    setGiveawayData({ ...giveawayData, requireLogin: checked })
                                  }
                                />
                              </div>

                              <div>
                                <Label className="text-white text-sm mb-2 block">Custom URL (Optional)</Label>
                                <div className="flex items-center">
                                  <span className="bg-black/60 border border-r-0 border-white/20 text-gray-400 px-3 py-2 rounded-l-md">
                                    ltpd.xyz/g/
                                  </span>
                                  <Input
                                    placeholder="custom-name"
                                    value={giveawayData.customUrl}
                                    onChange={(e) =>
                                      setGiveawayData({
                                        ...giveawayData,
                                        customUrl: e.target.value.replace(/\s+/g, "-").toLowerCase(),
                                      })
                                    }
                                    className="bg-black/60 border-white/20 text-white placeholder-gray-400 rounded-l-none"
                                  />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Leave blank for a random URL</p>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={handlePrevStep}
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                          <Button onClick={handleCreateGiveaway} className="bg-white text-black hover:bg-gray-200">
                            {giveawayData.method === "server" ? (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Send to Channel
                              </>
                            ) : (
                              <>
                                <LinkIcon2 className="mr-2 h-4 w-4" />
                                Generate Link
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Giveaway Success State */
                  <div className="p-6 bg-gray-500/10 rounded-lg border border-gray-500/30">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center">
                        <Check className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-white text-center mb-2">
                      {giveawayData.method === "server" ? "Giveaway Posted Successfully!" : "Giveaway Link Generated!"}
                    </h3>

                    {giveawayData.method === "server" ? (
                      <p className="text-gray-400 text-center mb-4">
                        Your giveaway has been posted to #{getChannelName(giveawayData.channel)}
                      </p>
                    ) : (
                      <>
                        <p className="text-gray-400 text-center mb-4">
                          Share this link with your community to let them enter the giveaway
                        </p>

                        <Label className="text-white text-sm mb-2 block">Giveaway Link:</Label>
                        <div className="flex items-center space-x-2">
                          <Input value={generatedLink} readOnly className="bg-black/60 border-white/20 text-white" />
                          <Button
                            size="sm"
                            onClick={copyLink}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </>
                    )}

                    <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
                      <Button
                        onClick={resetGiveaway}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        Create Another
                      </Button>
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
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <LinkIcon className="h-6 w-6 mr-3" />
                  Integrations
                </CardTitle>
                <CardDescription className="text-gray-400">Connect with other services and platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white">Integrations coming soon!</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plugins Tab */}
        {activeTab === "plugins" && (
          <div className="space-y-6">
            <PluginsTab />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Settings className="h-6 w-6 mr-3" />
                  Custom Bot Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure your custom bot's appearance and functionality.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bot Preview */}
                <div className="flex items-center space-x-4 p-4 rounded-lg border border-white/10 bg-black/20">
                  <Image
                    src={profilePictureUrl || "/placeholder.svg?height=64&width=64"}
                    alt={customBotName || "Bot Preview"}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{customBotName || "Your Custom Bot Name"}</h3>
                    <p className="text-sm text-gray-400">Bot Preview</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="profile-picture-url" className="text-white text-sm mb-2 block">
                    Profile Picture URL
                  </Label>
                  <Input
                    id="profile-picture-url"
                    placeholder="https://example.com/your-bot-avatar.png"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Direct URL to your bot's avatar image.</p>
                </div>

                <div>
                  <Label htmlFor="custom-bot-name" className="text-white text-sm mb-2 block">
                    Custom Bot Name
                  </Label>
                  <Input
                    id="custom-bot-name"
                    placeholder="My Awesome Bot"
                    value={customBotName}
                    onChange={(e) => setCustomBotName(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">The name your bot will display in Discord.</p>
                </div>

                <div>
                  <Label htmlFor="bot-token" className="text-white text-sm mb-2 block">
                    Bot Token
                  </Label>
                  <div className="relative">
                    <Input
                      id="bot-token"
                      type={showToken ? "text" : "password"}
                      placeholder="Your bot token (e.g., MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABCDEF.GHIJKLMNOPQRSTUVWXYZ)"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="pl-10 pr-10 bg-black/60 border-white/20 text-white placeholder-gray-400"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:bg-transparent"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-start space-x-2 text-xs text-gray-400 mt-2 p-2 rounded-md bg-gray-800/50 border border-gray-700/50">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      By providing your bot token, you acknowledge that Sycord will collect and store this information
                      to operate your customized bot, in accordance with our{" "}
                      <Link href="#" className="underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSaveBotSettings}
                  className="bg-white text-black hover:bg-gray-200 w-full"
                  disabled={!botToken} // Disable if token is empty
                >
                  Start Your Customized Bot
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Access+ Tab */}
        {activeTab === "access-plus" && session?.user?.email === "dmarton336@gmail.com" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Lock className="h-6 w-6 mr-3" />
                  Access+ Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage global application access and send announcements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20">
                  <div>
                    <h3 className="font-medium text-white text-base">Maintenance Mode</h3>
                    <p className="text-sm text-gray-400">
                      {appSettings?.maintenanceMode.enabled
                        ? `Application is in maintenance. Estimated: ${appSettings.maintenanceMode.estimatedTime}`
                        : "Application is fully operational."}
                    </p>
                  </div>
                  <Switch
                    checked={appSettings?.maintenanceMode.enabled || false}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>

                {/* Send Announcement */}
                <div>
                  <h3 className="font-medium text-white text-base mb-2">Send New Announcement</h3>
                  <Textarea
                    placeholder="Type your announcement here..."
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px] mb-3"
                  />
                  <Button
                    onClick={handleSendAnnouncement}
                    className="bg-white text-black hover:bg-gray-200 w-full"
                    disabled={!newAnnouncement.trim()}
                  >
                    <Megaphone className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                </div>

                {/* Current Announcements */}
                {announcements.length > 0 && (
                  <div>
                    <h3 className="font-medium text-white text-base mb-2">Active Announcements</h3>
                    <div className="space-y-3">
                      {announcements.map((ann) => (
                        <div
                          key={ann._id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-700/30 bg-gray-700/5"
                        >
                          <p className="text-sm text-gray-300">{ann.message}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // In a real app, you'd likely have a DELETE API for announcements
                              setAnnouncements((prev) => prev.filter((a) => a._id !== ann._id))
                            }}
                            className="text-gray-400 hover:bg-gray-500/20"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
