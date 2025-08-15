"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// Define interfaces
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

export function useDashboardState(serverId: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Core state
  const [userData, setUserData] = useState<UserData | null>(null)
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null)
  const [userServers, setUserServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [supportView, setSupportView] = useState<SupportView>("overview")
  const [activeEventSection, setActiveEventSection] = useState<EventView>("overview")

  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showReputationInfo, setShowReputationInfo] = useState(false)
  const [showEmbedSettings, setShowEmbedSettings] = useState(false)
  const [showTicketSettings, setShowTicketSettings] = useState(false)
  const [showLockdownWarning, setShowLockdownWarning] = useState(false)
  const [showFlagStaffWarning, setShowFlagStaffWarning] = useState(false)
  const [staffToFlag, setStaffToFlag] = useState<string | null>(null)
  const [showStaffInsightsModal, setShowStaffInsightsModal] = useState(false)
  const [activeSupportSection, setActiveSupportSection] = useState<"staff" | "tickets" | null>(null)

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

  // Settings state
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const [customBotName, setCustomBotName] = useState("")
  const [botToken, setBotToken] = useState("")
  const [showToken, setShowToken] = useState(false)

  // App settings and announcements
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [newAnnouncement, setNewAnnouncement] = useState("")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Load data on mount
  useEffect(() => {
    if (session && serverId) {
      loadData()
      fetchAppSettings()
      fetchAnnouncements()
    }
  }, [session, serverId])

  // Update bot settings when server config changes
  useEffect(() => {
    if (serverConfig) {
      setProfilePictureUrl(serverConfig.botProfilePictureUrl || "")
      setCustomBotName(serverConfig.customBotName || "")
      setBotToken(serverConfig.botToken || "")
    }
  }, [serverConfig])

  // Data loading functions
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

  // Update server config function
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

  // Utility functions
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

  // Bot settings functions
  const handleSaveBotSettings = async () => {
    await updateServerConfig({
      botProfilePictureUrl: profilePictureUrl,
      customBotName,
      botToken,
    })
  }

  // Announcement functions
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
      }
    } catch (error) {
      console.error("Error downloading user data:", error)
    }
  }

  return {
    // Core state
    session,
    status,
    userData,
    serverConfig,
    userServers,
    loading,
    saving,
    activeTab,
    setActiveTab,
    supportView,
    setSupportView,
    activeEventSection,
    setActiveEventSection,

    // Modal states
    showInfoModal,
    setShowInfoModal,
    showReputationInfo,
    setShowReputationInfo,
    showEmbedSettings,
    setShowEmbedSettings,
    showTicketSettings,
    setShowTicketSettings,
    showLockdownWarning,
    setShowLockdownWarning,
    showFlagStaffWarning,
    setShowFlagStaffWarning,
    staffToFlag,
    setStaffToFlag,
    showStaffInsightsModal,
    setShowStaffInsightsModal,
    activeSupportSection,
    setActiveSupportSection,

    // Giveaway state
    giveawayStep,
    setGiveawayStep,
    giveawayData,
    setGiveawayData,
    generatedLink,
    setGeneratedLink,
    linkCopied,
    setLinkCopied,
    giveawayCreated,
    setGiveawayCreated,

    // Settings state
    profilePictureUrl,
    setProfilePictureUrl,
    customBotName,
    setCustomBotName,
    botToken,
    setBotToken,
    showToken,
    setShowToken,

    // App settings and announcements
    appSettings,
    setAppSettings,
    newAnnouncement,
    setNewAnnouncement,
    announcements,
    setAnnouncements,
    dismissedAnnouncements,
    setDismissedAnnouncements,

    // Functions
    updateServerConfig,
    getRoleName,
    getChannelName,
    handleFlagStaffClick,
    confirmFlagStaff,
    handleMethodSelect,
    handleNextStep,
    handlePrevStep,
    handleCreateGiveaway,
    copyLink,
    resetGiveaway,
    handleSaveBotSettings,
    handleSendAnnouncement,
    handleDismissAnnouncement,
    handleMaintenanceToggle,
    downloadUserData,
    loadData,
    fetchAppSettings,
    fetchAnnouncements,
  }
}
