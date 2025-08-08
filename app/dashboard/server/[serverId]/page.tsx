"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Shield, MessageSquare, Gift, LinkIcon, Filter, Hash, ChevronDown, Home, Plus, Copy, Check, LogIn, ArrowLeft, Clock, AlertTriangle, Info, Eye, Bot, Webhook, MessageCircle, FileText, Zap, UserCheck, Users, Crown, Package, Settings, Lock, Megaphone, Flag, LifeBuoy, Download, Ticket, BarChart3, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PluginsTab from "@/components/plugins-tab"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Define UserData interface
interface UserData {
  name: string
  email: string
  joined_since: string
}

interface StaffMember {
  userId: string
  username: string
  reputation: number
  maxReputation: number
}

interface TicketEmbed {
  title: string
  description: string
  color: string
  thumbnail?: string
  footer?: string
  fields?: {
    name: string
    value: string
    inline?: boolean
  }[]
}

interface TicketSettings {
  autoAnswer: {
    enabled: boolean
    qa_pairs: string
  }
  blockedUsers: {
    enabled: boolean
    userIds: string[]
  }
  inactivityClose: {
    enabled: boolean
    timeoutMinutes: number
  }
  logging: {
    enabled: boolean
    channelId?: string
  }
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
    staff: StaffMember[]
    reputation_enabled: boolean
    max_reputation_score: number
    ticket_system: {
      enabled: boolean
      channel_id?: string
      priority_role_id?: string
      embed: TicketEmbed
      settings: TicketSettings
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
  invite_tracking: {
    enabled: boolean
    channel_id?: string
    track_joins: boolean
    track_leaves: boolean
  }
  automatic_tasks: {
    enabled: boolean
    tasks: { id: string; name: string; type: string; status: string }[]
  }
  last_updated?: string
  channels?: { [key: string]: string }
  server_stats: {
    total_members: number
    total_bots: number
    total_admins: number
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

type SupportView = "overview" | "staff-insights" | "tickets"
type EventView = "overview" | "automatic-task" | "giveaway" | "logger" | "invite-track"

export default function ServerConfigPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const serverId = params.serverId as string

  // Add state for modals
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showReputationInfo, setShowReputationInfo] = useState(false)
  const [showEmbedSettings, setShowEmbedSettings] = useState(false)
  const [showTicketSettings, setShowTicketSettings] = useState(false)
  const [showLockdownWarning, setShowLockdownWarning] = useState(false)
  const [showFlagStaffWarning, setShowFlagStaffWarning] = useState(false)
  const [staffToFlag, setStaffToFlag] = useState<string | null>(null)

  const [activeSupportSection, setActiveSupportSection] = useState<"staff" | "tickets" | null>(null)

  const [userData, setUserData] = useState<UserData | null>(null)
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null)
  const [userServers, setUserServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [supportView, setSupportView] = useState<SupportView>("overview")
  const [activeEventSection, setActiveEventSection] = useState<EventView>("overview")

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
        // Initialize default values for new fields if they don't exist
        const initialConfig: ServerConfig = {
          ...configData.server,
          server_stats: configData.server.server_stats || {
            total_members: 0,
            total_bots: 0,
            total_admins: 0
          },
          support: {
            ...configData.server.support,
            reputation_enabled: configData.server.support?.reputation_enabled ?? false,
            max_reputation_score: configData.server.support?.max_reputation_score ?? 20,
            ticket_system: {
              ...configData.server.support?.ticket_system,
              enabled: configData.server.support?.ticket_system?.enabled ?? false,
              embed: configData.server.support?.ticket_system?.embed || {
                title: "Support Ticket",
                description: "Click the button below to create a support ticket.",
                color: "#5865F2",
                footer: "Support Team",
              },
              settings: configData.server.support?.ticket_system?.settings || {
                autoAnswer: { enabled: false, qa_pairs: "" },
                blockedUsers: { enabled: false, userIds: [] },
                inactivityClose: { enabled: false, timeoutMinutes: 30 },
                logging: { enabled: false },
              },
            },
          },
          logs: {
            ...configData.server.logs,
            enabled: configData.server.logs?.enabled ?? false,
            message_edits: configData.server.logs?.message_edits ?? false,
            mod_actions: configData.server.logs?.mod_actions ?? false,
            member_joins: configData.server.logs?.member_joins ?? false,
            member_leaves: configData.server.logs?.member_leaves ?? false,
          },
          invite_tracking: {
            enabled: configData.server.invite_tracking?.enabled ?? false,
            track_joins: configData.server.invite_tracking?.track_joins ?? false,
            track_leaves: configData.server.invite_tracking?.track_leaves ?? false,
          },
          automatic_tasks: {
            enabled: configData.server.automatic_tasks?.enabled ?? false,
            tasks: configData.server.automatic_tasks?.tasks ?? [],
          },
        }
        setServerConfig(initialConfig)
        setUserData(configData.user)
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

  // Staff management functions
  const handleFlagStaffClick = (userId: string) => {
    setStaffToFlag(userId)
    setShowFlagStaffWarning(true)
  }

  const confirmFlagStaff = () => {
    if (!serverConfig || !staffToFlag) return

    const updatedStaff = serverConfig.support.staff.map((staff) =>
      staff.userId === staffToFlag ? { ...staff, reputation: 5 } : staff,
    )

    updateServerConfig({
      support: {
        ...serverConfig.support,
        staff: updatedStaff,
      },
    })
    setShowFlagStaffWarning(false)
    setStaffToFlag(null)
  }

  // Send ticket embed function
  const sendTicketEmbed = async () => {
    if (!serverConfig?.support?.ticket_system?.channel_id) return

    try {
      // In a real implementation, this would send the embed to Discord
      console.log("Sending ticket embed to channel:", serverConfig.support.ticket_system.channel_id)
      // You would implement the actual Discord API call here
    } catch (error) {
      console.error("Error sending ticket embed:", error)
    }
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

    if (level === "lockdown") {
      setShowLockdownWarning(true)
      return // Prevent immediate change, wait for confirmation
    }

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
    }

    updateServerConfig({
      moderation_level: level,
      moderation: updatedModeration,
    })
  }

