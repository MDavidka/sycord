
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
import {
Shield,
MessageSquare,
Gift,
LinkIcon,
Filter,
Hash,
ChevronDown,
Home,
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
Megaphone,
Flag,
LifeBuoy,
Download,
Ticket,
BarChart3,
CheckCircle,
AlertCircle,
Mail,
Server,
Activity,
} from "lucide-react"
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

// Add NodePerformance interface
interface NodePerformance {
_id: string
serverName: string
loadPercentage: number
lastUpdated: Date
status: 'online' | 'offline' | 'warning'
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

// Add nodes performance state
const [nodePerformance, setNodePerformance] = useState<NodePerformance[]>([])
const [nodesLoading, setNodesLoading] = useState(false)

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
    fetchNodesPerformance() // Add nodes performance fetch
  }
}, [session, serverId])

useEffect(() => {
  if (serverConfig) {
    setProfilePictureUrl(serverConfig.botProfilePictureUrl || "")
    setCustomBotName(serverConfig.customBotName || "")
    setBotToken(serverConfig.botToken || "")
  }
}, [serverConfig])

// Auto-refresh nodes performance every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (session && serverId && activeTab === "nodes-performance") {
      fetchNodesPerformance()
    }
  }, 30000)

  return () => clearInterval(interval)
}, [session, serverId, activeTab])

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

// Add nodes performance fetch function
const fetchNodesPerformance = async () => {
  if (!session || !serverId) return

  setNodesLoading(true)
  try {
    const response = await fetch(`/api/nodes-performance/${serverId}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      setNodePerformance(data.nodes || [])
    } else {
      console.error('Failed to fetch nodes performance')
    }
  } catch (error) {
    console.error('Error fetching nodes performance:', error)
  } finally {
    setNodesLoading(false)
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

// Helper functions for nodes performance
const getLoadColor = (percentage: number) => {
  if (percentage >= 90) return 'text-red-500'
  if (percentage >= 70) return 'text-yellow-500'
  return 'text-green-500'
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'online': return 'default'
    case 'warning': return 'secondary'
    case 'offline': return 'destructive'
    default: return 'outline'
  }
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
