"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Shield,
  MessageSquare,
  Gift,
  LinkIcon,
  Home,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Info,
  Bot,
  Zap,
  Users,
  Crown,
  Package,
  Settings,
  Megaphone,
  LifeBuoy,
  Ticket,
  BarChart3,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PluginsTab from "@/components/plugins-tab"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

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
  const [activeTab, setActiveTab] = useState("home") // Changed default active tab to "home"
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
    const botProfilePictureUrl = profilePictureUrl // Declare the variable here
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

  const fetchServerConfig = async () => {
    try {
      const response = await fetch(`/api/settings/${serverId}`)
      if (response.ok) {
        const data = await response.json()
        setServerConfig(data)
      }
    } catch (error) {
      console.error("Error fetching server config:", error)
      toast.error("Failed to load server configuration")
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!serverConfig) return

    setSaving(true)
    try {
      const response = await fetch(`/api/settings/${serverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serverConfig),
      })

      if (response.ok) {
        toast.success("Configuration saved successfully!")
      } else {
        throw new Error("Failed to save configuration")
      }
    } catch (error) {
      console.error("Error saving config:", error)
      toast.error("Failed to save configuration")
    } finally {
      setSaving(false)
    }
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

  const renderSupportContent = () => {
    switch (supportView) {
      case "staff-insights":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSupportView("overview")}
                className="flex items-center gap-2 text-white hover:bg-gray-100 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
                Back to Overview
              </Button>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5" />
                  Staff Insights Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor staff activity and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="staff-insights" className="text-white">
                      Enable Staff Insights
                    </Label>
                    <p className="text-sm text-gray-400">Track staff activity and generate performance reports</p>
                  </div>
                  <Switch
                    id="staff-insights"
                    checked={serverConfig.support?.reputation_enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        support: {
                          ...serverConfig.support,
                          reputation_enabled: checked,
                        },
                      })
                    }
                  />
                </div>

                <Separator className="bg-white/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reputation-system" className="text-white">
                      Reputation System
                    </Label>
                    <p className="text-sm text-gray-400">Enable staff reputation tracking and rewards</p>
                  </div>
                  <Switch
                    id="reputation-system"
                    checked={serverConfig.support?.reputation_enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        support: {
                          ...serverConfig.support,
                          reputation_enabled: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Active Staff</p>
                          <p className="text-2xl font-bold text-white">12</p>
                        </div>
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Avg. Response Time</p>
                          <p className="text-2xl font-bold text-white">2.3m</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "tickets":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSupportView("overview")}
                className="flex items-center gap-2 text-white hover:bg-gray-100 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
                Back to Overview
              </Button>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Ticket className="h-5 w-5" />
                  Ticket System Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">Manage support tickets and user inquiries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ticket-system" className="text-white">
                      Enable Ticket System
                    </Label>
                    <p className="text-sm text-gray-400">Allow users to create support tickets</p>
                  </div>
                  <Switch
                    id="ticket-system"
                    checked={serverConfig.support?.ticket_system?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        support: {
                          ...serverConfig.support,
                          ticket_system: {
                            ...serverConfig.support?.ticket_system,
                            enabled: checked,
                            embed: serverConfig.support?.ticket_system?.embed || {
                              title: "Support Ticket",
                              description: "Click the button below to create a support ticket.",
                              color: "#5865F2",
                              footer: "Support Team",
                            },
                            settings: serverConfig.support?.ticket_system?.settings || {
                              autoAnswer: { enabled: false, qa_pairs: "" },
                              blockedUsers: { enabled: false, userIds: [] },
                              inactivityClose: { enabled: false, timeoutMinutes: 30 },
                              logging: { enabled: false },
                            },
                          },
                        },
                      })
                    }
                  />
                </div>

                <Separator className="bg-white/20" />

                <div className="space-y-2">
                  <Label htmlFor="ticket-category" className="text-white">
                    Ticket Category ID
                  </Label>
                  <Input
                    id="ticket-category"
                    placeholder="Enter Discord category ID"
                    value={serverConfig.support?.ticket_system?.channel_id || ""}
                    onChange={(e) =>
                      updateServerConfig({
                        support: {
                          ...serverConfig.support,
                          ticket_system: { ...serverConfig.support.ticket_system, channel_id: e.target.value },
                        },
                      })
                    }
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                  />
                  <p className="text-sm text-gray-400">Discord category where ticket channels will be created</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Open Tickets</p>
                          <p className="text-2xl font-bold text-white">8</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Resolved Today</p>
                          <p className="text-2xl font-bold text-white">15</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Total This Week</p>
                          <p className="text-2xl font-bold text-white">47</p>
                        </div>
                        <Ticket className="h-8 w-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Sycord is here to help</h2>
              <p className="text-gray-400">Manage your support system and help your community</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card className="glass-card cursor-pointer hover:bg-white/5 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <LinkIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Invite Track & Log</h3>
                      <p className="text-sm text-gray-400">Track member invites and log activities</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span className={`${serverConfig.invite_tracking?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig.invite_tracking?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Channel:</span>
                      <span className="text-white">
                        {serverConfig.invite_tracking?.channel_id
                          ? getChannelName(serverConfig.invite_tracking.channel_id)
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setActiveSupportSection("tickets")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Ticket System</h3>
                      <p className="text-sm text-gray-400">Configure support tickets and embeds</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span
                        className={`${serverConfig.support?.ticket_system?.enabled ? "text-green-400" : "text-gray-400"}`}
                      >
                        {serverConfig.support?.ticket_system?.enabled ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Channel:</span>
                      <span className="text-white">
                        {serverConfig.support?.ticket_system?.channel_id
                          ? getChannelName(serverConfig.support.ticket_system.channel_id)
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  const renderEventContent = () => {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Automatic Tasks</h3>
                <p className="text-sm text-gray-400">Manage automated tasks and scheduled jobs</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`${serverConfig.automatic_tasks?.enabled ? "text-green-400" : "text-gray-400"}`}>
                  {serverConfig.automatic_tasks?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tasks:</span>
                <span className="text-white">{serverConfig.automatic_tasks?.tasks.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Giveaway</h3>
                <p className="text-sm text-gray-400">Configure giveaways and promotions</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`${serverConfig.giveaway?.enabled ? "text-green-400" : "text-gray-400"}`}>
                  {serverConfig.giveaway?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Channel:</span>
                <span className="text-white">
                  {serverConfig.giveaway?.default_channel_id
                    ? getChannelName(serverConfig.giveaway.default_channel_id)
                    : "Not set"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Logger</h3>
                <p className="text-sm text-gray-400">Log server activities and events</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`${serverConfig.logs?.enabled ? "text-green-400" : "text-gray-400"}`}>
                  {serverConfig.logs?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Log Channel:</span>
                <span className="text-white">
                  {serverConfig.logs?.channel_id ? getChannelName(serverConfig.logs.channel_id) : "Not set"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Invite Track</h3>
                <p className="text-sm text-gray-400">Track member invites and log activities</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`${serverConfig.invite_tracking?.enabled ? "text-green-400" : "text-gray-400"}`}>
                  {serverConfig.invite_tracking?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Track Joins:</span>
                <span className="text-white">{serverConfig.invite_tracking?.track_joins ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Track Leaves:</span>
                <span className="text-white">{serverConfig.invite_tracking?.track_leaves ? "Yes" : "No"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Navigation Tabs
  const renderTabs = () => {
    return (
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto">
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
          <Zap className="h-4 w-4 mr-2" />
          Functions
        </Button>
        <Button
          variant={activeTab === "integrations" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("integrations")}
          className={`${
            activeTab === "integrations" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
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
      </div>
    )
  }

  // Sentinel Tab
  const renderSentinelTab = () => {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Staff Insights</h3>
                <p className="text-sm text-gray-400">Monitor staff performance and reputation</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReputationInfo(true)}
                className="border-gray-500/50 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                <Info className="h-4 w-4 mr-2" />
                How to use
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`${serverConfig.support?.reputation_enabled ? "text-green-400" : "text-gray-400"}`}>
                  {serverConfig.support?.reputation_enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active Staff:</span>
                <span className="text-white">{serverConfig.support?.staff?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
                className="border-gray-500/50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 w-full sm:w-auto"
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
                    : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
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
                    : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
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
                    : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
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
      </div>
    )
  }

  // Support Tab
  const renderSupportTab = () => {
    return <div className="space-y-6">{renderSupportContent()}</div>
  }

  // Functions Tab (formerly Events)
  const renderFunctionsTab = () => {
    return (
      <div className="space-y-6">
        <Card
          className="glass-card cursor-pointer hover:bg-white/5 transition-colors border-2 border-dashed border-white/20"
          onClick={() => setActiveTab("integrations")}
        >
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Add a new function</h3>
                <p className="text-sm text-gray-400">Click to browse available plugins and functions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {renderEventContent()}
      </div>
    )
  }

  // Settings Tab
  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-xl">
              <Bot className="h-6 w-6 mr-3" />
              Bot Settings
            </CardTitle>
            <CardDescription className="text-gray-400">Configure your custom bot settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot-name" className="text-white">
                Bot Name
              </Label>
              <Input
                id="bot-name"
                placeholder="Enter bot name"
                value={customBotName}
                onChange={(e) => setCustomBotName(e.target.value)}
                className="bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot-token" className="text-white">
                Bot Token
              </Label>
              <Input
                id="bot-token"
                placeholder="Enter bot token"
                value={showToken ? botToken : ""}
                onChange={(e) => setBotToken(e.target.value)}
                type={showToken ? "text" : "password"}
                className="bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowToken(!showToken)}
                className="border-gray-500/50 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                {showToken ? "Hide Token" : "Show Token"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot-profile-picture" className="text-white">
                Bot Profile Picture URL
              </Label>
              <Input
                id="bot-profile-picture"
                placeholder="Enter profile picture URL"
                value={profilePictureUrl}
                onChange={(e) => setProfilePictureUrl(e.target.value)}
                className="bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
            </div>

            <Button onClick={handleSaveBotSettings} className="bg-white text-black hover:bg-gray-200">
              Save Bot Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Integrations Tab
  const renderIntegrationsTab = () => {
    return (
      <div className="space-y-6">
        <PluginsTab />
      </div>
    )
  }

  // Main Content Renderer
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <div>Home Content</div>
      case "sentinel":
        return renderSentinelTab()
      case "support":
        return renderSupportTab()
      case "events":
        return renderFunctionsTab()
      case "integrations":
        return renderIntegrationsTab()
      case "settings":
        return renderSettingsTab()
      default:
        return <div>Default Content</div>
    }
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {renderTabs()}
        {renderContent()}

        <Dialog open={showReputationInfo} onOpenChange={setShowReputationInfo}>
          <DialogContent className="glass-card border-white/20 max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">How Staff Insights & Reputation Works</DialogTitle>
              <DialogDescription className="text-gray-400">
                Understanding our staff monitoring and reputation system
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Performance Tracking</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Monitor response times, ticket resolution rates, and overall staff activity to identify top
                    performers and areas for improvement.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Reputation System</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Staff members earn reputation points based on positive user feedback, quick response times, and
                    successful ticket resolutions.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Automated Rewards</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    High-performing staff automatically receive recognition, special roles, and can unlock additional
                    permissions based on their reputation score.
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={() => setShowReputationInfo(false)} className="bg-white text-black hover:bg-gray-200">
                Got it!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
