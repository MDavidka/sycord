"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bot, Mail, Download, LinkIcon, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

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
}: SettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Bot Profile Header */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Bot className="h-6 w-6 mr-3" />
            Bot Configuration
          </CardTitle>
          <CardDescription className="text-gray-400">Customize your bot's appearance and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6">
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
              <h2 className="text-2xl font-bold text-white mb-1">{customBotName || "Sycord"}</h2>
              <p className="text-gray-400 mb-2">Discord Bot</p>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
            </div>
          </div>

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

          <Button onClick={handleSaveBotSettings} className="bg-white text-black hover:bg-gray-100">
            Save Bot Settings
          </Button>
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
                <Link href="/privacy-policy">Privacy Policy</Link>
              </Button>
              <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
                Support
              </Button>
            </div>
            <Separator className="bg-white/20" />
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
