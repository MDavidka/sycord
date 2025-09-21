"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, Mail, Download, LinkIcon, Eye, EyeOff, Send, Users, Crown } from "lucide-react"
import Link from "next/link"
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
  discriminator: string
  hasAdminAccess: boolean
}

interface Contributor {
  userId: string
  username: string
  avatar?: string
  discriminator: string
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
    try {
      const response = await fetch(`/api/server/${serverId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.userExists) {
          // Refresh contributors list
          fetchContributors()
        }
        setInviteEmail("")
      }
    } catch (error) {
      console.error("Error sending invite:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-6 py-6">
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

        {/* Bot Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <h2 className="text-2xl font-bold text-white">{customBotName || "sycord"}</h2>
            <Button onClick={handleSaveBotSettings} className="bg-white text-black hover:bg-gray-100" size="sm">
              Save Settings
            </Button>
          </div>
          <p className="text-gray-400 mb-2">sycord#9882</p>
        </div>
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
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
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
              className="bg-white text-black hover:bg-gray-100"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-white text-sm">Server Access:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contributors.map((contributor) => (
                <div
                  key={contributor.userId}
                  className="flex items-center space-x-3 p-3 bg-black/40 rounded-lg border border-white/10"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={contributor.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-sm">{contributor.username?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {contributor.username}#{contributor.discriminator}
                    </p>
                    <p className="text-gray-400 text-xs truncate">{contributor.email}</p>
                    <Badge
                      variant="outline"
                      className="text-xs mt-1 bg-green-500/20 text-green-400 border-green-500/50"
                    >
                      {contributor.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
        </CardContent>
      </Card>

      {/* Settings Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card cursor-pointer hover:bg-white/5 transition-colors group">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
              <Mail className="w-6 h-6 text-red-400" />
            </div>
            <CardTitle className="text-white">Report Problem</CardTitle>
            <CardDescription className="text-gray-400">Contact our support team for assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-transparent border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
              variant="outline"
              onClick={() => window.open("mailto:support@sycord.com", "_blank")}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Email Support
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:bg-white/5 transition-colors group">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <Download className="w-6 h-6 text-green-400" />
            </div>
            <CardTitle className="text-white">Manage Data</CardTitle>
            <CardDescription className="text-gray-400">Download your collected user data as JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-transparent border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
              variant="outline"
              onClick={downloadUserData}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer with Terms and Privacy */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
                Terms of Service
              </Button>
              <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0" asChild>
                <Link href="/status">Status</Link>
              </Button>
              <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
                Support
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              <p>© 2024 Sycord. All rights reserved.</p>
              <p className="mt-1">
                We collect minimal data necessary for bot functionality. Your data is never sold or shared with third
                parties.
              </p>
              <p className="mt-1 text-gray-600">Build: 2c7d9</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
