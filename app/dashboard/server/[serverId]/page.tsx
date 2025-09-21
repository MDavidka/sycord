"use client"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Shield,
  LinkIcon,
  ChevronDown,
  Home,
  Plus,
  ArrowLeft,
  Clock,
  Eye,
  Zap,
  Crown,
  Package,
  Settings,
  Megaphone,
  LifeBuoy,
  CheckCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import PluginsTab from "@/components/plugins-tab"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { useDashboardState } from "./hooks/useDashboardState"
import HomeTab from "./components/HomeTab"
import SentinelTab from "./components/SentinelTab"
import SupportTab from "./components/SupportTab"
import FunctionsTab from "./components/FunctionsTab"
import IntegrationsTab from "./components/IntegrationsTab"
import SettingsTab from "./components/SettingsTab"

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
  const params = useParams()
  const serverId = params.serverId as string

  const {
    session,
    status,
    userData,
    serverConfig,
    userServers,
    loading,
    activeTab,
    setActiveTab,
    supportView,
    setSupportView,
    activeEventSection,
    setActiveEventSection,
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
    profilePictureUrl,
    setProfilePictureUrl,
    customBotName,
    setCustomBotName,
    botToken,
    setBotToken,
    showToken,
    setShowToken,
    appSettings,
    setAppSettings,
    newAnnouncement,
    setNewAnnouncement,
    announcements,
    setAnnouncements,
    dismissedAnnouncements,
    setDismissedAnnouncements,
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
  } = useDashboardState(serverId)

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
      <header className="glass-card border-b border-white/10 sticky -top-4 z-50 -mt-4">
        <div className="container mx-auto px-4 py-3 pt-8">
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
              <Zap className="h-4 w-4 mr-2" />
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
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {activeTab === "home" && (
          <HomeTab
            serverConfig={serverConfig}
            updateServerConfig={updateServerConfig}
            announcements={announcements}
            dismissedAnnouncements={dismissedAnnouncements}
            handleDismissAnnouncement={handleDismissAnnouncement}
            serverId={serverId}
          />
        )}

        {activeTab === "sentinel" && (
          <SentinelTab serverConfig={serverConfig} updateServerConfig={updateServerConfig} />
        )}

        {activeTab === "support" && (
          <SupportTab
            serverConfig={serverConfig}
            updateServerConfig={updateServerConfig}
            activeSupportSection={activeSupportSection}
            setActiveSupportSection={setActiveSupportSection}
            showReputationInfo={showReputationInfo}
            setShowReputationInfo={setShowReputationInfo}
            showEmbedSettings={showEmbedSettings}
            setShowEmbedSettings={setShowEmbedSettings}
            showFlagStaffWarning={showFlagStaffWarning}
            setShowFlagStaffWarning={setShowFlagStaffWarning}
            handleFlagStaffClick={handleFlagStaffClick}
            confirmFlagStaff={confirmFlagStaff}
            getChannelName={getChannelName}
          />
        )}

        {activeTab === "events" && (
          <FunctionsTab
            serverConfig={serverConfig}
            updateServerConfig={updateServerConfig}
            activeEventSection={activeEventSection}
            setActiveEventSection={setActiveEventSection}
            setActiveTab={setActiveTab}
            giveawayStep={giveawayStep}
            setGiveawayStep={setGiveawayStep}
            giveawayData={giveawayData}
            setGiveawayData={setGiveawayData}
            generatedLink={generatedLink}
            setGeneratedLink={setGeneratedLink}
            linkCopied={linkCopied}
            setLinkCopied={setLinkCopied}
            giveawayCreated={giveawayCreated}
            setGiveawayCreated={setGiveawayCreated}
            handleMethodSelect={handleMethodSelect}
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            handleCreateGiveaway={handleCreateGiveaway}
            copyLink={copyLink}
            resetGiveaway={resetGiveaway}
          />
        )}

        {activeTab === "integrations" && <IntegrationsTab />}

        {activeTab === "plugins" && (
          <PluginsTab serverId={serverId} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            profilePictureUrl={profilePictureUrl}
            setProfilePictureUrl={setProfilePictureUrl}
            customBotName={customBotName}
            setCustomBotName={setCustomBotName}
            botToken={botToken}
            setBotToken={setBotToken}
            showToken={showToken}
            setShowToken={setShowToken}
            handleSaveBotSettings={handleSaveBotSettings}
            downloadUserData={downloadUserData}
            serverId={serverId}
          />
        )}

        {/* Access+ Tab - Keep inline since it's admin-only */}
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

      <Dialog open={showStaffInsightsModal} onOpenChange={setShowStaffInsightsModal}>
        <DialogContent className="glass-card max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">How Staff Insights & Reputation Works</DialogTitle>
            <DialogDescription className="text-gray-400">
              Learn how to effectively use staff monitoring and reputation systems
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Block 1: Overview */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Overview</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Staff Insights monitors your team's performance, response times, and activity patterns. It provides
                  real-time analytics to help you understand how your staff is performing and identify areas for
                  improvement.
                </p>
              </CardContent>
            </Card>

            {/* Block 2: Reputation System */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Reputation System</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The reputation system tracks staff performance with scores from 0-20. Higher scores indicate better
                  performance, faster response times, and positive user feedback. Staff can earn reputation through
                  helpful responses and lose it for poor performance.
                </p>
              </CardContent>
            </Card>

            {/* Block 3: Getting Started */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Getting Started</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Enable Staff Insights in the Sentinel tab, then configure your staff roles. The system will
                  automatically start tracking performance metrics. Use the analytics to identify top performers and
                  provide targeted training where needed.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="mt-6">
            <Button onClick={() => setShowStaffInsightsModal(false)} className="bg-white text-black hover:bg-gray-100">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
