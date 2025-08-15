"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Clock, Gift, FileText, ArrowLeft, Plus, Copy, Check } from "lucide-react"

interface FunctionsTabProps {
  serverConfig: any
  updateServerConfig: (updates: any) => void
  activeEventSection: string
  setActiveEventSection: (section: string) => void
  setActiveTab: (tab: string) => void
  giveawayStep: number
  setGiveawayStep: (step: number) => void
  giveawayData: any
  setGiveawayData: (data: any) => void
  generatedLink: string
  setGeneratedLink: (link: string) => void
  linkCopied: boolean
  setLinkCopied: (copied: boolean) => void
  giveawayCreated: boolean
  setGiveawayCreated: (created: boolean) => void
  handleMethodSelect: (method: "server" | "link") => void
  handleNextStep: () => void
  handlePrevStep: () => void
  handleCreateGiveaway: () => void
  copyLink: () => void
  resetGiveaway: () => void
}

export default function FunctionsTab({
  serverConfig,
  updateServerConfig,
  activeEventSection,
  setActiveEventSection,
  setActiveTab,
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
  handleMethodSelect,
  handleNextStep,
  handlePrevStep,
  handleCreateGiveaway,
  copyLink,
  resetGiveaway,
}: FunctionsTabProps) {
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
                        {serverConfig.automatic_tasks.tasks.map((task: any) => (
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
      default:
        return (
          <div className="space-y-6">
            {activeEventSection === "overview" && (
              <div className="grid grid-cols-1 gap-6">
                <Card
                  className="glass-card cursor-pointer hover:bg-white/5 transition-colors border-2 border-dashed border-white/20"
                  onClick={() => setActiveTab("plugins")}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Add a new function</h3>
                        <p className="text-sm text-gray-400">Explore and add new functionality to your server</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Automatic Tasks Card */}
                <Card
                  className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setActiveEventSection("automatic-task")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Automatic Tasks</h3>
                        <p className="text-sm text-gray-400">Schedule and automate server actions</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Status:</span>
                        <span
                          className={`${serverConfig.automatic_tasks?.enabled ? "text-green-400" : "text-gray-400"}`}
                        >
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
                      <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Gift className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Giveaways</h3>
                        <p className="text-sm text-gray-400">Create and manage server giveaways</p>
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
                        <span className="text-white">3</span>
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
                        <span className="text-white">124</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )
    }
  }

  return <div className="space-y-6">{renderEventContent()}</div>
}
