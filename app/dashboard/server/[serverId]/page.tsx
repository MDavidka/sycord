"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Home,
  Shield,
  Ticket,
  Gift,
  Bot,
  Bell,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Lock,
  Crown,
  List,
  ImageIcon,
  Package,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import PluginsTab from "@/components/plugins-tab"
import type { ServerConfig, DiscordRole, DiscordChannel, DiscordGuild } from "@/lib/types"

export default function ServerConfigPage() {
  const params = useParams()
  const serverId = params.serverId as string
  const { data: session } = useSession()
  const isAdmin = session?.user?.email === "dmarton336@gmail.com"

  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null)
  const [discordRoles, setDiscordRoles] = useState<DiscordRole[]>([])
  const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([])
  const [discordGuild, setDiscordGuild] = useState<DiscordGuild | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("home")
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("")
  const [isAnnouncementLoading, setIsAnnouncementLoading] = useState(false)

  useEffect(() => {
    if (serverId) {
      fetchServerConfig()
      fetchDiscordData()
      fetchAnnouncements()
    }
  }, [serverId])

  const fetchServerConfig = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/settings/${serverId}`)
      if (response.ok) {
        const data = await response.json()
        setServerConfig(data.serverConfig)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch server configuration.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const fetchDiscordData = async () => {
    try {
      const [rolesRes, channelsRes, guildRes] = await Promise.all([
        fetch(`/api/discord/roles/${serverId}`),
        fetch(`/api/discord/channels/${serverId}`),
        fetch(`/api/discord/guilds`),
      ])

      if (rolesRes.ok) {
        const data = await rolesRes.json()
        setDiscordRoles(data.roles)
      } else {
        console.error("Failed to fetch Discord roles")
      }

      if (channelsRes.ok) {
        const data = await channelsRes.json()
        setDiscordChannels(data.channels)
      } else {
        console.error("Failed to fetch Discord channels")
      }

      if (guildRes.ok) {
        const data = await guildRes.json()
        const currentGuild = data.guilds.find((g: DiscordGuild) => g.id === serverId)
        setDiscordGuild(currentGuild || null)
      } else {
        console.error("Failed to fetch Discord guilds")
      }
    } catch (err) {
      console.error("Error fetching Discord data:", err)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`/api/announcements?serverId=${serverId}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements)
      } else {
        console.error("Failed to fetch announcements")
      }
    } catch (error) {
      console.error("Error fetching announcements:", error)
    }
  }

  const handleUpdateConfig = async (updates: Partial<ServerConfig>) => {
    if (!serverConfig) return

    const updatedConfig = { ...serverConfig, ...updates }
    setServerConfig(updatedConfig) // Optimistic update

    try {
      const response = await fetch(`/api/settings/${serverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      if (response.ok) {
        setSuccess("Settings updated successfully!")
        setTimeout(() => setSuccess(null), 3000)
        fetchServerConfig() // Re-fetch to ensure consistency
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update settings.")
        setServerConfig(serverConfig) // Revert on error
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during update.")
      setServerConfig(serverConfig) // Revert on error
    }
  }

  const handlePostAnnouncement = async () => {
    if (!newAnnouncementContent.trim()) {
      setError("Announcement content cannot be empty.")
      return
    }
    setIsAnnouncementLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId, content: newAnnouncementContent }),
      })

      if (response.ok) {
        setSuccess("Announcement posted successfully!")
        setNewAnnouncementContent("")
        fetchAnnouncements()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to post announcement.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while posting announcement.")
    } finally {
      setIsAnnouncementLoading(false)
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch("/api/announcements", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ announcementId }),
      })

      if (response.ok) {
        setSuccess("Announcement deleted successfully!")
        fetchAnnouncements()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete announcement.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while deleting announcement.")
    }
  }

  const handleVerifyBot = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/verify-bot/${serverId}`, { method: "POST" })
      if (response.ok) {
        setSuccess("Bot verification initiated. Please check your Discord server.")
        setTimeout(() => setSuccess(null), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to verify bot.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during bot verification.")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !serverConfig) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-white">Loading server configuration...</p>
      </div>
    )
  }

  if (error && !serverConfig) {
    return (
      <div className="text-center py-12">
        <Alert className="border-red-500/30 bg-red-500/10 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!serverConfig) {
    return (
      <div className="text-center py-12 text-white">
        <p>No server configuration found for this ID.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {error && (
        <Alert className="mb-4 border-red-500/30 bg-red-500/10 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 border-green-500/30 bg-green-500/10 text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="glass-card mb-6">
        <CardHeader className="flex flex-col md:flex-row items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            {discordGuild?.icon ? (
              <Image
                src={`https://cdn.discordapp.com/icons/${discordGuild.id}/${discordGuild.icon}.png`}
                alt={`${discordGuild.name} icon`}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <CardTitle className="text-white text-2xl">{discordGuild?.name || "Unknown Server"}</CardTitle>
              <CardDescription className="text-gray-400">Configure your bot for this server.</CardDescription>
            </div>
          </div>
          <Button onClick={handleVerifyBot} className="bg-white text-black hover:bg-gray-200" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Verify Bot Status
          </Button>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-gray-800/50">
          <TabsTrigger value="home" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
            <Home className="h-4 w-4 mr-2" /> Home
          </TabsTrigger>
          <TabsTrigger
            value="welcome"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Bell className="h-4 w-4 mr-2" /> Welcome
          </TabsTrigger>
          <TabsTrigger
            value="moderation"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Shield className="h-4 w-4 mr-2" /> Sentinel
          </TabsTrigger>
          <TabsTrigger
            value="community"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Users className="h-4 w-4 mr-2" /> Community
          </TabsTrigger>
          <TabsTrigger
            value="helpdesk"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Ticket className="h-4 w-4 mr-2" /> Helpdesk
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Gift className="h-4 w-4 mr-2" /> Events
          </TabsTrigger>
          <TabsTrigger
            value="plugins"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Package className="h-4 w-4 mr-2" /> Plugins
          </TabsTrigger>
          <TabsTrigger
            value="bot-settings"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Bot className="h-4 w-4 mr-2" /> Bot Settings
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="access-plus"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <Crown className="h-4 w-4 mr-2" /> Access+
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="home" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2" /> Server Statistics
              </CardTitle>
              <CardDescription className="text-gray-400">Overview of your server members.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/20 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Members</p>
                  <p className="text-white text-2xl font-bold">{discordGuild?.approximate_member_count || "N/A"}</p>
                </div>
                <Users className="h-8 w-8 text-gray-500" />
              </div>
              <div className="bg-black/20 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Bots</p>
                  <p className="text-white text-2xl font-bold">{serverConfig.server_stats?.total_bots || "N/A"}</p>
                </div>
                <Bot className="h-8 w-8 text-gray-500" />
              </div>
              <div className="bg-black/20 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Admins</p>
                  <p className="text-white text-2xl font-bold">{serverConfig.server_stats?.total_admins || "N/A"}</p>
                </div>
                <Crown className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="h-5 w-5 mr-2" /> Announcements
              </CardTitle>
              <CardDescription className="text-gray-400">Send announcements to your server members.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your announcement here..."
                  value={newAnnouncementContent}
                  onChange={(e) => setNewAnnouncementContent(e.target.value)}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                />
                <Button
                  onClick={handlePostAnnouncement}
                  disabled={isAnnouncementLoading}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {isAnnouncementLoading ? "Posting..." : "Post Announcement"}
                </Button>
              </div>
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Recent Announcements</h3>
                {announcements.length === 0 ? (
                  <p className="text-gray-400">No announcements yet.</p>
                ) : (
                  announcements.map((announcement) => (
                    <Card key={announcement._id} className="bg-black/20 border-white/10">
                      <CardContent className="p-4 flex justify-between items-start">
                        <div>
                          <p className="text-gray-300 text-sm">{announcement.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Posted on: {new Date(announcement.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="welcome" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="h-5 w-5 mr-2" /> Welcome System
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure welcome messages and member verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="welcome-enabled" className="text-white">
                  Enable Welcome Messages
                </Label>
                <Switch
                  id="welcome-enabled"
                  checked={serverConfig.welcome?.enabled || false}
                  onCheckedChange={(checked) =>
                    handleUpdateConfig({ welcome: { ...serverConfig.welcome, enabled: checked } })
                  }
                />
              </div>
              {serverConfig.welcome?.enabled && (
                <>
                  <div>
                    <Label htmlFor="welcome-channel" className="text-white mb-2 block">
                      Welcome Channel
                    </Label>
                    <Select
                      value={serverConfig.welcome?.channel_id || ""}
                      onValueChange={(value) =>
                        handleUpdateConfig({ welcome: { ...serverConfig.welcome, channel_id: value } })
                      }
                    >
                      <SelectTrigger className="w-full bg-black/60 border-white/20 text-white">
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        {discordChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="welcome-message" className="text-white mb-2 block">
                      Welcome Message
                    </Label>
                    <Textarea
                      id="welcome-message"
                      placeholder="Welcome {user} to {server}!"
                      value={serverConfig.welcome?.message || ""}
                      onChange={(e) =>
                        handleUpdateConfig({ welcome: { ...serverConfig.welcome, message: e.target.value } })
                      }
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="welcome-dm" className="text-white">
                      Send Welcome Message in DM
                    </Label>
                    <Switch
                      id="welcome-dm"
                      checked={serverConfig.welcome?.dm_enabled || false}
                      onCheckedChange={(checked) =>
                        handleUpdateConfig({ welcome: { ...serverConfig.welcome, dm_enabled: checked } })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" /> Sentinel (Moderation)
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure moderation levels and content filters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="moderation-level" className="text-white mb-2 block">
                  Moderation Level
                </Label>
                <Select
                  value={serverConfig.moderation_level || "off"}
                  onValueChange={(value) =>
                    handleUpdateConfig({ moderation_level: value as "off" | "on" | "lockdown" })
                  }
                >
                  <SelectTrigger className="w-full bg-black/60 border-white/20 text-white">
                    <SelectValue placeholder="Select moderation level" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="on">On (Standard)</SelectItem>
                    <SelectItem value="lockdown">Lockdown (Strict)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Filters */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <List className="h-4 w-4 mr-2" /> Basic Filters
                </h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="link-filter-enabled" className="text-white">
                    Link Filter
                  </Label>
                  <Switch
                    id="link-filter-enabled"
                    checked={serverConfig.moderation?.link_filter?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          link_filter: { ...serverConfig.moderation?.link_filter, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.link_filter?.enabled && (
                  <div>
                    <Label htmlFor="link-filter-config" className="text-white mb-2 block">
                      Link Filter Configuration
                    </Label>
                    <Select
                      value={serverConfig.moderation?.link_filter?.config || "all_links"}
                      onValueChange={(value) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            link_filter: { ...serverConfig.moderation?.link_filter, config: value as any },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full bg-black/60 border-white/20 text-white">
                        <SelectValue placeholder="Select filter type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        <SelectItem value="all_links">Block All Links</SelectItem>
                        <SelectItem value="whitelist_only">Allow Whitelisted Links Only</SelectItem>
                        <SelectItem value="phishing_only">Block Phishing Links Only</SelectItem>
                      </SelectContent>
                    </Select>
                    {serverConfig.moderation?.link_filter?.config === "whitelist_only" && (
                      <div className="mt-4">
                        <Label htmlFor="link-whitelist" className="text-white mb-2 block">
                          Whitelisted Domains (comma-separated)
                        </Label>
                        <Input
                          id="link-whitelist"
                          value={serverConfig.moderation?.link_filter?.whitelist?.join(", ") || ""}
                          onChange={(e) =>
                            handleUpdateConfig({
                              moderation: {
                                ...serverConfig.moderation,
                                link_filter: {
                                  ...serverConfig.moderation?.link_filter,
                                  whitelist: e.target.value.split(",").map((s) => s.trim()),
                                },
                              },
                            })
                          }
                          placeholder="example.com, discord.com"
                          className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="bad-word-filter-enabled" className="text-white">
                    Bad Word Filter
                  </Label>
                  <Switch
                    id="bad-word-filter-enabled"
                    checked={serverConfig.moderation?.bad_word_filter?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          bad_word_filter: { ...serverConfig.moderation?.bad_word_filter, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.bad_word_filter?.enabled && (
                  <div className="mt-4">
                    <Label htmlFor="custom-words" className="text-white mb-2 block">
                      Custom Bad Words (comma-separated)
                    </Label>
                    <Input
                      id="custom-words"
                      value={serverConfig.moderation?.bad_word_filter?.custom_words?.join(", ") || ""}
                      onChange={(e) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            bad_word_filter: {
                              ...serverConfig.moderation?.bad_word_filter,
                              custom_words: e.target.value.split(",").map((s) => s.trim()),
                            },
                          },
                        })
                      }
                      placeholder="word1, word2"
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="raid-protection-enabled" className="text-white">
                    Raid Protection
                  </Label>
                  <Switch
                    id="raid-protection-enabled"
                    checked={serverConfig.moderation?.raid_protection?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          raid_protection: { ...serverConfig.moderation?.raid_protection, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.raid_protection?.enabled && (
                  <div className="mt-4">
                    <Label htmlFor="raid-threshold" className="text-white mb-2 block">
                      New Members Threshold (per minute)
                    </Label>
                    <Input
                      id="raid-threshold"
                      type="number"
                      value={serverConfig.moderation?.raid_protection?.threshold || 10}
                      onChange={(e) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            raid_protection: {
                              ...serverConfig.moderation?.raid_protection,
                              threshold: Number.parseInt(e.target.value),
                            },
                          },
                        })
                      }
                      className="bg-black/60 border-white/20 text-white"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="suspicious-accounts-enabled" className="text-white">
                    Suspicious Accounts Filter
                  </Label>
                  <Switch
                    id="suspicious-accounts-enabled"
                    checked={serverConfig.moderation?.suspicious_accounts?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          suspicious_accounts: { ...serverConfig.moderation?.suspicious_accounts, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.suspicious_accounts?.enabled && (
                  <div className="mt-4">
                    <Label htmlFor="min-age-days" className="text-white mb-2 block">
                      Minimum Account Age (days)
                    </Label>
                    <Input
                      id="min-age-days"
                      type="number"
                      value={serverConfig.moderation?.suspicious_accounts?.min_age_days || 7}
                      onChange={(e) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            suspicious_accounts: {
                              ...serverConfig.moderation?.suspicious_accounts,
                              min_age_days: Number.parseInt(e.target.value),
                            },
                          },
                        })
                      }
                      className="bg-black/60 border-white/20 text-white"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-role-enabled" className="text-white">
                    Auto Role Assignment
                  </Label>
                  <Switch
                    id="auto-role-enabled"
                    checked={serverConfig.moderation?.auto_role?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          auto_role: { ...serverConfig.moderation?.auto_role, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.auto_role?.enabled && (
                  <div className="mt-4">
                    <Label htmlFor="auto-role-id" className="text-white mb-2 block">
                      Role to Assign
                    </Label>
                    <Select
                      value={serverConfig.moderation?.auto_role?.role_id || ""}
                      onValueChange={(value) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            auto_role: { ...serverConfig.moderation?.auto_role, role_id: value },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full bg-black/60 border-white/20 text-white">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        {discordRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Advanced Security Features */}
              <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Lock className="h-4 w-4 mr-2" /> Advanced Security
                </h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="permission-abuse-enabled" className="text-white">
                    Permission Abuse Monitoring
                  </Label>
                  <Switch
                    id="permission-abuse-enabled"
                    checked={serverConfig.moderation?.permission_abuse?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          permission_abuse: { ...serverConfig.moderation?.permission_abuse, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.permission_abuse?.enabled && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-owner-on-role-change" className="text-white text-sm">
                        Notify Owner on Role Change
                      </Label>
                      <Switch
                        id="notify-owner-on-role-change"
                        checked={serverConfig.moderation?.permission_abuse?.notify_owner_on_role_change || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              permission_abuse: {
                                ...serverConfig.moderation?.permission_abuse,
                                notify_owner_on_role_change: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="monitor-admin-actions" className="text-white text-sm">
                        Monitor Admin Actions
                      </Label>
                      <Switch
                        id="monitor-admin-actions"
                        checked={serverConfig.moderation?.permission_abuse?.monitor_admin_actions || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              permission_abuse: {
                                ...serverConfig.moderation?.permission_abuse,
                                monitor_admin_actions: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="malicious-bot-detection-enabled" className="text-white">
                    Malicious Bot Detection
                  </Label>
                  <Switch
                    id="malicious-bot-detection-enabled"
                    checked={serverConfig.moderation?.malicious_bot_detection?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          malicious_bot_detection: {
                            ...serverConfig.moderation?.malicious_bot_detection,
                            enabled: checked,
                          },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.malicious_bot_detection?.enabled && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="new-bot-notifications" className="text-white text-sm">
                        New Bot Notifications
                      </Label>
                      <Switch
                        id="new-bot-notifications"
                        checked={serverConfig.moderation?.malicious_bot_detection?.new_bot_notifications || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              malicious_bot_detection: {
                                ...serverConfig.moderation?.malicious_bot_detection,
                                new_bot_notifications: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bot-activity-monitoring" className="text-white text-sm">
                        Bot Activity Monitoring
                      </Label>
                      <Switch
                        id="bot-activity-monitoring"
                        checked={serverConfig.moderation?.malicious_bot_detection?.bot_activity_monitoring || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              malicious_bot_detection: {
                                ...serverConfig.moderation?.malicious_bot_detection,
                                bot_activity_monitoring: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="bot-timeout-threshold" className="text-white text-sm mb-2 block">
                        Bot Timeout Threshold (actions per minute)
                      </Label>
                      <Input
                        id="bot-timeout-threshold"
                        type="number"
                        value={serverConfig.moderation?.malicious_bot_detection?.bot_timeout_threshold || 60}
                        onChange={(e) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              malicious_bot_detection: {
                                ...serverConfig.moderation?.malicious_bot_detection,
                                bot_timeout_threshold: Number.parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="bg-black/60 border-white/20 text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="token-webhook-abuse-enabled" className="text-white">
                    Token/Webhook Abuse Monitoring
                  </Label>
                  <Switch
                    id="token-webhook-abuse-enabled"
                    checked={serverConfig.moderation?.token_webhook_abuse?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          token_webhook_abuse: { ...serverConfig.moderation?.token_webhook_abuse, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.token_webhook_abuse?.enabled && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="webhook-creation-monitor" className="text-white text-sm">
                        Webhook Creation Monitor
                      </Label>
                      <Switch
                        id="webhook-creation-monitor"
                        checked={serverConfig.moderation?.token_webhook_abuse?.webhook_creation_monitor || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              token_webhook_abuse: {
                                ...serverConfig.moderation?.token_webhook_abuse,
                                webhook_creation_monitor: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="webhook-auto-revoke" className="text-white text-sm">
                        Webhook Auto Revoke
                      </Label>
                      <Switch
                        id="webhook-auto-revoke"
                        checked={serverConfig.moderation?.token_webhook_abuse?.webhook_auto_revoke || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              token_webhook_abuse: {
                                ...serverConfig.moderation?.token_webhook_abuse,
                                webhook_auto_revoke: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook-verification-timeout" className="text-white text-sm mb-2 block">
                        Webhook Verification Timeout (seconds)
                      </Label>
                      <Input
                        id="webhook-verification-timeout"
                        type="number"
                        value={serverConfig.moderation?.token_webhook_abuse?.webhook_verification_timeout || 300}
                        onChange={(e) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              token_webhook_abuse: {
                                ...serverConfig.moderation?.token_webhook_abuse,
                                webhook_verification_timeout: Number.parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="bg-black/60 border-white/20 text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="leaked-webhook-scanner" className="text-white text-sm">
                        Leaked Webhook Scanner
                      </Label>
                      <Switch
                        id="leaked-webhook-scanner"
                        checked={serverConfig.moderation?.token_webhook_abuse?.leaked_webhook_scanner || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              token_webhook_abuse: {
                                ...serverConfig.moderation?.token_webhook_abuse,
                                leaked_webhook_scanner: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="invite-hijacking-enabled" className="text-white">
                    Invite Hijacking Protection
                  </Label>
                  <Switch
                    id="invite-hijacking-enabled"
                    checked={serverConfig.moderation?.invite_hijacking?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          invite_hijacking: { ...serverConfig.moderation?.invite_hijacking, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.invite_hijacking?.enabled && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="invite-link-monitor" className="text-white text-sm">
                        Invite Link Monitor
                      </Label>
                      <Switch
                        id="invite-link-monitor"
                        checked={serverConfig.moderation?.invite_hijacking?.invite_link_monitor || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              invite_hijacking: {
                                ...serverConfig.moderation?.invite_hijacking,
                                invite_link_monitor: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="vanity-url-watcher" className="text-white text-sm">
                        Vanity URL Watcher
                      </Label>
                      <Switch
                        id="vanity-url-watcher"
                        checked={serverConfig.moderation?.invite_hijacking?.vanity_url_watcher || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              invite_hijacking: {
                                ...serverConfig.moderation?.invite_hijacking,
                                vanity_url_watcher: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="mass-ping-protection-enabled" className="text-white">
                    Mass Ping Protection
                  </Label>
                  <Switch
                    id="mass-ping-protection-enabled"
                    checked={serverConfig.moderation?.mass_ping_protection?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          mass_ping_protection: { ...serverConfig.moderation?.mass_ping_protection, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.mass_ping_protection?.enabled && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="anti-mention-flood" className="text-white text-sm">
                        Anti-Mention Flood
                      </Label>
                      <Switch
                        id="anti-mention-flood"
                        checked={serverConfig.moderation?.mass_ping_protection?.anti_mention_flood || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              mass_ping_protection: {
                                ...serverConfig.moderation?.mass_ping_protection,
                                anti_mention_flood: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="mention-rate-limit" className="text-white text-sm mb-2 block">
                        Mention Rate Limit (mentions per minute)
                      </Label>
                      <Input
                        id="mention-rate-limit"
                        type="number"
                        value={serverConfig.moderation?.mass_ping_protection?.mention_rate_limit || 5}
                        onChange={(e) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              mass_ping_protection: {
                                ...serverConfig.moderation?.mass_ping_protection,
                                mention_rate_limit: Number.parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="bg-black/60 border-white/20 text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message-cooldown-on-raid" className="text-white text-sm">
                        Message Cooldown on Raid
                      </Label>
                      <Switch
                        id="message-cooldown-on-raid"
                        checked={serverConfig.moderation?.mass_ping_protection?.message_cooldown_on_raid || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              mass_ping_protection: {
                                ...serverConfig.moderation?.mass_ping_protection,
                                message_cooldown_on_raid: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="cooldown-duration" className="text-white text-sm mb-2 block">
                        Cooldown Duration (seconds)
                      </Label>
                      <Input
                        id="cooldown-duration"
                        type="number"
                        value={serverConfig.moderation?.mass_ping_protection?.cooldown_duration || 60}
                        onChange={(e) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              mass_ping_protection: {
                                ...serverConfig.moderation?.mass_ping_protection,
                                cooldown_duration: Number.parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="bg-black/60 border-white/20 text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="malicious-file-scanner-enabled" className="text-white">
                    Malicious File Scanner
                  </Label>
                  <Switch
                    id="malicious-file-scanner-enabled"
                    checked={serverConfig.moderation?.malicious_file_scanner?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        moderation: {
                          ...serverConfig.moderation,
                          malicious_file_scanner: {
                            ...serverConfig.moderation?.malicious_file_scanner,
                            enabled: checked,
                          },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.moderation?.malicious_file_scanner?.enabled && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="suspicious-attachment-blocker" className="text-white text-sm">
                        Suspicious Attachment Blocker
                      </Label>
                      <Switch
                        id="suspicious-attachment-blocker"
                        checked={
                          serverConfig.moderation?.malicious_file_scanner?.suspicious_attachment_blocker || false
                        }
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              malicious_file_scanner: {
                                ...serverConfig.moderation?.malicious_file_scanner,
                                suspicious_attachment_blocker: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-file-filter" className="text-white text-sm">
                        Auto File Filter
                      </Label>
                      <Switch
                        id="auto-file-filter"
                        checked={serverConfig.moderation?.malicious_file_scanner?.auto_file_filter || false}
                        onCheckedChange={(checked) =>
                          handleUpdateConfig({
                            moderation: {
                              ...serverConfig.moderation,
                              malicious_file_scanner: {
                                ...serverConfig.moderation?.malicious_file_scanner,
                                auto_file_filter: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    {serverConfig.moderation?.malicious_file_scanner?.auto_file_filter && (
                      <div>
                        <Label htmlFor="allowed-file-types" className="text-white text-sm mb-2 block">
                          Allowed File Types (comma-separated, e.g., jpg, png, pdf)
                        </Label>
                        <Input
                          id="allowed-file-types"
                          value={serverConfig.moderation?.malicious_file_scanner?.allowed_file_types?.join(", ") || ""}
                          onChange={(e) =>
                            handleUpdateConfig({
                              moderation: {
                                ...serverConfig.moderation,
                                malicious_file_scanner: {
                                  ...serverConfig.moderation?.malicious_file_scanner,
                                  allowed_file_types: e.target.value.split(",").map((s) => s.trim()),
                                },
                              },
                            })
                          }
                          placeholder="jpg, png, gif"
                          className="bg-black/60 border-white/20 text-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2" /> Community Management
              </CardTitle>
              <CardDescription className="text-gray-400">Tools for managing your server's community.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mass-ping-protection" className="text-white">
                  Mass Ping Protection
                </Label>
                <Switch
                  id="mass-ping-protection"
                  checked={serverConfig.moderation?.mass_ping_protection?.enabled || false}
                  onCheckedChange={(checked) =>
                    handleUpdateConfig({
                      moderation: {
                        ...serverConfig.moderation,
                        mass_ping_protection: { ...serverConfig.moderation?.mass_ping_protection, enabled: checked },
                      },
                    })
                  }
                />
              </div>
              {serverConfig.moderation?.mass_ping_protection?.enabled && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="anti-mention-flood" className="text-white text-sm">
                      Anti-Mention Flood
                    </Label>
                    <Switch
                      id="anti-mention-flood"
                      checked={serverConfig.moderation?.mass_ping_protection?.anti_mention_flood || false}
                      onCheckedChange={(checked) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            mass_ping_protection: {
                              ...serverConfig.moderation?.mass_ping_protection,
                              anti_mention_flood: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="mention-rate-limit" className="text-white text-sm mb-2 block">
                      Mention Rate Limit (mentions per minute)
                    </Label>
                    <Input
                      id="mention-rate-limit"
                      type="number"
                      value={serverConfig.moderation?.mass_ping_protection?.mention_rate_limit || 5}
                      onChange={(e) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            mass_ping_protection: {
                              ...serverConfig.moderation?.mass_ping_protection,
                              mention_rate_limit: Number.parseInt(e.target.value),
                            },
                          },
                        })
                      }
                      className="bg-black/60 border-white/20 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="message-cooldown-on-raid" className="text-white text-sm">
                      Message Cooldown on Raid
                    </Label>
                    <Switch
                      id="message-cooldown-on-raid"
                      checked={serverConfig.moderation?.mass_ping_protection?.message_cooldown_on_raid || false}
                      onCheckedChange={(checked) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            mass_ping_protection: {
                              ...serverConfig.moderation?.mass_ping_protection,
                              message_cooldown_on_raid: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cooldown-duration" className="text-white text-sm mb-2 block">
                      Cooldown Duration (seconds)
                    </Label>
                    <Input
                      id="cooldown-duration"
                      type="number"
                      value={serverConfig.moderation?.mass_ping_protection?.cooldown_duration || 60}
                      onChange={(e) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            mass_ping_protection: {
                              ...serverConfig.moderation?.mass_ping_protection,
                              cooldown_duration: Number.parseInt(e.target.value),
                            },
                          },
                        })
                      }
                      className="bg-black/60 border-white/20 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="invite-link-protection" className="text-white">
                  Invite Link Protection
                </Label>
                <Switch
                  id="invite-link-protection"
                  checked={serverConfig.moderation?.invite_hijacking?.enabled || false}
                  onCheckedChange={(checked) =>
                    handleUpdateConfig({
                      moderation: {
                        ...serverConfig.moderation,
                        invite_hijacking: { ...serverConfig.moderation?.invite_hijacking, enabled: checked },
                      },
                    })
                  }
                />
              </div>
              {serverConfig.moderation?.invite_hijacking?.enabled && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="invite-link-monitor" className="text-white text-sm">
                      Invite Link Monitor
                    </Label>
                    <Switch
                      id="invite-link-monitor"
                      checked={serverConfig.moderation?.invite_hijacking?.invite_link_monitor || false}
                      onCheckedChange={(checked) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            invite_hijacking: {
                              ...serverConfig.moderation?.invite_hijacking,
                              invite_link_monitor: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vanity-url-watcher" className="text-white text-sm">
                      Vanity URL Watcher
                    </Label>
                    <Switch
                      id="vanity-url-watcher"
                      checked={serverConfig.moderation?.invite_hijacking?.vanity_url_watcher || false}
                      onCheckedChange={(checked) =>
                        handleUpdateConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            invite_hijacking: {
                              ...serverConfig.moderation?.invite_hijacking,
                              vanity_url_watcher: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="helpdesk" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Ticket className="h-5 w-5 mr-2" /> Helpdesk
              </CardTitle>
              <CardDescription className="text-gray-400">
                Set up a support ticket system and auto-answer Q&A.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Ticket className="h-4 w-4 mr-2" /> Ticket System
                </h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ticket-system-enabled" className="text-white">
                    Enable Ticket System
                  </Label>
                  <Switch
                    id="ticket-system-enabled"
                    checked={serverConfig.support?.ticket_system?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        support: {
                          ...serverConfig.support,
                          ticket_system: { ...serverConfig.support?.ticket_system, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.support?.ticket_system?.enabled && (
                  <>
                    <div>
                      <Label htmlFor="ticket-channel" className="text-white mb-2 block">
                        Ticket Channel
                      </Label>
                      <Select
                        value={serverConfig.support?.ticket_system?.channel_id || ""}
                        onValueChange={(value) =>
                          handleUpdateConfig({
                            support: {
                              ...serverConfig.support,
                              ticket_system: { ...serverConfig.support?.ticket_system, channel_id: value },
                            },
                          })
                        }
                      >
                        <SelectTrigger className="w-full bg-black/60 border-white/20 text-white">
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-white">
                          {discordChannels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              #{channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority-role" className="text-white mb-2 block">
                        Priority Role
                      </Label>
                      <Select
                        value={serverConfig.support?.ticket_system?.priority_role_id || ""}
                        onValueChange={(value) =>
                          handleUpdateConfig({
                            support: {
                              ...serverConfig.support,
                              ticket_system: { ...serverConfig.support?.ticket_system, priority_role_id: value },
                            },
                          })
                        }
                      >
                        <SelectTrigger className="w-full bg-black/60 border-white/20 text-white">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-white">
                          {discordRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" /> Auto-Answer Q&A
                </h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-answer-enabled" className="text-white">
                    Enable Auto-Answer
                  </Label>
                  <Switch
                    id="auto-answer-enabled"
                    checked={serverConfig.support?.auto_answer?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({
                        support: {
                          ...serverConfig.support,
                          auto_answer: { ...serverConfig.support?.auto_answer, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
                {serverConfig.support?.auto_answer?.enabled && (
                  <div>
                    <Label htmlFor="qa-pairs" className="text-white mb-2 block">
                      Q&A Pairs (JSON format)
                    </Label>
                    <Textarea
                      id="qa-pairs"
                      placeholder={`[{"question": "How to reset?", "answer": "Use !reset command."}]`}
                      value={serverConfig.support?.auto_answer?.qa_pairs || ""}
                      onChange={(e) =>
                        handleUpdateConfig({
                          support: {
                            ...serverConfig.support,
                            auto_answer: { ...serverConfig.support?.auto_answer, qa_pairs: e.target.value },
                          },
                        })
                      }
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[120px]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter as a JSON array of objects, each with "question" and "answer" keys.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Gift className="h-5 w-5 mr-2" /> Events
              </CardTitle>
              <CardDescription className="text-gray-400">Configure giveaways and other server events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="giveaway-enabled" className="text-white">
                  Enable Giveaways
                </Label>
                <Switch
                  id="giveaway-enabled"
                  checked={serverConfig.giveaway?.enabled || false}
                  onCheckedChange={(checked) =>
                    handleUpdateConfig({
                      giveaway: { ...serverConfig.giveaway, enabled: checked },
                    })
                  }
                />
              </div>
              {serverConfig.giveaway?.enabled && (
                <div>
                  <Label htmlFor="default-giveaway-channel" className="text-white mb-2 block">
                    Default Giveaway Channel
                  </Label>
                  <Select
                    value={serverConfig.giveaway?.default_channel_id || ""}
                    onValueChange={(value) =>
                      handleUpdateConfig({
                        giveaway: { ...serverConfig.giveaway, default_channel_id: value },
                      })
                    }
                  >
                    <SelectTrigger className="w-full bg-black/60 border-white/20 text-white">
                      <SelectValue placeholder="Select a channel" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      {discordChannels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          #{channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* More event configurations can go here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugins" className="mt-6">
          <PluginsTab />
        </TabsContent>

        <TabsContent value="bot-settings" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bot className="h-5 w-5 mr-2" /> Custom Bot Settings
              </CardTitle>
              <CardDescription className="text-gray-400">Customize your bot's profile and token.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bot-profile-picture-url" className="text-white mb-2 block">
                  Bot Profile Picture URL (PNG)
                </Label>
                <Input
                  id="bot-profile-picture-url"
                  placeholder="https://example.com/bot-avatar.png"
                  value={serverConfig.botProfilePictureUrl || ""}
                  onChange={(e) => handleUpdateConfig({ botProfilePictureUrl: e.target.value })}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                />
                {serverConfig.botProfilePictureUrl && (
                  <div className="mt-2">
                    <Image
                      src={serverConfig.botProfilePictureUrl || "/placeholder.svg"}
                      alt="Bot Profile Preview"
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="custom-bot-name" className="text-white mb-2 block">
                  Custom Bot Name
                </Label>
                <Input
                  id="custom-bot-name"
                  placeholder="My Awesome Bot"
                  value={serverConfig.customBotName || ""}
                  onChange={(e) => handleUpdateConfig({ customBotName: e.target.value })}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="bot-token" className="text-white mb-2 block">
                  Bot Token
                </Label>
                <Input
                  id="bot-token"
                  type="password"
                  placeholder="Enter your bot's token (keep it secret!)"
                  value={serverConfig.botToken || ""}
                  onChange={(e) => handleUpdateConfig({ botToken: e.target.value })}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Warning: Sharing your bot token can compromise your bot.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="access-plus" className="mt-6 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Crown className="h-5 w-5 mr-2" /> Access+ (Admin Settings)
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage global application settings and announcements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance-mode" className="text-white">
                    Maintenance Mode
                  </Label>
                  <Switch
                    id="maintenance-mode"
                    checked={false} // Placeholder for actual maintenance mode state
                    onCheckedChange={() => alert("Maintenance mode toggle not yet implemented.")}
                  />
                </div>
                {/* More admin settings can go here */}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
