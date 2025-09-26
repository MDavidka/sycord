"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, Send, Users, Crown, Eye, EyeOff } from "lucide-react"
import { useState, useEffect } from "react"

interface SettingsTabProps {
  profilePictureUrl: string
  setProfilePictureUrl: (url: string) => void
  customBotName: string
  setCustomBotName: (name: string) => void
  botToken: string
  setBotToken: (token: string) => void
  showToken: boolean
  setShowToken: (show: boolean) => void
  handleSaveBotSettings: () => void
  downloadUserData: () => void
  serverId: string
}

interface ServerMember {
  userId: string
  username: string
  avatar?: string
  avatar_url?: string
  discriminator: string
  hasAdminAccess: boolean
}

interface Contributor {
  userId: string
  username: string
  avatar?: string
  avatar_url?: string
  email: string
  invitedAt: string
  role: string
}

export default function SettingsTab({
  profilePictureUrl,
  setProfilePictureUrl,
  customBotName,
  setCustomBotName,
  botToken,
  setBotToken,
  showToken,
  setShowToken,
  handleSaveBotSettings,
  downloadUserData,
  serverId,
}: SettingsTabProps) {
  const [adminMembers, setAdminMembers] = useState<ServerMember[]>([])
  const [selectedOwner, setSelectedOwner] = useState<string>("")
  const [inviteEmail, setInviteEmail] = useState<string>("")
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showBotConfig, setShowBotConfig] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminMembers()
    fetchContributors()
  }, [serverId])

  const fetchAdminMembers = async () => {
    try {
      const response = await fetch(`/api/server/${serverId}/members`)
      if (response.ok) {
        const data = await response.json()
        setAdminMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching admin members:", error)
    }
  }

  const fetchContributors = async () => {
    try {
      const response = await fetch(`/api/server/${serverId}/invite`)
      if (response.ok) {
        const data = await response.json()
        setContributors(data.contributors || [])
      }
    } catch (error) {
      console.error("Error fetching contributors:", error)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return

    setIsLoading(true)
    setInviteError(null)
    setInviteSuccess(null)

    try {
      const response = await fetch(`/api/server/${serverId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setInviteSuccess(data.message)
        fetchContributors()
        setInviteEmail("")
      } else {
        setInviteError(data.error)
      }
    } catch (error) {
      console.error("Error sending invite:", error)
      setInviteError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        setInviteError(null)
        setInviteSuccess(null)
      }, 5000)
    }
  }

  const handleRevokeContributor = async (userId: string) => {
    try {
      const response = await fetch(`/api/server/${serverId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Refresh contributors list
        fetchContributors()
      }
    } catch (error) {
      console.error("Error revoking contributor access:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4 py-6">
        {/* Bot Avatar */}
        <div className="relative">
          <Avatar className="w-20 h-20 border-4 border-blue-500">
            <AvatarImage src={profilePictureUrl || "/placeholder.svg"} alt="Bot Avatar" />
            <AvatarFallback className="text-2xl font-bold bg-blue-800 text-white">
              {customBotName ? customBotName.charAt(0) : "S"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background"></div>
        </div>

        {/* Bot Info - Centered */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{customBotName || "sycord"}</h2>
          <p className="text-gray-400">sycord#9882</p>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={() => setShowBotConfig(!showBotConfig)}
          className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white border border-white/20 flex items-center justify-center space-x-2"
          variant="outline"
        >
          <Bot className="h-4 w-4" />
          <span>Bot Configuration</span>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">
            BETA
          </Badge>
        </Button>

        {showBotConfig && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-xl">
                <Bot className="h-6 w-6 mr-3" />
                Bot Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">Customize your bot's appearance and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customization Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white text-sm mb-2 block">Bot Name</Label>
                  <Input
                    placeholder="Enter bot name"
                    value={customBotName}
                    onChange={(e) => setCustomBotName(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-white text-sm mb-2 block">Profile Picture URL</Label>
                  <Input
                    placeholder="https://example.com/avatar.png"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white text-sm mb-2 block">Bot Token (Optional)</Label>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="Enter bot token for custom bot"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Leave empty to use the default Sycord bot</p>
              </div>

              <Button onClick={handleSaveBotSettings} className="w-full bg-white text-black hover:bg-gray-100">
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Crown className="h-6 w-6 mr-3" />
            Server Owner
          </CardTitle>
          <CardDescription className="text-gray-400">
            Select the server owner from users with admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedOwner} onValueChange={setSelectedOwner}>
            <SelectTrigger className="bg-black/60 border-white/20 text-white">
              <SelectValue placeholder="Select server owner" />
            </SelectTrigger>
            <SelectContent>
              {adminMembers.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={member.avatar_url || member.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{member.username?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <span>
                      {member.username}#{member.discriminator}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Users className="h-6 w-6 mr-3" />
            Invite Access
          </CardTitle>
          <CardDescription className="text-gray-400">Send invites to users via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="bg-black/60 border-white/20 text-white placeholder-gray-400 flex-1"
              type="email"
            />
            <Button
              onClick={handleSendInvite}
              disabled={isLoading || !inviteEmail.trim()}
              className="bg-gray-800/50 hover:bg-gray-700/50 text-white border border-white/20"
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>

          {inviteError && <p className="text-red-500 text-sm">{inviteError}</p>}
          {inviteSuccess && <p className="text-green-500 text-sm">{inviteSuccess}</p>}

          <div className="space-y-3">
            <Label className="text-white text-sm">Server Access:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contributors.map((contributor) => (
                <div
                  key={contributor.userId}
                  className="flex items-center space-x-3 p-3 bg-black/40 rounded-lg border border-white/10"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={
                        contributor.avatar_url ||
                        `https://cdn.discordapp.com/avatars/${contributor.userId}/${contributor.avatar}.png?size=64`
                      }
                    />
                    <AvatarFallback className="text-sm">{contributor.username?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-white text-sm font-medium truncate">
                        {contributor.username}#{contributor.discriminator}
                      </p>
                      {contributor.role === "admin" ? (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">C</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs truncate">{contributor.email}</p>
                  </div>
                  {contributor.role !== "admin" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30"
                      onClick={() => handleRevokeContributor(contributor.userId)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
