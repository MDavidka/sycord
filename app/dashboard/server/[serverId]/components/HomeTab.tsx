"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LogIn, Shield, MessageSquare, Crown, UserCheck, Bot, Eye, Hash, Megaphone } from "lucide-react"
import Image from "next/image"

interface HomeTabProps {
  serverConfig: any
  updateServerConfig: (updates: any) => void
  announcements: any[]
  dismissedAnnouncements: string[]
  handleDismissAnnouncement: (id: string) => void
  serverId: string
}

export default function HomeTab({
  serverConfig,
  updateServerConfig,
  announcements,
  dismissedAnnouncements,
  handleDismissAnnouncement,
  serverId,
}: HomeTabProps) {
  const getRoleName = (roleId: string) => {
    if (!serverConfig?.roles_and_names[roleId]) return "Unknown Role"
    return serverConfig.roles_and_names[roleId]
  }

  return (
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
                  serverConfig.welcome.enabled ? "border-gray-500/50 bg-gray-500/5" : "border-gray-500/50 bg-gray-500/5"
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
                          className={`h-4 w-4 ${serverConfig.welcome.message ? "text-gray-400" : "text-gray-400"}`}
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
  )
}
