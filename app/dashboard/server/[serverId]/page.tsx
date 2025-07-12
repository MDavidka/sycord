"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Home,
  Shield,
  LifeBuoy,
  Bell,
  Plug,
  Settings,
  Crown,
  Plus,
  Gift,
  Bot,
  Users,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Search,
  UserPlus,
  Clock,
  CheckCircle,
  Copy,
  ExternalLink,
  ArrowLeft,
  BarChart3,
  Ticket,
  AlertCircle,
  FileText,
  LinkIcon,
  Check,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { v4 as uuidv4 } from "uuid"

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
  server_icon: string
  owner_id: string
  member_count: number
  bot_added: boolean
  premium_features: boolean
  settings: {
    welcome_message_enabled: boolean
    welcome_message_channel: string
    goodbye_message_enabled: boolean
    goodbye_message_channel: string
    default_role: string
    bot_prefix: string
    timezone: string
    language: string
    bot_icon_url: string
  }
  plugins: {
    logger: {
      enabled: boolean
      log_channel: string
      events: {
        message_delete: boolean
        message_edit: boolean
        member_join: boolean
        member_leave: boolean
      }
    }
    giveaway: {
      enabled: boolean
      giveaway_channel: string
      min_entries: number
      auto_reroll: boolean
    }
    invitetrack: {
      enabled: boolean
      invite_log_channel: string
    }
  }
  events: {
    automatic_tasks: {
      enabled: boolean
      tasks: {
        name: string
        type: string
        schedule: string
        channel: string
        message: string
      }[]
    }
    giveaway: {
      enabled: boolean
      giveaways: {
        id: string
        name: string
        description: string
        channel: string
        winners: number
        duration: number // in seconds
        required_roles: string[]
        status: "active" | "ended" | "scheduled"
        entries: string[] // user IDs
        end_time: string
      }[]
    }
    logger: {
      enabled: boolean
      log_channel: string
      events: {
        message_delete: boolean
        message_edit: boolean
        member_join: boolean
        member_leave: boolean
      }
    }
    invitetrack: {
      enabled: boolean
      invite_log_channel: string
    }
  }
}

interface DiscordChannel {
  id: string
  name: string
  type: number // 0 = text, 2 = voice, 4 = category
}

interface DiscordRole {
  id: string
  name: string
}

interface Plugin {
  id: string
  name: string
  description: string
  enabled: boolean
  premium: boolean
}

interface User {
  id: string
  name: string
  email: string
  image: string
  role: "user" | "admin"
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
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
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

