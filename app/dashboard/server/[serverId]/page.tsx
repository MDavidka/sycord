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
  Shield,
  MessageSquare,
  Gift,
  LinkIcon,
  Home,
  Plus,
  Copy,
  Check,
  ArrowLeft,
  Clock,
  Bot,
  FileText,
  Users,
  Settings,
  Lock,
  Megaphone,
  Ticket,
  BarChart3,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

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

  const [activeSupportSection, setActiveSupportSection] = useState<"staff" | "tickets" | "invite-track" | null>(null)

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
            <div className="grid grid-cols-1 gap-6">
              {" "}
              {/* Changed to grid-cols-1 for vertical stacking */}
              <Card
                className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setActiveSupportSection("staff")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Staff Insights</h3>
                      <p className="text-sm text-gray-400">Monitor staff performance and reputation</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span
                        className={`${serverConfig.support?.reputation_enabled ? "text-green-400" : "text-gray-400"}`}
                      >
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
                    checked={serverConfig.automatic_tasks?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        automatic_tasks: { ...serverConfig.automatic_tasks, enabled: checked },
                      })
                    }
                  />
                </div>
                <Separator className="bg-white/20" />
                {serverConfig.automatic_tasks?.enabled && (
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
                              {serverConfig.channels &&
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
                              {serverConfig.roles_and_names &&
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
                    checked={serverConfig.logs?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        logs: { ...serverConfig.logs, enabled: checked },
                      })
                    }
                  />
                </div>
                <Separator className="bg-white/20" />
                {serverConfig.logs?.enabled && (
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
                    checked={serverConfig.invite_tracking?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        invite_tracking: { ...serverConfig.invite_tracking, enabled: checked },
                      })
                    }
                  />
                </div>
                <Separator className="bg-white/20" />
                {serverConfig.invite_tracking?.enabled && (
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
                      <span className={`${serverConfig.automatic_tasks?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig.automatic_tasks?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Active Tasks:</span>
                      <span className="text-white">{serverConfig.automatic_tasks?.tasks?.length || 0}</span>
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
                      <span className={`${serverConfig.giveaway?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig.giveaway?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ongoing Giveaways:</span>
                      <span className="text-white">3</span> {/* Placeholder */}
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
                      <span className={`${serverConfig.logs?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig.logs?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Log Entries Today:</span>
                      <span className="text-white">124</span> {/* Placeholder */}
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
                      <span className={`${serverConfig.invite_tracking?.enabled ? "text-green-400" : "text-gray-400"}`}>
                        {serverConfig.invite_tracking?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Active Invites:</span>
                      <span className="text-white">7</span> {/* Placeholder */}
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

  if (!session) {
    return <div>Not logged in</div>
  }

  if (!serverId) {
    return <div>No server ID</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Server Configuration: {serverConfig?.server_name || "Loading..."}</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={downloadUserData}>
              Download User Data
            </Button>
            <Button variant="primary" onClick={saveConfig} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Announcement Section */}
        {appSettings?.maintenanceMode?.enabled && (
          <Alert variant="destructive">
            <AlertDescription>
              The app is currently in maintenance mode. Estimated time:{" "}
              {appSettings.maintenanceMode.estimatedTime || "Unknown"}
            </AlertDescription>
          </Alert>
        )}

        {announcements
          .filter((announcement) => !dismissedAnnouncements.includes(announcement._id))
          .map((announcement) => (
            <Alert key={announcement._id} className="mb-4">
              <AlertDescription>
                {announcement.message}
                <Button variant="link" onClick={() => handleDismissAnnouncement(announcement._id)} className="ml-2">
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          ))}

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-4">
            <Button
              variant={activeTab === "home" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("home")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              Home
            </Button>
            <Button
              variant={activeTab === "moderation" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("moderation")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              Moderation
            </Button>
            <Button
              variant={activeTab === "support" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("support")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              Support
            </Button>
            <Button
              variant={activeTab === "events" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("events")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              Events
            </Button>
            <Button
              variant={activeTab === "settings" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("settings")}
              className="text-white hover:bg-gray-100 hover:text-gray-900"
            >
              Settings
            </Button>
            {session.user?.email === "admin@admin.com" && (
              <Button
                variant={activeTab === "admin" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("admin")}
                className="text-white hover:bg-gray-100 hover:text-gray-900"
              >
                Admin
              </Button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "home" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Home className="h-5 w-5" />
                  Server Overview
                </CardTitle>
                <CardDescription className="text-gray-400">View key server statistics and information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Total Members</p>
                          <p className="text-2xl font-bold text-white">
                            {serverConfig?.server_stats?.total_members || "Loading..."}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Total Bots</p>
                          <p className="text-2xl font-bold text-white">
                            {serverConfig?.server_stats?.total_bots || "Loading..."}
                          </p>
                        </div>
                        <Bot className="h-8 w-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Total Admins</p>
                          <p className="text-2xl font-bold text-white">
                            {serverConfig?.server_stats?.total_admins || "Loading..."}
                          </p>
                        </div>
                        <Shield className="h-8 w-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-gray-400">Quickly manage key server settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="moderation-level" className="text-white">
                      Moderation Level
                    </Label>
                    <p className="text-sm text-gray-400">Set the overall moderation level for the server</p>
                  </div>
                  <Select
                    value={serverConfig?.moderation_level || "off"}
                    onValueChange={(value) => handleModerationLevelChange(value as "off" | "on" | "lockdown")}
                  >
                    <SelectTrigger className="bg-black/60 border-white/20 h-8">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="lockdown">Lockdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-white/20" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="welcome-message" className="text-white">
                      Welcome Message
                    </Label>
                    <p className="text-sm text-gray-400">Enable or disable the welcome message</p>
                  </div>
                  <Switch
                    id="welcome-message"
                    checked={serverConfig?.welcome?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        welcome: { ...serverConfig.welcome, enabled: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "moderation" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5" />
                  Moderation Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure various moderation settings for your server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Link Filter */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="link-filter" className="text-white">
                      Link Filter
                    </Label>
                    <p className="text-sm text-gray-400">Automatically filter and block suspicious links</p>
                  </div>
                  <Switch
                    id="link-filter"
                    checked={serverConfig?.moderation?.link_filter?.enabled || false}
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
                {serverConfig?.moderation?.link_filter?.enabled && (
                  <div className="ml-6 mt-2">
                    <Select
                      value={serverConfig?.moderation?.link_filter?.config || "all_links"}
                      onValueChange={(value) =>
                        updateServerConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            link_filter: {
                              ...serverConfig.moderation.link_filter,
                              config: value as "all_links" | "whitelist_only" | "phishing_only",
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="bg-black/60 border-white/20 h-8">
                        <SelectValue placeholder="Select Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_links">All Links</SelectItem>
                        <SelectItem value="whitelist_only">Whitelist Only</SelectItem>
                        <SelectItem value="phishing_only">Phishing Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator className="bg-white/20" />

                {/* Bad Word Filter */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="bad-word-filter" className="text-white">
                      Bad Word Filter
                    </Label>
                    <p className="text-sm text-gray-400">Automatically filter and block inappropriate words</p>
                  </div>
                  <Switch
                    id="bad-word-filter"
                    checked={serverConfig?.moderation?.bad_word_filter?.enabled || false}
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

                <Separator className="bg-white/20" />

                {/* Raid Protection */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="raid-protection" className="text-white">
                      Raid Protection
                    </Label>
                    <p className="text-sm text-gray-400">Automatically protect the server from raids</p>
                  </div>
                  <Switch
                    id="raid-protection"
                    checked={serverConfig?.moderation?.raid_protection?.enabled || false}
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

                <Separator className="bg-white/20" />

                {/* Suspicious Accounts */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="suspicious-accounts" className="text-white">
                      Suspicious Accounts
                    </Label>
                    <p className="text-sm text-gray-400">Filter accounts based on age</p>
                  </div>
                  <Switch
                    id="suspicious-accounts"
                    checked={serverConfig?.moderation?.suspicious_accounts?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          suspicious_accounts: { ...serverConfig.moderation.suspicious_accounts, enabled: checked },
                        },
                      })
                    }
                  />
                </div>

                <Separator className="bg-white/20" />

                {/* Auto Role */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-role" className="text-white">
                      Auto Role
                    </Label>
                    <p className="text-sm text-gray-400">Automatically assign a role to new members</p>
                  </div>
                  <Switch
                    id="auto-role"
                    checked={serverConfig?.moderation?.auto_role?.enabled || false}
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
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Support Configuration</h2>
              <div className="flex items-center space-x-4">
                <Button
                  variant={supportView === "overview" ? "secondary" : "ghost"}
                  onClick={() => setSupportView("overview")}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  Overview
                </Button>
                <Button
                  variant={supportView === "staff-insights" ? "secondary" : "ghost"}
                  onClick={() => setSupportView("staff-insights")}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  Staff Insights
                </Button>
                <Button
                  variant={supportView === "tickets" ? "secondary" : "ghost"}
                  onClick={() => setSupportView("tickets")}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  Tickets
                </Button>
              </div>
            </div>
            {renderSupportContent()}
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Event Configuration</h2>
              <div className="flex items-center space-x-4">
                <Button
                  variant={activeEventSection === "overview" ? "secondary" : "ghost"}
                  onClick={() => setActiveEventSection("overview")}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  Overview
                </Button>
                <Button
                  variant={activeEventSection === "automatic-task" ? "secondary" : "ghost"}
                  onClick={() => setActiveEventSection("automatic-task")}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  Automatic Tasks
                </Button>
                <Button
                  variant={activeEventSection === "giveaway" ? "secondary" : "ghost"}
                  onClick={() => setActiveEventSection("giveaway")}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  Giveaway
                </Button>
                <Button
                  variant={activeEventSection === "logger" ? "secondary" : "ghost"}
                  onClick={() => setActiveEventSection("logger")}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  Logger
                </Button>
                <Button
                  variant={activeEventSection === "invite-track" ? "secondary" : "ghost"}
                  onClick={() => setActiveEventSection("invite-track")}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  Invite Track
                </Button>
              </div>
            </div>
            {renderEventContent()}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  Bot Settings
                </CardTitle>
                <CardDescription className="text-gray-400">Customize your bot's profile and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-picture" className="text-white">
                    Profile Picture URL
                  </Label>
                  <Input
                    id="profile-picture"
                    placeholder="Enter URL"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-bot-name" className="text-white">
                    Custom Bot Name
                  </Label>
                  <Input
                    id="custom-bot-name"
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
                  <div className="flex items-center">
                    <Input
                      id="bot-token"
                      type={showToken ? "text" : "password"}
                      placeholder="Enter bot token"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400 mr-2"
                    />
                    <Button variant="outline" size="sm" onClick={() => setShowToken(!showToken)}>
                      {showToken ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSaveBotSettings}>Save Bot Settings</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "admin" && session.user?.email === "admin@admin.com" && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5" />
                  Admin Settings
                </CardTitle>
                <CardDescription className="text-gray-400">Manage application-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode" className="text-white">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-gray-400">
                      Enable or disable maintenance mode for the entire application
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={appSettings?.maintenanceMode?.enabled || false}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Megaphone className="h-5 w-5" />
                  Announcements
                </CardTitle>
                <CardDescription className="text-gray-400">Send announcements to all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter announcement message"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                />
                <Button onClick={handleSendAnnouncement}>Send Announcement</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modals */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="glass-card w-96">
              <CardHeader>
                <CardTitle className="text-white">Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white">This is a sample information modal.</p>
                <Button onClick={() => setShowInfoModal(false)}>Close</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showReputationInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="glass-card w-96">
              <CardHeader>
                <CardTitle className="text-white">Reputation System Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white">Information about the reputation system.</p>
                <Button onClick={() => setShowReputationInfo(false)}>Close</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showEmbedSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="glass-card w-96">
              <CardHeader>
                <CardTitle className="text-white">Ticket Embed Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white">Settings for the ticket embed.</p>
                <Button onClick={() => setShowEmbedSettings(false)}>Close</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showTicketSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="glass-card w-96">
              <CardHeader>
                <CardTitle className="text-white">Ticket Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white">Settings for the ticket system.</p>
                <Button onClick={() => setShowTicketSettings(false)}>Close</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showLockdownWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="glass-card w-96">
              <CardHeader>
                <CardTitle className="text-white">Lockdown Warning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white">
                  Lockdown mode will enable all security features and may disrupt normal server activity. Are you sure
                  you want to proceed?
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setShowLockdownWarning(false)}>
                    Cancel
                  </Button>
                  <Button onClick={confirmLockdown}>Confirm Lockdown</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showFlagStaffWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="glass-card w-96">
              <CardHeader>
                <CardTitle className="text-white">Flag Staff Member</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white">
                  Are you sure you want to flag this staff member? This will reduce their reputation score.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setShowFlagStaffWarning(false)}>
                    Cancel
                  </Button>
                  <Button onClick={confirmFlagStaff}>Confirm Flag</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