  const confirmLockdown = () => {
    if (!serverConfig) return
    const updatedModeration = { ...serverConfig.moderation }
    // Turn on all security features
    Object.keys(updatedModeration).forEach((key) => {
      if (typeof updatedModeration[key] === "object" && updatedModeration[key]?.enabled !== undefined) {
        updatedModeration[key].enabled = true
      }
    })
    updateServerConfig({
      moderation_level: "lockdown",
      moderation: updatedModeration,
    })
    setShowLockdownWarning(false)
  }

  const handleSaveBotSettings = async () => {
    const botProfilePictureUrl = profilePictureUrl
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
            estimatedTime: checked ? "30 minutes" : "",
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
        fetchAnnouncements()
      }
    } catch (error) {
      console.error("Error sending announcement:", error)
    }
  }

  const handleDismissAnnouncement = (id: string) => {
    setDismissedAnnouncements((prev) => [...prev, id])
  }

  const downloadUserData = async () => {
    try {
      const response = await fetch(`/api/user-config/${serverId}`)
      if (response.ok) {
        const data = await response.json()
        setUserData(data)

        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `user-data-${serverId}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success("User data downloaded successfully!")
      }
    } catch (error) {
      console.error("Error downloading user data:", error)
      toast.error("Failed to download user data")
    }
  }

  const renderEventContent = () => {
    switch (activeEventSection) {
      case "automatic-task":
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setActiveEventSection("overview")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2 text-white" /> Back to Overview
            </Button>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Clock className="h-6 w-6 text-white mr-3" /> Automatic Tasks
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Automate actions and schedule tasks for your server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-tasks" className="text-white">
                      Enable Automatic Tasks
                    </Label>
                    <p className="text-sm text-gray-400">Enable scheduled tasks and automated actions.</p>
                  </div>
                  <Switch
                    id="auto-tasks"
                    checked={serverConfig?.automatic_tasks?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        automatic_tasks: { ...serverConfig?.automatic_tasks, enabled: checked },
                      })
                    }
                  />
                </div>
                <Separator className="bg-white/20" />
                {serverConfig?.automatic_tasks?.enabled && (
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Scheduled Tasks</h4>
                    {serverConfig.automatic_tasks.tasks?.length > 0 ? (
                      <div className="space-y-2">
                        {serverConfig.automatic_tasks.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 rounded-md bg-black/20 border border-white/10"
                          >
                            <span className="text-white">{task.name}</span>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                              {task.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No automatic tasks configured yet.</p>
                    )}
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2 text-white" /> Add New Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      case "giveaway":
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setActiveEventSection("overview")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2 text-white" /> Back to Overview
            </Button>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Gift className="h-6 w-6 text-white mr-3" /> Giveaway System
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure and manage giveaways for your server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {giveawayStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Step 1: Select Giveaway Method</h3>
                    <p className="text-gray-400">Choose how you want to create the giveaway</p>
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => handleMethodSelect("server")}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        Create on Server
                      </Button>
                      <Button
                        onClick={() => handleMethodSelect("link")}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        Create with Link
                      </Button>
                    </div>
                  </div>
                )}

                {giveawayStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Step 2: Configure Giveaway</h3>
                    <p className="text-gray-400">Enter the details for your giveaway</p>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-white text-sm mb-2 block">Title</Label>
                        <Input
                          placeholder="Summer Giveaway"
                          value={giveawayData.title}
                          onChange={(e) => setGiveawayData({ ...giveawayData, title: e.target.value })}
                          className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm mb-2 block">Prize</Label>
                        <Input
                          placeholder="Gaming PC"
                          value={giveawayData.prize}
                          onChange={(e) => setGiveawayData({ ...giveawayData, prize: e.target.value })}
                          className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm mb-2 block">Description</Label>
                        <Textarea
                          placeholder="Enter the description for the giveaway"
                          value={giveawayData.description}
                          onChange={(e) => setGiveawayData({ ...giveawayData, description: e.target.value })}
                          className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm mb-2 block">End Date</Label>
                        <Input
                          type="datetime-local"
                          value={giveawayData.endDate}
                          onChange={(e) => setGiveawayData({ ...giveawayData, endDate: e.target.value })}
                          className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm mb-2 block">Number of Winners</Label>
                        <Input
                          type="number"
                          min="1"
                          value={giveawayData.winners}
                          onChange={(e) =>
                            setGiveawayData({ ...giveawayData, winners: Number.parseInt(e.target.value) })
                          }
                          className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                      {giveawayData.method === "server" && (
                        <div>
                          <Label className="text-white text-sm mb-2 block">Channel</Label>
                          <Select
                            value={giveawayData.channel}
                            onValueChange={(value) => setGiveawayData({ ...giveawayData, channel: value })}
                          >
                            <SelectTrigger className="bg-black/60 border-white/20 h-8">
                              <SelectValue placeholder="Select a channel" />
                            </SelectTrigger>
                            <SelectContent>
                              {serverConfig?.channels &&
                                Object.entries(serverConfig.channels).map(([channelId, channelName]) => (
                                  <SelectItem key={channelId} value={channelId}>
                                    {channelName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {giveawayData.method === "link" && (
                        <div>
                          <Label className="text-white text-sm mb-2 block">Custom URL (Optional)</Label>
                          <Input
                            placeholder="custom-giveaway-url"
                            value={giveawayData.customUrl}
                            onChange={(e) => setGiveawayData({ ...giveawayData, customUrl: e.target.value })}
                            className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevStep}
                        className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2 text-white" />
                        Previous
                      </Button>
                      <Button onClick={handleNextStep} className="bg-white text-black hover:bg-gray-100">
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {giveawayStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Step 3: Set Requirements</h3>
                    <p className="text-gray-400">Set the requirements for users to enter the giveaway</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white text-sm">Require Server Membership</Label>
                          <p className="text-xs text-gray-400">Users must be a member of the server</p>
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
                          <Label className="text-white text-sm">Require Specific Role</Label>
                          <p className="text-xs text-gray-400">Users must have a specific role</p>
                        </div>
                        <Switch
                          checked={giveawayData.requireRole}
                          onCheckedChange={(checked) => setGiveawayData({ ...giveawayData, requireRole: checked })}
                        />
                      </div>
                      {giveawayData.requireRole && (
                        <div>
                          <Label className="text-white text-sm mb-2 block">Select Role</Label>
                          <Select
                            value={giveawayData.selectedRole}
                            onValueChange={(value) => setGiveawayData({ ...giveawayData, selectedRole: value })}
                          >
                            <SelectTrigger className="bg-black/60 border-white/20 h-8">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {serverConfig?.roles_and_names &&
                                Object.entries(serverConfig.roles_and_names).map(([roleId, roleName]) => (
                                  <SelectItem key={roleId} value={roleId}>
                                    {roleName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white text-sm">Require Account Age</Label>
                          <p className="text-xs text-gray-400">Users must have an account older than a certain age</p>
                        </div>
                        <Switch
                          checked={giveawayData.requireAccountAge}
                          onCheckedChange={(checked) =>
                            setGiveawayData({ ...giveawayData, requireAccountAge: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white text-sm">Require Login</Label>
                          <p className="text-xs text-gray-400">Users must login to enter</p>
                        </div>
                        <Switch
                          checked={giveawayData.requireLogin}
                          onCheckedChange={(checked) => setGiveawayData({ ...giveawayData, requireLogin: checked })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevStep}
                        className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2 text-white" />
                        Previous
                      </Button>
                      <Button onClick={handleCreateGiveaway} className="bg-white text-black hover:bg-gray-100">
                        Create Giveaway
                      </Button>
                    </div>
                  </div>
                )}

                {giveawayCreated && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Giveaway Created!</h3>
                    {giveawayData.method === "link" && (
                      <div className="space-y-2">
                        <p className="text-gray-400">Share this link with your community:</p>
                        <div className="flex items-center justify-between bg-black/60 border-white/20 rounded-md p-2">
                          <Input readOnly value={generatedLink} className="bg-transparent border-none text-white" />
                          <Button onClick={copyLink} className="bg-white text-black hover:bg-gray-100">
                            {linkCopied ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <Copy className="h-4 w-4 text-white" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    <Button onClick={resetGiveaway} className="bg-gray-100 text-gray-900 hover:bg-gray-200">
                      Create Another Giveaway
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      case "logger":
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setActiveEventSection("overview")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2 text-white" /> Back to Overview
            </Button>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <FileText className="h-6 w-6 text-white mr-3" /> Logger
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure logging for server events and actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="logger-enabled" className="text-white">
                      Enable Logger
                    </Label>
                    <p className="text-sm text-gray-400">Log various server events to a designated channel.</p>
                  </div>
                  <Switch
                    id="logger-enabled"
                    checked={serverConfig?.logs?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        logs: { ...serverConfig?.logs, enabled: checked },
                      })
                    }
                  />
                </div>
                <Separator className="bg-white/20" />
                {serverConfig?.logs?.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white text-sm mb-2 block">Log Channel</Label>
                      <Select
                        value={serverConfig.logs?.channel_id || ""}
                        onValueChange={(value) =>
                          updateServerConfig({
                            logs: { ...serverConfig.logs, channel_id: value },
                          })
                        }
                      >
                        <SelectTrigger className="bg-black/60 border-white/20 h-8">
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {serverConfig.channels &&
                            Object.entries(serverConfig.channels).map(([channelId, channelName]) => (
                              <SelectItem key={channelId} value={channelId}>
                                {channelName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Events to Log</h4>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log-message-edits" className="text-white text-sm">
                          Message Edits
                        </Label>
                        <Switch
                          id="log-message-edits"
                          checked={serverConfig.logs?.message_edits || false}
                          onCheckedChange={(checked) =>
                            updateServerConfig({
                              logs: { ...serverConfig.logs, message_edits: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log-mod-actions" className="text-white text-sm">
                          Moderation Actions
                        </Label>
                        <Switch
                          id="log-mod-actions"
                          checked={serverConfig.logs?.mod_actions || false}
                          onCheckedChange={(checked) =>
                            updateServerConfig({
                              logs: { ...serverConfig.logs, mod_actions: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log-member-joins" className="text-white text-sm">
                          Member Joins
                        </Label>
                        <Switch
                          id="log-member-joins"
                          checked={serverConfig.logs?.member_joins || false}
                          onCheckedChange={(checked) =>
                            updateServerConfig({
                              logs: { ...serverConfig.logs, member_joins: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log-member-leaves" className="text-white text-sm">
                          Member Leaves
                        </Label>
                        <Switch
                          id="log-member-leaves"
                          checked={serverConfig.logs?.member_leaves || false}
                          onCheckedChange={(checked) =>
                            updateServerConfig({
                              logs: { ...serverConfig.logs, member_leaves: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      case "invite-track":
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setActiveEventSection("overview")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2 text-white" /> Back to Overview
            </Button>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <LinkIcon className="h-6 w-6 text-white mr-3" /> Invite Tracker
                </CardTitle>
                <CardDescription className="text-gray-400">Track invites and monitor server growth.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="invite-track-enabled" className="text-white">
                      Enable Invite Tracker
                    </Label>
                    <p className="text-sm text-gray-400">Track which invites members use to join your server.</p>
                  </div>
                  <Switch
                    id="invite-track-enabled"
                    checked={serverConfig?.invite_tracking?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        invite_tracking: { ...serverConfig?.invite_tracking, enabled: checked },
                      })
                    }
                  />
                </div>
                <Separator className="bg-white/20" />
                {serverConfig?.invite_tracking?.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white text-sm mb-2 block">Invite Log Channel</Label>
                      <Select
                        value={serverConfig.invite_tracking?.channel_id || ""}
                        onValueChange={(value) =>
                          updateServerConfig({
                            invite_tracking: { ...serverConfig.invite_tracking, channel_id: value },
                          })
                        }
                      >
                        <SelectTrigger className="bg-black/60 border-white/20 h-8">
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {serverConfig.channels &&
                            Object.entries(serverConfig.channels).map(([channelId, channelName]) => (
                              <SelectItem key={channelId} value={channelId}>
                                {channelName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Events to Track</h4>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="track-joins" className="text-white text-sm">
                          Track Joins
                        </Label>
                        <Switch
                          id="track-joins"
                          checked={serverConfig.invite_tracking?.track_joins || false}
                          onCheckedChange={(checked) =>
                            updateServerConfig({
                              invite_tracking: { ...serverConfig.invite_tracking, track_joins: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="track-leaves" className="text-white text-sm">
                          Track Leaves
                        </Label>
                        <Switch
                          id="track-leaves"
                          checked={serverConfig.invite_tracking?.track_leaves || false}
                          onCheckedChange={(checked) =>
                            updateServerConfig({
                              invite_tracking: { ...serverConfig.invite_tracking, track_leaves: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Automatic Task Card */}
              <Card
                className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setActiveEventSection("automatic-task")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Automatic Tasks</h3>
                      <p className="text-sm text-gray-400">Automate actions and schedule tasks</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span className={`${serverConfig?.automatic_tasks?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig?.automatic_tasks?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Active Tasks:</span>
                      <span className="text-white">{serverConfig?.automatic_tasks?.tasks?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Giveaway Card */}
              <Card
                className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setActiveEventSection("giveaway")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Giveaway System</h3>
                      <p className="text-sm text-gray-400">Configure and manage giveaways</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span className={`${serverConfig?.giveaway?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig?.giveaway?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ongoing Giveaways:</span>
                      <span className="text-white">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logger Card */}
              <Card
                className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setActiveEventSection("logger")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Logger</h3>
                      <p className="text-sm text-gray-400">Log server events and actions</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span className={`${serverConfig?.logs?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig?.logs?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Log Entries Today:</span>
                      <span className="text-white">124</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invite Tracker Card */}
              <Card
                className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setActiveEventSection("invite-track")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center">
                      <LinkIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Invite Tracker</h3>
                      <p className="text-sm text-gray-400">Track invites and monitor server growth</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span className={`${serverConfig?.invite_tracking?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig?.invite_tracking?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Active Invites:</span>
                      <span className="text-white">7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
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
                  <Button variant="ghost" size="icon" className="text-white hover:bg-gray-100 hover:text-gray-900">
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
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
                  >
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
                    className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 w-full md:w-auto bg-transparent"
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
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
                >
                  <div className="flex items-center space-x-2">
                    {serverConfig.server_icon ? (
                      <Image
                        src={`https://cdn.discordapp.com/icons/${serverId}/${serverConfig.server_icon}.png?size=32`}
                        alt={serverConfig.server_name || "Server Icon"}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                    ) : (
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs bg-gray-600 text-white">
                          {serverConfig.server_name ? serverConfig.server_name.charAt(0) : "S"}
                        </AvatarFallback>
                      </Avatar>
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
              variant={activeTab === "home" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("home")}
              className={`${
                activeTab === "home" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
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
                activeTab === "sentinel" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Sentinel
            </Button>
            <Button
              variant={activeTab === "support" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("support")}
              className={`${
                activeTab === "support" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <LifeBuoy className="h-4 w-4 mr-2" />
              Support
            </Button>
            <Button
              variant={activeTab === "events" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("events")}
              className={`${
                activeTab === "events" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Gift className="h-4 w-4 mr-2" />
              Functions
            </Button>
            <Button
              variant={activeTab === "integrations" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("integrations")}
              className={`${
                activeTab === "integrations"
                  ? "bg-white text-black"
                  : "text-white hover:bg-gray-100 hover:text-gray-900"
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
                activeTab === "plugins" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
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
                activeTab === "settings" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
              } transition-colors flex-shrink-0 text-sm px-4 h-9`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {session?.user?.email === "dmarton336@gmail.com" && (
              <Button
                variant={activeTab === "access-plus" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("access-plus")}
                className={`${
                  activeTab === "access-plus"
                    ? "bg-white text-black"
                    : "text-white hover:bg-gray-100 hover:text-gray-900"
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
                        alt={serverConfig.server_name || "Server Icon"}
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
                      <div className="font-bold text-white">{serverConfig.server_stats?.total_members || 'N/A'}</div>
                      <div className="text-gray-400">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{serverConfig.server_stats?.total_bots || 'N/A'}</div>
                      <div className="text-gray-400">Bots</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{serverConfig.server_stats?.total_admins || 'N/A'}</div>
                      <div className="text-gray-400">Admins</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Announcements */}
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
                          className="text-gray-400 hover:bg-gray-100 hover:text-gray-900"
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
                                className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 h-7 text-xs bg-transparent"
                              >
                                Simple Text
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 h-7 text-xs bg-transparent"
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
                            <p className="text-xs text-gray-400">
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

        {/* Events Tab */}
        {activeTab === "events" && <div className="space-y-6">{renderEventContent()}</div>}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <LinkIcon className="h-6 w-6 mr-3" />
                  Integrations
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect your server with other services and platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-400">Integrations are coming soon! Stay tuned for updates.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plugins Tab */}
        {activeTab === "plugins" && <PluginsTab serverId={serverId} />}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Bot Profile Header */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Bot className="h-6 w-6 mr-3" />
                  Bot Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize your bot's appearance and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  {/* Bot Avatar */}
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-blue-500">
                      <AvatarImage src={profilePictureUrl || "/placeholder.svg"} alt="Bot Avatar" />
                      <AvatarFallback className="text-2xl font-bold bg-blue-800 text-white">
                        {customBotName ? customBotName.charAt(0) : "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>

                  {/* Bot Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">{customBotName || "Sycord"}</h2>
                    <p className="text-gray-400 mb-2">Discord Bot</p>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Online
                    </Badge>
                  </div>
                </div>

                {/* Customization Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-white text-sm mb-2 block">Bot Name</Label>
                    <Input
                      placeholder="Enter bot name"
                      value={customBotName}
                      onChange={(e) => setCustomBotName(e.target.value)}
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm mb-2 block">Profile Picture URL</Label>
                    <Input
                      placeholder="https://example.com/avatar.png"
                      value={profilePictureUrl}
                      onChange={(e) => setProfilePictureUrl(e.target.value)}
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white text-sm mb-2 block">Bot Token (Optional)</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="Enter bot token for custom bot"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Leave empty to use the default Sycord bot</p>
                </div>

                <Button onClick={handleSaveBotSettings} className="bg-white text-black hover:bg-gray-100">
                  Save Bot Settings
                </Button>
              </CardContent>
            </Card>

            {/* Settings Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card cursor-pointer hover:bg-white/5 transition-colors group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                    <Mail className="w-6 h-6 text-red-400" />
                  </div>
                  <CardTitle className="text-white">Report Problem</CardTitle>
                  <CardDescription className="text-gray-400">Contact our support team for assistance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-transparent border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
                    variant="outline"
                    onClick={() => window.open("mailto:support@sycord.com", "_blank")}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card cursor-pointer hover:bg-white/5 transition-colors group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <Download className="w-6 h-6 text-green-400" />
                  </div>
                  <CardTitle className="text-white">Manage Data</CardTitle>
                  <CardDescription className="text-gray-400">Download your collected user data as JSON</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-transparent border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
                    variant="outline"
                    onClick={downloadUserData}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Data
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Footer with Terms and Privacy */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-6 text-sm">
                    <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
                      Terms of Service
                    </Button>
                    <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
                      Privacy Policy
                    </Button>
                    <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
                      Support
                    </Button>
                  </div>
                  <Separator className="bg-white/20" />
                  <div className="text-xs text-gray-500">
                    <p>© 2024 Sycord. All rights reserved.</p>
                    <p className="mt-1">
                      We collect minimal data necessary for bot functionality. Your data is never sold or shared with
                      third parties.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Access+ Tab */}
        {activeTab === "access-plus" && session?.user?.email === "dmarton336@gmail.com" && (
          <div className="space-y-6">
            {/* App Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Settings className="h-6 w-6 mr-3" />
                  App Settings
                </CardTitle>
                <CardDescription className="text-gray-400">Manage global app settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode" className="text-white">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-gray-400">Enable or disable maintenance mode for the entire app</p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={appSettings?.maintenanceMode.enabled || false}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Megaphone className="h-6 w-6 mr-3" />
                  Announcements
                </CardTitle>
                <CardDescription className="text-gray-400">Send global announcements to all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="new-announcement" className="text-white">
                    New Announcement
                  </Label>
                  <Textarea
                    id="new-announcement"
                    placeholder="Enter your announcement message"
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
                  />
                </div>
                <Button onClick={handleSendAnnouncement} className="bg-white text-black hover:bg-gray-100">
                  Send Announcement
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
