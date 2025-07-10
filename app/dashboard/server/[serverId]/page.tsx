"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2Icon, CheckCircleIcon, XCircleIcon, SaveIcon, RefreshCcwIcon } from "lucide-react"
import Image from "next/image"
import type { ServerConfig, BotSettings, DiscordGuild } from "@/lib/types"

export default function ServerConfigPage() {
  const { serverId } = useParams()
  const { data: session, status } = useSession()
  const [config, setConfig] = useState<ServerConfig | null>(null)
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null)
  const [discordGuild, setDiscordGuild] = useState<DiscordGuild | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingBotSettings, setLoadingBotSettings] = useState(true)
  const [loadingDiscordGuild, setLoadingDiscordGuild] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [botSettingsError, setBotSettingsError] = useState<string | null>(null)
  const [discordGuildError, setDiscordGuildError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated" && serverId) {
      // Ensure serverId is a string before passing
      const id = Array.isArray(serverId) ? serverId[0] : serverId
      fetchServerConfig(id)
      fetchBotSettings(id)
      fetchDiscordGuildInfo(id)
    }
  }, [status, serverId]) // Add serverId to dependency array

  const fetchServerConfig = async (id: string) => {
    setLoadingConfig(true)
    setConfigError(null)
    try {
      const response = await fetch(`/api/user-config/${id}`)
      const data = await response.json()
      if (response.ok) {
        setConfig(data.config)
      } else {
        setConfigError(data.error || "Failed to load server configuration.")
        console.error("Error fetching server config:", data.error)
      }
    } catch (error) {
      setConfigError("An unexpected error occurred while fetching server configuration.")
      console.error("Fetch server config error:", error)
    } finally {
      setLoadingConfig(false)
    }
  }

  const fetchBotSettings = async (id: string) => {
    setLoadingBotSettings(true)
    setBotSettingsError(null)
    try {
      const response = await fetch(`/api/bot-settings/${id}`)
      const data = await response.json()
      if (response.ok) {
        setBotSettings(data.botSettings)
      } else {
        setBotSettingsError(data.error || "Failed to load bot settings.")
        console.error("Error fetching bot settings:", data.error)
      }
    } catch (error) {
      setBotSettingsError("An unexpected error occurred while fetching bot settings.")
      console.error("Fetch bot settings error:", error)
    } finally {
      setLoadingBotSettings(false)
    }
  }

  const fetchDiscordGuildInfo = async (id: string) => {
    setLoadingDiscordGuild(true)
    setDiscordGuildError(null)
    try {
      // Fetch all guilds, then find the specific one
      const response = await fetch(`/api/discord/guilds`)
      const data = await response.json()
      if (response.ok && data.guilds) {
        const guild = data.guilds.find((g: DiscordGuild) => g.id === id)
        if (guild) {
          setDiscordGuild(guild)
        } else {
          setDiscordGuildError("Discord guild not found or you don't have permissions.")
        }
      } else {
        setDiscordGuildError(data.error || "Failed to load Discord guild info.")
        console.error("Error fetching Discord guild info:", data.error)
      }
    } catch (error) {
      setDiscordGuildError("An unexpected error occurred while fetching Discord guild info.")
      console.error("Fetch Discord guild info error:", error)
    } finally {
      setLoadingDiscordGuild(false)
    }
  }

  const handleConfigChange = (key: keyof ServerConfig, value: any) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : null))
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleNestedConfigChange = (parentKey: keyof ServerConfig, childKey: string, value: any) => {
    setConfig((prev) => {
      if (!prev) return null
      const parent = prev[parentKey] as Record<string, any>
      return {
        ...prev,
        [parentKey]: {
          ...parent,
          [childKey]: value,
        },
      }
    })
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleSaveConfig = async () => {
    if (!config || !serverId) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const id = Array.isArray(serverId) ? serverId[0] : serverId
      const response = await fetch(`/api/user-config/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })
      const data = await response.json()
      if (response.ok) {
        setSaveSuccess(true)
        // Optionally refetch config to ensure consistency
        fetchServerConfig(id)
      } else {
        setSaveError(data.error || "Failed to save configuration.")
        console.error("Error saving config:", data.error)
      }
    } catch (error) {
      setSaveError("An unexpected error occurred while saving configuration.")
      console.error("Save config error:", error)
    } finally {
      setSaving(false)
    }
  }

  // Show loading state if any data is still being fetched or if serverId is not yet available
  if (status === "loading" || !serverId || loadingConfig || loadingBotSettings || loadingDiscordGuild) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Show error state if any data failed to load or if essential data is null
  if (configError || botSettingsError || discordGuildError || !config || !botSettings || !discordGuild) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Server Data</h2>
        <p className="text-gray-600 text-center mb-4">
          {configError ||
            botSettingsError ||
            discordGuildError ||
            "Could not load server configuration or bot settings. Please ensure the bot is in this server and you have the necessary permissions."}
        </p>
        <Button
          onClick={() => {
            const id = Array.isArray(serverId) ? serverId[0] : serverId
            fetchServerConfig(id)
            fetchBotSettings(id)
            fetchDiscordGuildInfo(id)
          }}
          variant="outline"
        >
          <RefreshCcwIcon className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
            <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="object-cover" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Dash</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Image
            src={
              discordGuild.icon
                ? `https://cdn.discordapp.com/icons/${discordGuild.id}/${discordGuild.icon}.png`
                : "/placeholder-logo.svg"
            }
            alt={discordGuild.name}
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-semibold text-gray-800">{discordGuild.name}</span>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Server Configuration</h2>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:grid-cols-8 h-auto flex-wrap">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="welcome">Welcome</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="giveaway">Giveaway</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="bot-settings">Bot Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serverName">Server Name</Label>
                  <Input id="serverName" value={config.serverName} disabled />
                </div>
                <div>
                  <Label htmlFor="serverId">Server ID</Label>
                  <Input id="serverId" value={config.serverId} disabled />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isBotAdded"
                    checked={config.isBotAdded}
                    onCheckedChange={(checked) => handleConfigChange("isBotAdded", checked)}
                    disabled
                  />
                  <Label htmlFor="isBotAdded">Bot Added</Label>
                </div>
                <div>
                  <Label htmlFor="moderationLevel">Moderation Level</Label>
                  <Select
                    value={config.moderationLevel}
                    onValueChange={(value: "off" | "on" | "lockdown") => handleConfigChange("moderationLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select moderation level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="lockdown">Lockdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="linkFilterEnabled"
                    checked={config.moderation.linkFilter.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "linkFilter", {
                        ...config.moderation.linkFilter,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="linkFilterEnabled">Link Filter</Label>
                </div>
                {config.moderation.linkFilter.enabled && (
                  <div>
                    <Label htmlFor="linkFilterConfig">Link Filter Config</Label>
                    <Select
                      value={config.moderation.linkFilter.config}
                      onValueChange={(value: "all_links" | "whitelist_only" | "phishing_only") =>
                        handleNestedConfigChange("moderation", "linkFilter", {
                          ...config.moderation.linkFilter,
                          config: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select link filter config" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_links">Block All Links</SelectItem>
                        <SelectItem value="whitelist_only">Allow Whitelisted Only</SelectItem>
                        <SelectItem value="phishing_only">Block Phishing Links Only</SelectItem>
                      </SelectContent>
                    </Select>
                    {config.moderation.linkFilter.config === "whitelist_only" && (
                      <div>
                        <Label htmlFor="whitelist">Whitelisted Domains (comma-separated)</Label>
                        <Textarea
                          id="whitelist"
                          value={config.moderation.linkFilter.whitelist?.join(", ") || ""}
                          onChange={(e) =>
                            handleNestedConfigChange("moderation", "linkFilter", {
                              ...config.moderation.linkFilter,
                              whitelist: e.target.value.split(",").map((s) => s.trim()),
                            })
                          }
                          placeholder="example.com, another.org"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="badWordFilterEnabled"
                    checked={config.moderation.badWordFilter.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "badWordFilter", {
                        ...config.moderation.badWordFilter,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="badWordFilterEnabled">Bad Word Filter</Label>
                </div>
                {config.moderation.badWordFilter.enabled && (
                  <div>
                    <Label htmlFor="customWords">Custom Bad Words (comma-separated)</Label>
                    <Textarea
                      id="customWords"
                      value={config.moderation.badWordFilter.customWords?.join(", ") || ""}
                      onChange={(e) =>
                        handleNestedConfigChange("moderation", "badWordFilter", {
                          ...config.moderation.badWordFilter,
                          customWords: e.target.value.split(",").map((s) => s.trim()),
                        })
                      }
                      placeholder="word1, word2"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="raidProtectionEnabled"
                    checked={config.moderation.raidProtection.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "raidProtection", {
                        ...config.moderation.raidProtection,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="raidProtectionEnabled">Raid Protection</Label>
                </div>
                {config.moderation.raidProtection.enabled && (
                  <div>
                    <Label htmlFor="raidThreshold">Raid Threshold (members joining per minute)</Label>
                    <Input
                      id="raidThreshold"
                      type="number"
                      value={config.moderation.raidProtection.threshold || 10}
                      onChange={(e) =>
                        handleNestedConfigChange("moderation", "raidProtection", {
                          ...config.moderation.raidProtection,
                          threshold: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="suspiciousAccountsEnabled"
                    checked={config.moderation.suspiciousAccounts.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "suspiciousAccounts", {
                        ...config.moderation.suspiciousAccounts,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="suspiciousAccountsEnabled">Suspicious Accounts</Label>
                </div>
                {config.moderation.suspiciousAccounts.enabled && (
                  <div>
                    <Label htmlFor="minAgeDays">Minimum Account Age (days)</Label>
                    <Input
                      id="minAgeDays"
                      type="number"
                      value={config.moderation.suspiciousAccounts.minAgeDays || 30}
                      onChange={(e) =>
                        handleNestedConfigChange("moderation", "suspiciousAccounts", {
                          ...config.moderation.suspiciousAccounts,
                          minAgeDays: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoRoleEnabled"
                    checked={config.moderation.autoRole.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "autoRole", {
                        ...config.moderation.autoRole,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="autoRoleEnabled">Auto Role on Join</Label>
                </div>
                {config.moderation.autoRole.enabled && (
                  <div>
                    <Label htmlFor="autoRoleId">Role to Assign (ID)</Label>
                    <Input
                      id="autoRoleId"
                      value={config.moderation.autoRole.roleId || ""}
                      onChange={(e) =>
                        handleNestedConfigChange("moderation", "autoRole", {
                          ...config.moderation.autoRole,
                          roleId: e.target.value,
                        })
                      }
                      placeholder="Enter role ID"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="permissionAbuseEnabled"
                    checked={config.moderation.permissionAbuse.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "permissionAbuse", {
                        ...config.moderation.permissionAbuse,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="permissionAbuseEnabled">Permission Abuse Monitoring</Label>
                </div>
                {config.moderation.permissionAbuse.enabled && (
                  <>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="notifyOwnerOnRoleChange"
                        checked={config.moderation.permissionAbuse.notifyOwnerOnRoleChange}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "permissionAbuse", {
                            ...config.moderation.permissionAbuse,
                            notifyOwnerOnRoleChange: checked,
                          })
                        }
                      />
                      <Label htmlFor="notifyOwnerOnRoleChange">Notify Owner on Role Change</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="monitorAdminActions"
                        checked={config.moderation.permissionAbuse.monitorAdminActions}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "permissionAbuse", {
                            ...config.moderation.permissionAbuse,
                            monitorAdminActions: checked,
                          })
                        }
                      />
                      <Label htmlFor="monitorAdminActions">Monitor Admin Actions</Label>
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="maliciousBotDetectionEnabled"
                    checked={config.moderation.maliciousBotDetection.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "maliciousBotDetection", {
                        ...config.moderation.maliciousBotDetection,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="maliciousBotDetectionEnabled">Malicious Bot Detection</Label>
                </div>
                {config.moderation.maliciousBotDetection.enabled && (
                  <>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="newBotNotifications"
                        checked={config.moderation.maliciousBotDetection.newBotNotifications}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "maliciousBotDetection", {
                            ...config.moderation.maliciousBotDetection,
                            newBotNotifications: checked,
                          })
                        }
                      />
                      <Label htmlFor="newBotNotifications">New Bot Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="botActivityMonitoring"
                        checked={config.moderation.maliciousBotDetection.botActivityMonitoring}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "maliciousBotDetection", {
                            ...config.moderation.maliciousBotDetection,
                            botActivityMonitoring: checked,
                          })
                        }
                      />
                      <Label htmlFor="botActivityMonitoring">Bot Activity Monitoring</Label>
                    </div>
                    <div>
                      <Label htmlFor="botTimeoutThreshold">Bot Timeout Threshold (seconds)</Label>
                      <Input
                        id="botTimeoutThreshold"
                        type="number"
                        value={config.moderation.maliciousBotDetection.botTimeoutThreshold || 300}
                        onChange={(e) =>
                          handleNestedConfigChange("moderation", "maliciousBotDetection", {
                            ...config.moderation.maliciousBotDetection,
                            botTimeoutThreshold: Number.parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="tokenWebhookAbuseEnabled"
                    checked={config.moderation.tokenWebhookAbuse.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "tokenWebhookAbuse", {
                        ...config.moderation.tokenWebhookAbuse,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="tokenWebhookAbuseEnabled">Token/Webhook Abuse Protection</Label>
                </div>
                {config.moderation.tokenWebhookAbuse.enabled && (
                  <>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="webhookCreationMonitor"
                        checked={config.moderation.tokenWebhookAbuse.webhookCreationMonitor}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "tokenWebhookAbuse", {
                            ...config.moderation.tokenWebhookAbuse,
                            webhookCreationMonitor: checked,
                          })
                        }
                      />
                      <Label htmlFor="webhookCreationMonitor">Webhook Creation Monitor</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="webhookAutoRevoke"
                        checked={config.moderation.tokenWebhookAbuse.webhookAutoRevoke}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "tokenWebhookAbuse", {
                            ...config.moderation.tokenWebhookAbuse,
                            webhookAutoRevoke: checked,
                          })
                        }
                      />
                      <Label htmlFor="webhookAutoRevoke">Webhook Auto Revoke</Label>
                    </div>
                    <div>
                      <Label htmlFor="webhookVerificationTimeout">Webhook Verification Timeout (seconds)</Label>
                      <Input
                        id="webhookVerificationTimeout"
                        type="number"
                        value={config.moderation.tokenWebhookAbuse.webhookVerificationTimeout || 60}
                        onChange={(e) =>
                          handleNestedConfigChange("moderation", "tokenWebhookAbuse", {
                            ...config.moderation.tokenWebhookAbuse,
                            webhookVerificationTimeout: Number.parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="leakedWebhookScanner"
                        checked={config.moderation.tokenWebhookAbuse.leakedWebhookScanner}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "tokenWebhookAbuse", {
                            ...config.moderation.tokenWebhookAbuse,
                            leakedWebhookScanner: checked,
                          })
                        }
                      />
                      <Label htmlFor="leakedWebhookScanner">Leaked Webhook Scanner</Label>
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="inviteHijackingEnabled"
                    checked={config.moderation.inviteHijacking.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "inviteHijacking", {
                        ...config.moderation.inviteHijacking,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="inviteHijackingEnabled">Invite Hijacking Protection</Label>
                </div>
                {config.moderation.inviteHijacking.enabled && (
                  <>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="inviteLinkMonitor"
                        checked={config.moderation.inviteHijacking.inviteLinkMonitor}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "inviteHijacking", {
                            ...config.moderation.inviteHijacking,
                            inviteLinkMonitor: checked,
                          })
                        }
                      />
                      <Label htmlFor="inviteLinkMonitor">Invite Link Monitor</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="vanityUrlWatcher"
                        checked={config.moderation.inviteHijacking.vanityUrlWatcher}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "inviteHijacking", {
                            ...config.moderation.inviteHijacking,
                            vanityUrlWatcher: checked,
                          })
                        }
                      />
                      <Label htmlFor="vanityUrlWatcher">Vanity URL Watcher</Label>
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="massPingProtectionEnabled"
                    checked={config.moderation.massPingProtection.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "massPingProtection", {
                        ...config.moderation.massPingProtection,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="massPingProtectionEnabled">Mass Ping Protection</Label>
                </div>
                {config.moderation.massPingProtection.enabled && (
                  <>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="antiMentionFlood"
                        checked={config.moderation.massPingProtection.antiMentionFlood}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "massPingProtection", {
                            ...config.moderation.massPingProtection,
                            antiMentionFlood: checked,
                          })
                        }
                      />
                      <Label htmlFor="antiMentionFlood">Anti-Mention Flood</Label>
                    </div>
                    <div>
                      <Label htmlFor="mentionRateLimit">Mention Rate Limit (mentions per message)</Label>
                      <Input
                        id="mentionRateLimit"
                        type="number"
                        value={config.moderation.massPingProtection.mentionRateLimit || 5}
                        onChange={(e) =>
                          handleNestedConfigChange("moderation", "massPingProtection", {
                            ...config.moderation.massPingProtection,
                            mentionRateLimit: Number.parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="messageCooldownOnRaid"
                        checked={config.moderation.massPingProtection.messageCooldownOnRaid}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "massPingProtection", {
                            ...config.moderation.massPingProtection,
                            messageCooldownOnRaid: checked,
                          })
                        }
                      />
                      <Label htmlFor="messageCooldownOnRaid">Message Cooldown on Raid</Label>
                    </div>
                    <div>
                      <Label htmlFor="cooldownDuration">Cooldown Duration (seconds)</Label>
                      <Input
                        id="cooldownDuration"
                        type="number"
                        value={config.moderation.massPingProtection.cooldownDuration || 300}
                        onChange={(e) =>
                          handleNestedConfigChange("moderation", "massPingProtection", {
                            ...config.moderation.massPingProtection,
                            cooldownDuration: Number.parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="maliciousFileScannerEnabled"
                    checked={config.moderation.maliciousFileScanner.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("moderation", "maliciousFileScanner", {
                        ...config.moderation.maliciousFileScanner,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="maliciousFileScannerEnabled">Malicious File Scanner</Label>
                </div>
                {config.moderation.maliciousFileScanner.enabled && (
                  <>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="suspiciousAttachmentBlocker"
                        checked={config.moderation.maliciousFileScanner.suspiciousAttachmentBlocker}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "maliciousFileScanner", {
                            ...config.moderation.maliciousFileScanner,
                            suspiciousAttachmentBlocker: checked,
                          })
                        }
                      />
                      <Label htmlFor="suspiciousAttachmentBlocker">Suspicious Attachment Blocker</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        id="autoFileFilter"
                        checked={config.moderation.maliciousFileScanner.autoFileFilter}
                        onCheckedChange={(checked) =>
                          handleNestedConfigChange("moderation", "maliciousFileScanner", {
                            ...config.moderation.maliciousFileScanner,
                            autoFileFilter: checked,
                          })
                        }
                      />
                      <Label htmlFor="autoFileFilter">Auto File Filter</Label>
                    </div>
                    <div>
                      <Label htmlFor="allowedFileTypes">Allowed File Types (comma-separated)</Label>
                      <Input
                        id="allowedFileTypes"
                        value={config.moderation.maliciousFileScanner.allowedFileTypes?.join(", ") || ""}
                        onChange={(e) =>
                          handleNestedConfigChange("moderation", "maliciousFileScanner", {
                            ...config.moderation.maliciousFileScanner,
                            allowedFileTypes: e.target.value.split(",").map((s) => s.trim()),
                          })
                        }
                        placeholder="jpg, png, gif"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="welcome" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="welcomeEnabled"
                    checked={config.welcome.enabled}
                    onCheckedChange={(checked) => handleNestedConfigChange("welcome", "enabled", checked)}
                  />
                  <Label htmlFor="welcomeEnabled">Enable Welcome Messages</Label>
                </div>
                {config.welcome.enabled && (
                  <>
                    <div>
                      <Label htmlFor="welcomeChannel">Welcome Channel ID</Label>
                      <Input
                        id="welcomeChannel"
                        value={config.welcome.channelId || ""}
                        onChange={(e) => handleNestedConfigChange("welcome", "channelId", e.target.value)}
                        placeholder="Enter channel ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="welcomeMessage">Welcome Message</Label>
                      <Textarea
                        id="welcomeMessage"
                        value={config.welcome.message || ""}
                        onChange={(e) => handleNestedConfigChange("welcome", "message", e.target.value)}
                        placeholder="Welcome {user} to {server}!"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="welcomeDmEnabled"
                        checked={config.welcome.dmEnabled || false}
                        onCheckedChange={(checked) => handleNestedConfigChange("welcome", "dmEnabled", checked)}
                      />
                      <Label htmlFor="welcomeDmEnabled">Send Welcome Message in DM</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ticketSystemEnabled"
                    checked={config.support.ticketSystem.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("support", "ticketSystem", {
                        ...config.support.ticketSystem,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="ticketSystemEnabled">Enable Ticket System</Label>
                </div>
                {config.support.ticketSystem.enabled && (
                  <>
                    <div>
                      <Label htmlFor="ticketChannel">Ticket Channel ID</Label>
                      <Input
                        id="ticketChannel"
                        value={config.support.ticketSystem.channelId || ""}
                        onChange={(e) =>
                          handleNestedConfigChange("support", "ticketSystem", {
                            ...config.support.ticketSystem,
                            channelId: e.target.value,
                          })
                        }
                        placeholder="Enter channel ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supportRole">Support Role ID</Label>
                      <Input
                        id="supportRole"
                        value={config.support.ticketSystem.priorityRoleId || ""}
                        onChange={(e) =>
                          handleNestedConfigChange("support", "ticketSystem", {
                            ...config.support.ticketSystem,
                            priorityRoleId: e.target.value,
                          })
                        }
                        placeholder="Enter role ID for support staff"
                      />
                    </div>
                  </>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoAnswerEnabled"
                    checked={config.support.autoAnswer.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedConfigChange("support", "autoAnswer", {
                        ...config.support.autoAnswer,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="autoAnswerEnabled">Enable Auto-Answer (AI)</Label>
                </div>
                {config.support.autoAnswer.enabled && (
                  <div>
                    <Label htmlFor="qaPairs">Q&A Pairs (JSON format)</Label>
                    <Textarea
                      id="qaPairs"
                      value={config.support.autoAnswer.qaPairs || ""}
                      onChange={(e) =>
                        handleNestedConfigChange("support", "autoAnswer", {
                          ...config.support.autoAnswer,
                          qaPairs: e.target.value,
                        })
                      }
                      placeholder='[{"question": "...", "answer": "..."}]'
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="giveaway" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Giveaway Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="giveawayEnabled"
                    checked={config.giveaway.enabled}
                    onCheckedChange={(checked) => handleNestedConfigChange("giveaway", "enabled", checked)}
                  />
                  <Label htmlFor="giveawayEnabled">Enable Giveaway Module</Label>
                </div>
                {config.giveaway.enabled && (
                  <div>
                    <Label htmlFor="defaultGiveawayChannel">Default Giveaway Channel ID</Label>
                    <Input
                      id="defaultGiveawayChannel"
                      value={config.giveaway.defaultChannelId || ""}
                      onChange={(e) => handleNestedConfigChange("giveaway", "defaultChannelId", e.target.value)}
                      placeholder="Enter channel ID"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Logging Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="logsEnabled"
                    checked={config.logs.enabled}
                    onCheckedChange={(checked) => handleNestedConfigChange("logs", "enabled", checked)}
                  />
                  <Label htmlFor="logsEnabled">Enable Logging</Label>
                </div>
                {config.logs.enabled && (
                  <>
                    <div>
                      <Label htmlFor="logChannel">Log Channel ID</Label>
                      <Input
                        id="logChannel"
                        value={config.logs.channelId || ""}
                        onChange={(e) => handleNestedConfigChange("logs", "channelId", e.target.value)}
                        placeholder="Enter channel ID"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="messageEdits"
                        checked={config.logs.messageEdits}
                        onCheckedChange={(checked) => handleNestedConfigChange("logs", "messageEdits", checked)}
                      />
                      <Label htmlFor="messageEdits">Log Message Edits</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="modActions"
                        checked={config.logs.modActions}
                        onCheckedChange={(checked) => handleNestedConfigChange("logs", "modActions", checked)}
                      />
                      <Label htmlFor="modActions">Log Moderation Actions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="memberJoins"
                        checked={config.logs.memberJoins}
                        onCheckedChange={(checked) => handleNestedConfigChange("logs", "memberJoins", checked)}
                      />
                      <Label htmlFor="memberJoins">Log Member Joins</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="memberLeaves"
                        checked={config.logs.memberLeaves}
                        onCheckedChange={(checked) => handleNestedConfigChange("logs", "memberLeaves", checked)}
                      />
                      <Label htmlFor="memberLeaves">Log Member Leaves</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bot-settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bot Specific Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="botName">Bot Name</Label>
                  <Input id="botName" value={botSettings.name} disabled />
                </div>
                <div>
                  <Label htmlFor="botAvatar">Bot Avatar URL</Label>
                  <Input id="botAvatar" value={botSettings.avatar} disabled />
                  {botSettings.avatar && (
                    <Image
                      src={botSettings.avatar || "/placeholder.svg"}
                      alt="Bot Avatar"
                      width={64}
                      height={64}
                      className="rounded-full mt-2"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="botStatus">Bot Status</Label>
                  <Select value={botSettings.status} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bot status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="idle">Idle</SelectItem>
                      <SelectItem value="dnd">Do Not Disturb</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="botVersion">Bot Version</Label>
                  <Input id="botVersion" value={botSettings.version} disabled />
                </div>
                <div>
                  <Label htmlFor="lastUpdated">Last Updated</Label>
                  <Input id="lastUpdated" value={new Date(botSettings.updatedAt).toLocaleString()} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rolesAndNames">Roles and Names (JSON)</Label>
                  <Textarea
                    id="rolesAndNames"
                    value={JSON.stringify(config.rolesAndNames, null, 2)}
                    onChange={(e) => {
                      try {
                        handleConfigChange("rolesAndNames", JSON.parse(e.target.value))
                      } catch (error) {
                        console.error("Invalid JSON for rolesAndNames", error)
                        setSaveError("Invalid JSON format for Roles and Names.")
                      }
                    }}
                    rows={5}
                    placeholder='{"roleId": "Role Name"}'
                  />
                </div>
                <div>
                  <Label htmlFor="channels">Channels (JSON)</Label>
                  <Textarea
                    id="channels"
                    value={JSON.stringify(config.channels, null, 2)}
                    onChange={(e) => {
                      try {
                        handleConfigChange("channels", JSON.parse(e.target.value))
                      } catch (error) {
                        console.error("Invalid JSON for channels", error)
                        setSaveError("Invalid JSON format for Channels.")
                      }
                    }}
                    rows={5}
                    placeholder='{"channelId": "Channel Name"}'
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end space-x-4">
          {saveSuccess && (
            <Alert className="w-auto" variant="success">
              <CheckCircleIcon className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>Configuration saved successfully.</AlertDescription>
            </Alert>
          )}
          {saveError && (
            <Alert className="w-auto" variant="destructive">
              <XCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          <Button onClick={handleSaveConfig} disabled={saving} className="bg-gray-900 hover:bg-gray-800 text-white">
            {saving ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </main>
    </div>
  )
}
