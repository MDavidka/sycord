"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Filter,
  LinkIcon,
  FileText,
  Users,
  MessageCircle,
  Crown,
  Eye,
  Bot,
  AlertTriangle,
  Info,
  Zap,
  Lock,
  Webhook,
  BarChart3,
  CheckCircle,
} from "lucide-react"
import Image from "next/image"

interface SentinelTabProps {
  serverConfig: any
  updateServerConfig: (updates: any) => void
}

export default function SentinelTab({ serverConfig, updateServerConfig }: SentinelTabProps) {
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showLockdownWarning, setShowLockdownWarning] = useState(false)
  const [showStaffInsightsModal, setShowStaffInsightsModal] = useState(false)

  // Add function to handle moderation level changes
  const handleModerationLevelChange = (level: "off" | "on" | "lockdown") => {
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

  return (
    <div className="space-y-6">
      {/* Moderation Level Selector - Smaller buttons */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-white flex items-center text-xl">
                <Shield className="h-6 w-6 mr-3" />
                Moderation Level
              </CardTitle>
              <CardDescription className="text-gray-400">Choose your server's security level</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInfoModal(true)}
              className="border-gray-500/50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 w-full sm:w-auto"
            >
              <Info className="h-4 w-4 mr-2" />
              How we trained our bot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Smaller buttons side by side */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={serverConfig.moderation_level === "off" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModerationLevelChange("off")}
              className={`${
                serverConfig.moderation_level === "off"
                  ? "bg-white text-black"
                  : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Shield className="h-3 w-3 mr-1" />
              Off
            </Button>

            <Button
              variant={serverConfig.moderation_level === "on" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModerationLevelChange("on")}
              className={`${
                serverConfig.moderation_level === "on"
                  ? "bg-white text-black"
                  : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Shield className="h-3 w-3 mr-1" />
              On
            </Button>

            <Button
              variant={serverConfig.moderation_level === "lockdown" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModerationLevelChange("lockdown")}
              className={`${
                serverConfig.moderation_level === "lockdown"
                  ? "bg-white text-black"
                  : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Lockdown
            </Button>
          </div>

          {serverConfig.moderation_level === "lockdown" && (
            <Alert className="mt-4 border-gray-500/30 bg-gray-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-gray-400">
                Lockdown mode enables all security features. Your server will have maximum protection but some
                legitimate activities may be restricted.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Staff Insights Miniblock */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <BarChart3 className="h-4 w-4 mr-2" />
              Staff Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Enable Insights</span>
              <Switch
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStaffInsightsModal(true)}
              className="w-full border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent text-xs"
            >
              How to use
            </Button>
          </CardContent>
        </Card>

        {/* Bad Word Filter */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <Filter className="h-4 w-4 mr-2" />
              Bad Word Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Enable Filter</span>
              <Switch
                checked={serverConfig.moderation.bad_word_filter.enabled}
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
          </CardContent>
        </Card>

        {/* Link Filter */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <LinkIcon className="h-4 w-4 mr-2" />
              Link Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Enable Scanner</span>
              <Switch
                checked={serverConfig.moderation.link_filter.enabled}
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
          </CardContent>
        </Card>

        {/* Document Filter */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <FileText className="h-4 w-4 mr-2" />
              Document Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Enable Scanner</span>
              <Switch
                checked={serverConfig.moderation.malicious_file_scanner.enabled}
                onCheckedChange={(checked) =>
                  updateServerConfig({
                    moderation: {
                      ...serverConfig.moderation,
                      malicious_file_scanner: {
                        ...serverConfig.moderation.malicious_file_scanner,
                        enabled: checked,
                      },
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Separator Line */}
      <div className="border-t border-white/20"></div>

      {/* Community Management */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Community Management
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mass Ping Protection */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-base">
                <MessageCircle className="h-4 w-4 mr-2" />
                Mass Ping Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Enable Protection</span>
                <Switch
                  checked={serverConfig.moderation.mass_ping_protection.enabled}
                  onCheckedChange={(checked) =>
                    updateServerConfig({
                      moderation: {
                        ...serverConfig.moderation,
                        mass_ping_protection: {
                          ...serverConfig.moderation.mass_ping_protection,
                          enabled: checked,
                        },
                      },
                    })
                  }
                />
              </div>
              {serverConfig.moderation.mass_ping_protection.enabled && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-white text-xs mb-1 block">Rate Limit (per minute)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={serverConfig.moderation.mass_ping_protection.mention_rate_limit}
                      onChange={(e) =>
                        updateServerConfig({
                          moderation: {
                            ...serverConfig.moderation,
                            mass_ping_protection: {
                              ...serverConfig.moderation.mass_ping_protection,
                              mention_rate_limit: Number.parseInt(e.target.value) || 5,
                            },
                          },
                        })
                      }
                      className="bg-black/60 border-white/20 text-white h-8"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite Link Protection */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-base">
                <LinkIcon className="h-4 w-4 mr-2" />
                Invite Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Enable Protection</span>
                <Switch
                  checked={serverConfig.moderation.invite_hijacking.enabled}
                  onCheckedChange={(checked) =>
                    updateServerConfig({
                      moderation: {
                        ...serverConfig.moderation,
                        invite_hijacking: { ...serverConfig.moderation.invite_hijacking, enabled: checked },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin & Bots */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Crown className="h-5 w-5 mr-2" />
          Admin & Bots
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Permission Abuse */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-base">
                <Eye className="h-4 w-4 mr-2" />
                Permission Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Enable Monitoring</span>
                <Switch
                  checked={serverConfig.moderation.permission_abuse.enabled}
                  onCheckedChange={(checked) =>
                    updateServerConfig({
                      moderation: {
                        ...serverConfig.moderation,
                        permission_abuse: { ...serverConfig.moderation.permission_abuse, enabled: checked },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Token/Webhook Abuse */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-base">
                <Webhook className="h-4 w-4 mr-2" />
                Webhook Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Enable Protection</span>
                <Switch
                  checked={serverConfig.moderation.token_webhook_abuse.enabled}
                  onCheckedChange={(checked) =>
                    updateServerConfig({
                      moderation: {
                        ...serverConfig.moderation,
                        token_webhook_abuse: { ...serverConfig.moderation.token_webhook_abuse, enabled: checked },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fraud Protection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Fraud Protection
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Malicious Bot Detection */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-base">
                <Bot className="h-4 w-4 mr-2" />
                Bot Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Enable Detection</span>
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
            </CardContent>
          </Card>

          {/* Raid Protection */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-base">
                <Shield className="h-4 w-4 mr-2" />
                Raid Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Enable Protection</span>
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center text-xl">
                  <Zap className="h-6 w-6 mr-3" />
                  How We Trained Our Bot
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfoModal(false)}
                  className="text-white hover:bg-gray-100 hover:text-gray-900"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-gray-300 space-y-4 leading-relaxed">
                <p>
                  We started by researching hundreds of real Discord server compromises, studying how attackers
                  exploited roles, bots, and permissions. Logs, case studies, and community reports helped us identify
                  patterns like sudden role escalations, webhook abuse, and bot-based infiltration.
                </p>
                <p>
                  We analyzed the timing, methods, and impact of phishing links, mass joins, and admin bypasses. By
                  comparing dozens of attacks, we built a deep understanding of both technical and human
                  vulnerabilities.
                </p>
                <p>
                  We analyzed the timing, methods, and impact of phishing links, mass joins, and admin bypasses. By
                  comparing dozens of attacks, we built a deep understanding of both technical and human
                  vulnerabilities.
                </p>
                <p>
                  This research became the foundation for every security function we built into Sycord. Our bot doesn't
                  just follow generic rules - it understands real attack patterns and adapts to protect your server
                  accordingly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lockdown Warning Dialog */}
      <Dialog open={showLockdownWarning} onOpenChange={setShowLockdownWarning}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Lockdown Confirmation
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to activate Lockdown Mode?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Activating lockdown mode will lock all channels in your server, preventing members from sending messages.
              This is intended for severe raid situations.
            </p>
            <div className="flex justify-center">
              <Image
                src="/placeholder.svg?height=150&width=250"
                alt="Lockdown Active"
                width={250}
                height={150}
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLockdownWarning(false)}
              className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={confirmLockdown} className="bg-white text-black hover:bg-gray-100">
              Lock Channels
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