  const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([])
  const [discordRoles, setDiscordRoles] = useState<DiscordRole[]>([])
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isBotVerified, setIsBotVerified] = useState(false)
  const [showGiveawayForm, setShowGiveawayForm] = useState(false)
  const [newGiveaway, setNewGiveaway] = useState({
    name: "",
    description: "",
    channel: "",
    winners: 1,
    duration: 3600, // 1 hour in seconds
    required_roles: [] as string[],
    method: "manual", // "manual" or "link"
  })
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  const isAdmin = useMemo(() => {
    const user = session?.user as User
    return user?.role === "admin"
  }, [session])

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
      setProfilePictureUrl(serverConfig.settings?.bot_icon_url || "")
      setCustomBotName(serverConfig.server_name || "")
      setBotToken("")
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
          settings: {
            welcome_message_enabled: configData.server.settings?.welcome_message_enabled ?? false,
            welcome_message_channel: configData.server.settings?.welcome_message_channel ?? "",
            goodbye_message_enabled: configData.server.settings?.goodbye_message_enabled ?? false,
            goodbye_message_channel: configData.server.settings?.goodbye_message_channel ?? "",
            default_role: configData.server.settings?.default_role ?? "",
            bot_prefix: configData.server.settings?.bot_prefix ?? "!",
            timezone: configData.server.settings?.timezone ?? "UTC",
            language: configData.server.settings?.language ?? "en",
            bot_icon_url: configData.server.settings?.bot_icon_url ?? "/new-bot-logo.png",
          },
          plugins: {
            logger: {
              enabled: configData.server.plugins?.logger?.enabled ?? false,
              log_channel: configData.server.plugins?.logger?.log_channel ?? "",
              events: {
                message_delete: configData.server.plugins?.logger?.events?.message_delete ?? false,
                message_edit: configData.server.plugins?.logger?.events?.message_edit ?? false,
                member_join: configData.server.plugins?.logger?.events?.member_join ?? false,
                member_leave: configData.server.plugins?.logger?.events?.member_leave ?? false,
              },
            },
            giveaway: {
              enabled: configData.server.plugins?.giveaway?.enabled ?? false,
              giveaway_channel: configData.server.plugins?.giveaway?.giveaway_channel ?? "",
              min_entries: configData.server.plugins?.giveaway?.min_entries ?? 5,
              auto_reroll: configData.server.plugins?.giveaway?.auto_reroll ?? false,
            },
            invitetrack: {
              enabled: configData.server.plugins?.invitetrack?.enabled ?? false,
              invite_log_channel: configData.server.plugins?.invitetrack?.invite_log_channel ?? "",
            },
          },
          events: {
            automatic_tasks: {
              enabled: configData.server.events?.automatic_tasks?.enabled ?? false,
              tasks: configData.server.events?.automatic_tasks?.tasks ?? [],
            },
            giveaway: {
              enabled: configData.server.events?.giveaway?.enabled ?? false,
              giveaways: configData.server.events?.giveaway?.giveaways ?? [],
            },
            logger: {
              enabled: configData.server.events?.logger?.enabled ?? false,
              log_channel: configData.server.events?.logger?.log_channel ?? "",
              events: {
                message_delete: configData.server.events?.logger?.events?.message_delete ?? false,
                message_edit: configData.server.events?.logger?.events?.message_edit ?? false,
                member_join: configData.server.events?.logger?.events?.member_join ?? false,
                member_leave: configData.server.events?.logger?.events?.member_leave ?? false,
              },
            },
            invitetrack: {
              enabled: configData.server.events?.invitetrack?.enabled ?? false,
              invite_log_channel: configData.server.events?.invitetrack?.invite_log_channel ?? "",
            },
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
        } as any
        setServerConfig(initialConfig)
        setUserData(configData.user)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!serverId) return

    const fetchServerData = async () => {
      try {
        const [serverRes, channelsRes, rolesRes, pluginsRes, userPluginsRes, verifyBotRes] = await Promise.all([
          fetch(`/api/servers?serverId=${serverId}`),
          fetch(`/api/discord/channels/${serverId}`),
          fetch(`/api/discord/roles/${serverId}`),
          fetch("/api/plugins"),
          fetch("/api/user-plugins"),
          fetch(`/api/verify-bot/${serverId}`),
        ])

        const serverData = await serverRes.json()
        const channelsData = await channelsRes.json()
        const rolesData = await rolesRes.json()
        const pluginsData = await pluginsRes.json()
        const userPluginsData = await userPluginsRes.json()
        const verifyBotData = await verifyBotRes.json()

        setServerConfig(serverData)
        setDiscordChannels(channelsData)
        setDiscordRoles(rolesData)
        setPlugins(pluginsData)
        setUserPlugins(userPluginsData.plugins || [])
        setIsBotVerified(verifyBotData.verified)
      } catch (error) {
        console.error("Failed to fetch server data:", error)
        toast.error("Failed to load server configuration.")
      }
    }

    fetchServerData()
  }, [serverId])

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

  const handleCreateGiveaway = async () => {
    if (!serverConfig) return

    setIsSaving(true)
    try {
      if (newGiveaway.method === "web") {
        const res = await fetch("/api/giveaways", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serverId: serverId,
            ...newGiveaway,
            end_time: new Date(Date.now() + newGiveaway.duration * 1000).toISOString(),
            status: "active",
            entries: [],
          }),
        })

        if (res.ok) {
          const { giveawayId } = await res.json()
          setGeneratedLink(`/g/${giveawayId}`) // Simulate sycord.com domain
          toast.success("Giveaway created on web successfully!")
          setShowGiveawayForm(false)
          setNewGiveaway({
            name: "",
            description: "",
            channel: "",
            winners: 1,
            duration: 3600,
            required_roles: [],
            method: "manual",
          })
        } else {
          toast.error("Failed to create giveaway on web.")
        }
      } else {
        // Manual giveaway creation logic (existing)
        const updatedGiveaways = [
          ...(serverConfig.events.giveaway.giveaways || []),
          {
            id: uuidv4(),
            name: newGiveaway.name,
            description: newGiveaway.description,
            channel: newGiveaway.channel,
            winners: newGiveaway.winners,
            duration: newGiveaway.duration,
            required_roles: newGiveaway.required_roles,
            status: "active",
            entries: [],
            end_time: new Date(Date.now() + newGiveaway.duration * 1000).toISOString(),
          },
        ]

        const res = await fetch(`/api/settings/${serverId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...serverConfig.settings, // Keep existing settings
            events: {
              ...serverConfig.events,
              giveaway: {
                ...serverConfig.events.giveaway,
                giveaways: updatedGiveaways,
              },
            },
          }),
        })

        if (res.ok) {
          setServerConfig((prev) =>
            prev
              ? {
                  ...prev,
                  events: {
                    ...prev.events,
                    giveaway: {
                      ...prev.events.giveaway,
                      giveaways: updatedGiveaways,
                    },
                  },
                }
              : null,
          )
          toast.success("Giveaway created successfully!")
          setShowGiveawayForm(false)
          setNewGiveaway({
            name: "",
            description: "",
            channel: "",
            winners: 1,
            duration: 3600,
            required_roles: [],
            method: "manual",
          })
        } else {
          toast.error("Failed to create giveaway.")
        }
      }
    } catch (error) {
      console.error("Error creating giveaway:", error)
      toast.error("An error occurred while creating giveaway.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(`https://sycord.com${generatedLink}`)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleSaveSettings = async () => {
    if (!serverConfig) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/settings/${serverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serverConfig.settings),
      })

      if (res.ok) {
        toast.success("Settings saved successfully!")
      } else {
        toast.error("Failed to save settings.")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("An error occurred while saving settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePluginToggle = async (pluginId: string, enabled: boolean) => {
    if (!serverConfig) return

    setIsSaving(true)
    try {
      const updatedPlugins = enabled ? [...userPlugins, pluginId] : userPlugins.filter((id) => id !== pluginId)

      const res = await fetch("/api/user-plugins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId, plugins: updatedPlugins }),
      })

      if (res.ok) {
        setUserPlugins(updatedPlugins)
        toast.success(`Plugin ${enabled ? "enabled" : "disabled"} successfully!`)
      } else {
        toast.error(`Failed to ${enabled ? "enable" : "disable"} plugin.`)
      }
    } catch (error) {
      console.error("Error toggling plugin:", error)
      toast.error("An error occurred while toggling plugin.")
    } finally {
      setIsSaving(false)
    }
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
                <ArrowLeft className="h-4 w-4" />
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
                <ArrowLeft className="h-4 w-4" />
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
                      <Users className="h-6 w-6 text-blue-400" />
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
                      <MessageSquare className="h-6 w-6 text-purple-400" />
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
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview
            </Button>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Clock className="h-6 w-6 mr-3" /> Automatic Tasks
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
                      <Plus className="h-4 w-4 mr-2" /> Add New Task
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
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview
            </Button>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Gift className="h-6 w-6 mr-3" /> Giveaway System
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
                        onClick={() => handleMethodSelect("link")} // This is now "Create on Web"
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        Create on Web
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
                      {giveawayData.method === "link" && ( // This is now "Create on Web"
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
                    {giveawayData.method === "link" && ( // This is now "Create on Web"
                      <div className="space-y-2">
                        <p className="text-gray-400">Share this link with your community:</p>
                        <div className="flex items-center justify-between bg-black/60 border-white/20 rounded-md p-2">
                          <Input readOnly value={generatedLink} className="bg-transparent border-none text-white" />
                          <Button onClick={handleCopyLink} className="bg-white text-black hover:bg-gray-100">
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview
            </Button>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <FileText className="h-6 w-6 mr-3" /> Logger
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
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview
            </Button>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <LinkIcon className="h-6 w-6 mr-3" /> Invite Tracker
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
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-400" />
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
                    <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-pink-400" />
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
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-400" />
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
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <LinkIcon className="h-6 w-6 text-blue-400" />
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
    return <div className="flex h-full items-center justify-center">Loading server configuration...</div>
  }

  if (!session || !serverConfig) {
    return null
  }

  const botIconUrl = serverConfig.settings?.bot_icon_url || "/new-bot-logo.png"

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center space-x-4 p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={serverConfig.server_icon || "/placeholder-logo.png"}
            alt={`${serverConfig.server_name} icon`}
          />
          <AvatarFallback>{serverConfig.server_name ? serverConfig.server_name.charAt(0) : "S"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{serverConfig.server_name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{serverConfig.member_count} Members</p>
          {serverConfig.premium_features && (
            <Badge variant="secondary" className="mt-1">
              Premium
            </Badge>
          )}
        </div>
        <div className="ml-auto flex items-center space-x-2">
          {isBotVerified ? (
            <Badge className="bg-green-500 hover:bg-green-500/80">Bot Verified</Badge>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary">Verify Bot</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Verify Bot</AlertDialogTitle>
                  <AlertDialogDescription>
                    To enable all features, please ensure the bot is added to your server and has the necessary
                    permissions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <a
                      href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&scope=bot&permissions=8&guild_id=${serverId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Add Bot to Server
                    </a>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="secondary">Invite Bot</Button>
        </div>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
        <div className="w-full overflow-x-auto border-b">
          <TabsList className="flex h-auto justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="home"
              className="flex-col gap-1 rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent"
            >
              <Home className="h-5 w-5" />
              Home
            </TabsTrigger>
            <TabsTrigger
              value="sentinel"
              className="flex-col gap-1 rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent"
            >
              <Shield className="h-5 w-5" />
              Sentinel
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="flex-col gap-1 rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent"
            >
              <LifeBuoy className="h-5 w-5" />
              Support
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="flex-col gap-1 rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent"
            >
              <Bell className="h-5 w-5" />
              Events
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="flex-col gap-1 rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent"
            >
              <Plug className="h-5 w-5" />
              Integrations
            </TabsTrigger>
            <TabsTrigger
              value="plugins"
              className="flex-col gap-1 rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent"
            >
              <Plug className="h-5 w-5" />
              Plugins
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-col gap-1 rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent"
            >
              <Settings className="h-5 w-5" />
              Settings
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="access-plus"
                className="flex-col gap-1 rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent"
              >
                <Crown className="h-5 w-5" />
                Access+
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="home" className="flex-1 p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{serverConfig.member_count}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,345</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">+15% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Plugins</CardTitle>
                <Plug className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userPlugins.length}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Out of {plugins.length} available</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Member Join</TableCell>
                  <TableCell>John Doe joined the server.</TableCell>
                  <TableCell>2 hours ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Message Delete</TableCell>
                  <TableCell>A message was deleted in #general.</TableCell>
                  <TableCell>5 hours ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Giveaway Ended</TableCell>
                  <TableCell>Daily Nitro giveaway ended.</TableCell>
                  <TableCell>1 day ago</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sentinel" className="flex-1 p-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Anti-Spam</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="anti-spam-enabled">Enable Anti-Spam</Label>
                  <Switch id="anti-spam-enabled" />
                </div>
                <div>
                  <Label htmlFor="spam-threshold">Spam Threshold</Label>
                  <Input id="spam-threshold" type="number" defaultValue={5} />
                </div>
                <div>
                  <Label htmlFor="spam-action">Action on Spam</Label>
                  <Select defaultValue="mute">
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mute">Mute User</SelectItem>
                      <SelectItem value="kick">Kick User</SelectItem>
                      <SelectItem value="ban">Ban User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Moderation Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mod-logs-enabled">Enable Moderation Logs</Label>
                  <Switch id="mod-logs-enabled" />
                </div>
                <div>
                  <Label htmlFor="mod-log-channel">Log Channel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {discordChannels
                        .filter((c) => c.type === 0)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Logged Events</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="log-kick" />
                      <Label htmlFor="log-kick">Kicks</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="log-ban" />
                      <Label htmlFor="log-ban">Bans</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="log-mute" />
                      <Label htmlFor="log-mute">Mutes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="log-warn" />
                      <Label htmlFor="log-warn">Warnings</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="support" className="flex-1 p-4">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Card className="bg-gray-50 dark:bg-gray-800">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Ticket System</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage support tickets directly within Discord.
                    </p>
                    <Button variant="link" className="mt-2 p-0">
                      Configure <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 dark:bg-gray-800">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">FAQ & Knowledge Base</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set up automated responses for common questions.
                    </p>
                    <Button variant="link" className="mt-2 p-0">
                      Configure <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 dark:bg-gray-800">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Live Chat Integration</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect with external live chat platforms.
                    </p>
                    <Button variant="link" className="mt-2 p-0">
                      Configure <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="support-channel">Primary Support Channel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {discordChannels
                        .filter((c) => c.type === 0)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ticket-category">Ticket Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {discordChannels
                        .filter((c) => c.type === 4)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="events" className="flex-1 p-4">
          {!selectedEvent ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedEvent("automatic_tasks")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Automatic Tasks</CardTitle>
                  <Calendar className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Schedule messages, role assignments, and more.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedEvent("giveaway")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Giveaway</CardTitle>
                  <Gift className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create and manage engaging giveaways for your members.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedEvent("logger")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Logger</CardTitle>
                  <Search className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track server events like message edits, deletes, and member changes.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedEvent("invitetrack")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Invite Track</CardTitle>
                  <UserPlus className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor and track invites to see who's bringing in new members.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Events Overview
              </Button>

              {selectedEvent === "automatic_tasks" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Automatic Tasks Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-tasks-enabled">Enable Automatic Tasks</Label>
                      <Switch
                        id="auto-tasks-enabled"
                        checked={serverConfig.events.automatic_tasks.enabled}
                        onCheckedChange={(checked) =>
                          setServerConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  events: {
                                    ...prev.events,
                                    automatic_tasks: {
                                      ...prev.events.automatic_tasks,
                                      enabled: checked,
                                    },
                                  },
                                }
                              : null,
                          )
                        }
                      />
                    </div>
                    <Separator />
                    <h3 className="text-lg font-semibold">Scheduled Tasks</h3>
                    {serverConfig.events.automatic_tasks.tasks.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No tasks configured yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Schedule</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serverConfig.events.automatic_tasks.tasks.map((task, i) => (
                            <TableRow key={i}>
                              <TableCell>{task.name}</TableCell>
                              <TableCell>{task.type}</TableCell>
                              <TableCell>{task.schedule}</TableCell>
                              <TableCell>{discordChannels.find((c) => c.id === task.channel)?.name}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm">
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <Button variant="outline" className="mt-4 bg-transparent">
                      <Plus className="mr-2 h-4 w-4" /> Add New Task
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedEvent === "giveaway" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Giveaway Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="giveaway-enabled">Enable Giveaway Module</Label>
                      <Switch
                        id="giveaway-enabled"
                        checked={serverConfig.events.giveaway.enabled}
                        onCheckedChange={(checked) =>
                          setServerConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  events: {
                                    ...prev.events,
                                    giveaway: {
                                      ...prev.events.giveaway,
                                      enabled: checked,
                                    },
                                  },
                                }
                              : null,
                          )
                        }
                      />
                    </div>
                    <Separator />
                    <h3 className="text-lg font-semibold">Current Giveaways</h3>
                    {serverConfig.events.giveaway.giveaways.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No active giveaways.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Winners</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serverConfig.events.giveaway.giveaways.map((gw) => (
                            <TableRow key={gw.id}>
                              <TableCell>{gw.name}</TableCell>
                              <TableCell>{discordChannels.find((c) => c.id === gw.channel)?.name}</TableCell>
                              <TableCell>{gw.winners}</TableCell>
                              <TableCell>
                                <Badge variant={gw.status === "active" ? "default" : "secondary"}>{gw.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                                <Button variant="ghost" size="sm">
                                  End
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setShowGiveawayForm(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Create New Giveaway
                    </Button>

                    {showGiveawayForm && (
                      <Card className="mt-4 p-4">
                        <CardTitle className="mb-4">New Giveaway</CardTitle>
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="giveaway-name">Giveaway Name</Label>
                            <Input
                              id="giveaway-name"
                              value={newGiveaway.name}
                              onChange={(e) => setNewGiveaway({ ...newGiveaway, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="giveaway-description">Description</Label>
                            <Textarea
                              id="giveaway-description"
                              value={newGiveaway.description}
                              onChange={(e) =>
                                setNewGiveaway({
                                  ...newGiveaway,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="giveaway-channel">Channel</Label>
                            <Select
                              value={newGiveaway.channel}
                              onValueChange={(value) => setNewGiveaway({ ...newGiveaway, channel: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select channel" />
                              </SelectTrigger>
                              <SelectContent>
                                {discordChannels
                                  .filter((c) => c.type === 0)
                                  .map((channel) => (
                                    <SelectItem key={channel.id} value={channel.id}>
                                      #{channel.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="giveaway-winners">Number of Winners</Label>
                            <Input
                              id="giveaway-winners"
                              type="number"
                              value={newGiveaway.winners}
                              onChange={(e) =>
                                setNewGiveaway({
                                  ...newGiveaway,
                                  winners: Number.parseInt(e.target.value),
                                })
                              }
                              min={1}
                            />
                          </div>
                          <div>
                            <Label htmlFor="giveaway-duration">Duration (seconds)</Label>
                            <Input
                              id="giveaway-duration"
                              type="number"
                              value={newGiveaway.duration}
                              onChange={(e) =>
                                setNewGiveaway({
                                  ...newGiveaway,
                                  duration: Number.parseInt(e.target.value),
                                })
                              }
                              min={60}
                            />
                          </div>
                          <div>
                            <Label htmlFor="giveaway-method">Creation Method</Label>
                            <Select
                              value={newGiveaway.method}
                              onValueChange={(value) => setNewGiveaway({ ...newGiveaway, method: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manual">Manual (Discord)</SelectItem>
                                <SelectItem value="web">Create on Web</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {generatedLink && newGiveaway.method === "web" && (
                            <div className="flex items-center space-x-2">
                              <Input value={`https://sycord.com${generatedLink}`} readOnly className="flex-1" />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy Link</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" asChild>
                                      <a
                                        href={`https://sycord.com${generatedLink}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Open Link</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowGiveawayForm(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateGiveaway} disabled={isSaving}>
                              {isSaving ? "Creating..." : "Create Giveaway"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedEvent === "logger" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Logger Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="logger-enabled">Enable Logger Module</Label>
                      <Switch
                        id="logger-enabled"
                        checked={serverConfig.events.logger.enabled}
                        onCheckedChange={(checked) =>
                          setServerConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  events: {
                                    ...prev.events,
                                    logger: {
                                      ...prev.events.logger,
                                      enabled: checked,
                                    },
                                  },
                                }
                              : null,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="log-channel">Log Channel</Label>
                      <Select
                        value={serverConfig.events.logger.log_channel}
                        onValueChange={(value) =>
                          setServerConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  events: {
                                    ...prev.events,
                                    logger: {
                                      ...prev.events.logger,
                                      log_channel: value,
                                    },
                                  },
                                }
                              : null,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select log channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {discordChannels
                            .filter((c) => c.type === 0)
                            .map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                #{channel.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <h3 className="text-lg font-semibold">Logged Events</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log-message-delete">Message Delete</Label>
                        <Switch
                          id="log-message-delete"
                          checked={serverConfig.events.logger.events.message_delete}
                          onCheckedChange={(checked) =>
                            setServerConfig((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    events: {
                                      ...prev.events,
                                      logger: {
                                        ...prev.events.logger,
                                        events: {
                                          ...prev.events.logger.events,
                                          message_delete: checked,
                                        },
                                      },
                                    },
                                  }
                                : null,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log-message-edit">Message Edit</Label>
                        <Switch
                          id="log-message-edit"
                          checked={serverConfig.events.logger.events.message_edit}
                          onCheckedChange={(checked) =>
                            setServerConfig((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    events: {
                                      ...prev.events,
                                      logger: {
                                        ...prev.events.logger,
                                        events: {
                                          ...prev.events.logger.events,
                                          message_edit: checked,
                                        },
                                      },
                                    },
                                  }
                                : null,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log-member-join">Member Join</Label>
                        <Switch
                          id="log-member-join"
                          checked={serverConfig.events.logger.events.member_join}
                          onCheckedChange={(checked) =>
                            setServerConfig((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    events: {
                                      ...prev.events,
                                      logger: {
                                        ...prev.events.logger,
                                        events: {
                                          ...prev.events.logger.events,
                                          member_join: checked,
                                        },
                                      },
                                    },
                                  }
                                : null,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log-member-leave">Member Leave</Label>
                        <Switch
                          id="log-member-leave"
                          checked={serverConfig.events.logger.events.member_leave}
                          onCheckedChange={(checked) =>
                            setServerConfig((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    events: {
                                      ...prev.events,
                                      logger: {
                                        ...prev.events.logger,
                                        events: {
                                          ...prev.events.logger.events,
                                          member_leave: checked,
                                        },
                                      },
                                    },
                                  }
                                : null,
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedEvent === "invitetrack" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Track Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="invite-track-enabled">Enable Invite Tracker</Label>
                      <Switch
                        id="invite-track-enabled"
                        checked={serverConfig.events.invitetrack.enabled}
                        onCheckedChange={(checked) =>
                          setServerConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  events: {
                                    ...prev.events,
                                    invitetrack: {
                                      ...prev.events.invitetrack,
                                      enabled: checked,
                                    },
                                  },
                                }
                              : null,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="invite-log-channel">Invite Log Channel</Label>
                      <Select
                        value={serverConfig.events.invitetrack.invite_log_channel}
                        onValueChange={(value) =>
                          setServerConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  events: {
                                    ...prev.events,
                                    invitetrack: {
                                      ...prev.events.invitetrack,
                                      invite_log_channel: value,
                                    },
                                  },
                                }
                              : null,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select log channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {discordChannels
                            .filter((c) => c.type === 0)
                            .map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                #{channel.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="flex-1 p-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>YouTube Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="youtube-enabled">Enable YouTube Notifications</Label>
                  <Switch id="youtube-enabled" />
                </div>
                <div>
                  <Label htmlFor="youtube-channel-id">YouTube Channel ID</Label>
                  <Input id="youtube-channel-id" placeholder="UC..." />
                </div>
                <div>
                  <Label htmlFor="youtube-notification-channel">Notification Channel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {discordChannels
                        .filter((c) => c.type === 0)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Twitch Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twitch-enabled">Enable Twitch Notifications</Label>
                  <Switch id="twitch-enabled" />
                </div>
                <div>
                  <Label htmlFor="twitch-channel-name">Twitch Channel Name</Label>
                  <Input id="twitch-channel-name" placeholder="yourchannel" />
                </div>
                <div>
                  <Label htmlFor="twitch-notification-channel">Notification Channel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {discordChannels
                        .filter((c) => c.type === 0)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="plugins" className="flex-1 p-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plugins.map((plugin) => (
              <Card key={plugin.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plugin.name}
                    {plugin.premium && (
                      <Badge variant="secondary" className="ml-2">
                        Premium
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{plugin.description}</p>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`plugin-${plugin.id}`}>Enable Plugin</Label>
                    <Switch
                      id={`plugin-${plugin.id}`}
                      checked={userPlugins.includes(plugin.id)}
                      onCheckedChange={(checked) => handlePluginToggle(plugin.id, checked)}
                      disabled={plugin.premium && !serverConfig.premium_features}
                    />
                  </div>
                  {plugin.premium && !serverConfig.premium_features && (
                    <p className="text-xs text-red-500">Requires premium features to enable.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bot-prefix">Bot Prefix</Label>
                  <Input
                    id="bot-prefix"
                    value={serverConfig.settings?.bot_prefix || "!"}
                    onChange={(e) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                bot_prefix: e.target.value,
                              },
                            }
                          : null,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="default-role">Default Role for New Members</Label>
                  <Select
                    value={serverConfig.settings?.default_role || ""}
                    onValueChange={(value) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: { ...prev.settings, default_role: value },
                            }
                          : null,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {discordRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={serverConfig.settings?.timezone || "UTC"}
                    onValueChange={(value) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: { ...prev.settings, timezone: value },
                            }
                          : null,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                      {/* Add more timezones as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={serverConfig.settings?.language || "en"}
                    onValueChange={(value) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: { ...prev.settings, language: value },
                            }
                          : null,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      {/* Add more languages as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bot-icon-url">Bot Icon URL</Label>
                  <Input
                    id="bot-icon-url"
                    value={botIconUrl}
                    onChange={(e) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                bot_icon_url: e.target.value,
                              },
                            }
                          : null,
                      )
                    }
                    placeholder="https://example.com/bot-icon.png"
                  />
                  <div className="mt-2 flex items-center space-x-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={botIconUrl || "/placeholder.svg"} alt="Bot Icon Preview" />
                      <AvatarFallback>
                        <Bot className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Preview</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Welcome & Goodbye Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="welcome-message-enabled">Enable Welcome Message</Label>
                  <Switch
                    id="welcome-message-enabled"
                    checked={serverConfig.settings?.welcome_message_enabled || false}
                    onCheckedChange={(checked) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                welcome_message_enabled: checked,
                              },
                            }
                          : null,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="welcome-message-channel">Welcome Message Channel</Label>
                  <Select
                    value={serverConfig.settings?.welcome_message_channel || ""}
                    onValueChange={(value) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                welcome_message_channel: value,
                              },
                            }
                          : null,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {discordChannels
                        .filter((c) => c.type === 0)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="goodbye-message-enabled">Enable Goodbye Message</Label>
                  <Switch
                    id="goodbye-message-enabled"
                    checked={serverConfig.settings?.goodbye_message_enabled || false}
                    onCheckedChange={(checked) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                goodbye_message_enabled: checked,
                              },
                            }
                          : null,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="goodbye-message-channel">Goodbye Message Channel</Label>
                  <Select
                    value={serverConfig.settings?.goodbye_message_channel || ""}
                    onValueChange={(value) =>
                      setServerConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                goodbye_message_channel: value,
                              },
                            }
                          : null,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {discordChannels
                        .filter((c) => c.type === 0)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="access-plus" className="flex-1 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Access+ Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  These features are only available to administrators for advanced server management and debugging.
                </p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="raw-config-editor">Raw Configuration Editor</Label>
                  <Button variant="outline">Open Editor</Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bot-command-logs">Bot Command Logs</Label>
                  <Button variant="outline">View Logs</Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="force-sync">Force Server Sync</Label>
                  <Button variant="destructive">Sync Now</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
