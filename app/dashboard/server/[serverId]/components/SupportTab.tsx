"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { LinkIcon, MessageSquare, ArrowLeft, Flag, Settings } from "lucide-react"
import Image from "next/image"

interface SupportTabProps {
  serverConfig: any
  updateServerConfig: (updates: any) => void
  activeSupportSection: "staff" | "tickets" | null
  setActiveSupportSection: (section: "staff" | "tickets" | null) => void
  showReputationInfo: boolean
  setShowReputationInfo: (show: boolean) => void
  showEmbedSettings: boolean
  setShowEmbedSettings: (show: boolean) => void
  showFlagStaffWarning: boolean
  setShowFlagStaffWarning: (show: boolean) => void
  handleFlagStaffClick: (userId: string) => void
  confirmFlagStaff: () => void
  getChannelName: (channelId: string) => string
}

export default function SupportTab({
  serverConfig,
  updateServerConfig,
  activeSupportSection,
  setActiveSupportSection,
  showReputationInfo,
  setShowReputationInfo,
  showEmbedSettings,
  setShowEmbedSettings,
  showFlagStaffWarning,
  setShowFlagStaffWarning,
  handleFlagStaffClick,
  confirmFlagStaff,
  getChannelName,
}: SupportTabProps) {
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Sycord is here to help</h2>
        <p className="text-gray-400">Get assistance and manage your support systems</p>
      </div>

      {/* Support Functions Overview */}
      {!activeSupportSection && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <LinkIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Invite Track & Log</h3>
                  <p className="text-sm text-gray-400">Monitor server invites and track member growth</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="invite-tracking" className="text-white">
                      Enable Invite Tracking
                    </Label>
                    <p className="text-sm text-gray-400">Track who invited new members</p>
                  </div>
                  <Switch
                    id="invite-tracking"
                    checked={serverConfig.invite_tracking?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateServerConfig({
                        invite_tracking: {
                          ...serverConfig.invite_tracking,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </div>

                {serverConfig.invite_tracking?.enabled && (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="space-y-2">
                      <Label htmlFor="invite-log-channel" className="text-white">
                        Log Channel
                      </Label>
                      <Select
                        value={serverConfig.invite_tracking?.channel_id || ""}
                        onValueChange={(value) =>
                          updateServerConfig({
                            invite_tracking: {
                              ...serverConfig.invite_tracking,
                              channel_id: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="bg-black/60 border-white/20 h-8">
                          <SelectValue placeholder="Select log channel" />
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

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="track-joins" className="text-white">
                          Track Member Joins
                        </Label>
                        <p className="text-sm text-gray-400">Log when members join via invites</p>
                      </div>
                      <Switch
                        id="track-joins"
                        checked={serverConfig.invite_tracking?.track_joins || false}
                        onCheckedChange={(checked) =>
                          updateServerConfig({
                            invite_tracking: {
                              ...serverConfig.invite_tracking,
                              track_joins: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="track-leaves" className="text-white">
                          Track Member Leaves
                        </Label>
                        <p className="text-sm text-gray-400">Log when members leave the server</p>
                      </div>
                      <Switch
                        id="track-leaves"
                        checked={serverConfig.invite_tracking?.track_leaves || false}
                        onCheckedChange={(checked) =>
                          updateServerConfig({
                            invite_tracking: {
                              ...serverConfig.invite_tracking,
                              track_leaves: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ticket System Card */}
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
      )}

      {/* Ticket System */}
      {activeSupportSection === "tickets" && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => setActiveSupportSection(null)}
            className="text-white hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2 text-white" />
            Back to Support
          </Button>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-xl">
                <MessageSquare className="h-6 w-6 mr-3" />
                Ticket System
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure ticket system and customize embed appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white text-base">Enable Ticket System</h3>
                  <p className="text-sm text-gray-400">Allow users to create support tickets</p>
                </div>
                <Switch
                  checked={serverConfig.support?.ticket_system?.enabled || false}
                  onCheckedChange={(checked) =>
                    updateServerConfig({
                      support: {
                        ...serverConfig.support,
                        ticket_system: {
                          ...serverConfig.support.ticket_system,
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

              {serverConfig.support?.ticket_system?.enabled && (
                <div className="space-y-6">
                  {/* Embed Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium">Embed Preview</h4>
                      <Dialog open={showEmbedSettings} onOpenChange={setShowEmbedSettings}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
                          >
                            <Settings className="h-4 w-4 mr-2 text-white" />
                            Customize
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Customize Embed</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Customize the appearance of your ticket embed
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-white text-sm mb-2 block">Title</Label>
                              <Input
                                placeholder="Support Ticket"
                                value={serverConfig.support.ticket_system.embed?.title || ""}
                                onChange={(e) =>
                                  updateServerConfig({
                                    support: {
                                      ...serverConfig.support,
                                      ticket_system: {
                                        ...serverConfig.support.ticket_system,
                                        embed: {
                                          ...serverConfig.support.ticket_system.embed,
                                          title: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                              />
                            </div>

                            <div>
                              <Label className="text-white text-sm mb-2 block">Description</Label>
                              <Textarea
                                placeholder="Click the button below to create a support ticket."
                                value={serverConfig.support.ticket_system.embed?.description || ""}
                                onChange={(e) =>
                                  updateServerConfig({
                                    support: {
                                      ...serverConfig.support,
                                      ticket_system: {
                                        ...serverConfig.support.ticket_system,
                                        embed: {
                                          ...serverConfig.support.ticket_system.embed,
                                          description: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-white text-sm mb-2 block">Color</Label>
                                <Input
                                  type="color"
                                  value={serverConfig.support.ticket_system.embed?.color || "#5865F2"}
                                  onChange={(e) =>
                                    updateServerConfig({
                                      support: {
                                        ...serverConfig.support,
                                        ticket_system: {
                                          ...serverConfig.support.ticket_system,
                                          embed: {
                                            ...serverConfig.support.ticket_system.embed,
                                            color: e.target.value,
                                          },
                                        },
                                      },
                                    })
                                  }
                                  className="bg-black/60 border-white/20 h-10"
                                />
                              </div>

                              <div>
                                <Label className="text-white text-sm mb-2 block">Thumbnail URL</Label>
                                <Input
                                  placeholder="https://example.com/image.png"
                                  value={serverConfig.support.ticket_system.embed?.thumbnail || ""}
                                  onChange={(e) =>
                                    updateServerConfig({
                                      support: {
                                        ...serverConfig.support,
                                        ticket_system: {
                                          ...serverConfig.support.ticket_system,
                                          embed: {
                                            ...serverConfig.support.ticket_system.embed,
                                            thumbnail: e.target.value,
                                          },
                                        },
                                      },
                                    })
                                  }
                                  className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-white text-sm mb-2 block">Footer Text</Label>
                              <Input
                                placeholder="Support Team"
                                value={serverConfig.support.ticket_system.embed?.footer || ""}
                                onChange={(e) =>
                                  updateServerConfig({
                                    support: {
                                      ...serverConfig.support,
                                      ticket_system: {
                                        ...serverConfig.support.ticket_system,
                                        embed: {
                                          ...serverConfig.support.ticket_system.embed,
                                          footer: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Preview */}
                    <div
                      className="border-l-4 bg-gray-800/50 p-4 rounded-r-lg"
                      style={{ borderLeftColor: serverConfig.support.ticket_system.embed?.color || "#5865F2" }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {serverConfig.support.ticket_system.embed?.title && (
                            <h3 className="text-white font-semibold mb-2">
                              {serverConfig.support.ticket_system.embed?.title}
                            </h3>
                          )}
                          {serverConfig.support.ticket_system.embed?.description && (
                            <p className="text-gray-300">{serverConfig.support.ticket_system.embed?.description}</p>
                          )}
                        </div>
                        {serverConfig.support.ticket_system.embed?.thumbnail && (
                          <div className="ml-4">
                            <Image
                              src={serverConfig.support.ticket_system.embed?.thumbnail || "/placeholder.svg"}
                              alt="Thumbnail"
                              width={50}
                              height={50}
                              className="rounded-md"
                            />
                          </div>
                        )}
                      </div>
                      {serverConfig.support.ticket_system.embed?.footer && (
                        <p className="text-gray-400 text-sm mt-2">{serverConfig.support.ticket_system.embed?.footer}</p>
                      )}
                    </div>
                  </div>

                  {/* Category Select */}
                  <div>
                    <Label className="text-white text-sm mb-2 block">Ticket Category</Label>
                    <Select
                      value={serverConfig.support?.ticket_system?.channel_id || ""}
                      onValueChange={(value) =>
                        updateServerConfig({
                          support: {
                            ...serverConfig.support,
                            ticket_system: {
                              ...serverConfig.support.ticket_system,
                              channel_id: value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="bg-black/60 border-white/20 h-8">
                        <SelectValue placeholder="Select a category" />
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

                  {/* Send Embed Button */}
                  <Button onClick={sendTicketEmbed} className="bg-white text-black hover:bg-gray-100">
                    Send Ticket Embed
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Flag Staff Warning Dialog */}
      <Dialog open={showFlagStaffWarning} onOpenChange={setShowFlagStaffWarning}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Flag className="h-5 w-5 mr-2 text-white" />
              Flag Staff Member
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to flag this staff member?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Flagging a staff member will reduce their reputation score to 5. This action is irreversible for the
              current reputation cycle.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFlagStaffWarning(false)}
              className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={confirmFlagStaff} className="bg-white text-black hover:bg-gray-100">
              Flag Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
