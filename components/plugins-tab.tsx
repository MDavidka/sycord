"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Plus,
  Download,
  Check,
  X,
  Edit,
  Trash2,
  ImageIcon,
  Bot,
  Save,
  ArrowLeft,
  Power,
  Code,
} from "lucide-react"
import Image from "next/image"
import type { Plugin, UserPlugin } from "@/lib/types"

export default function PluginsTab() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.email === "dmarton336@gmail.com"

  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [newPluginName, setNewPluginName] = useState("")
  const [newPluginDescription, setNewPluginDescription] = useState("")
  const [newPluginIconUrl, setNewPluginIconUrl] = useState("")
  const [newPluginThumbnailUrl, setNewPluginThumbnailUrl] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [activeTab, setActiveTab] = useState("store")
  const [showAiCreator, setShowAiCreator] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [pluginName, setPluginName] = useState("")
  const [pluginDescription, setPluginDescription] = useState("")
  const [pluginProfileImage, setPluginProfileImage] = useState("")
  const [pluginHeaderImage, setPluginHeaderImage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const [editPluginId, setEditPluginId] = useState<string | null>(null)
  const [editPluginName, setEditPluginName] = useState("")
  const [editPluginDescription, setEditPluginDescription] = useState("")
  const [editPluginActive, setEditPluginActive] = useState(false)
  const [editPluginIconUrl, setEditPluginIconUrl] = useState("")
  const [editPluginThumbnailUrl, setEditPluginThumbnailUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchPlugins()
    fetchUserPlugins()
  }, [])

  const fetchPlugins = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/plugins")
      if (response.ok) {
        const data = await response.json()
        setPlugins(data.plugins)
      }
    } catch (error) {
      console.error("Error fetching plugins:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPlugins = async () => {
    try {
      const response = await fetch("/api/user-plugins")
      if (response.ok) {
        const data = await response.json()
        setUserPlugins(data.installedPlugins)
      }
    } catch (error) {
      console.error("Error fetching user plugins:", error)
    }
  }

  const handleCreatePlugin = async () => {
    try {
      const response = await fetch("/api/plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPluginName,
          description: newPluginDescription,
          iconUrl: newPluginIconUrl,
          thumbnailUrl: newPluginThumbnailUrl,
        }),
      })
      if (response.ok) {
        setNewPluginName("")
        setNewPluginDescription("")
        setNewPluginIconUrl("")
        setNewPluginThumbnailUrl("")
        setIsCreateDialogOpen(false)
        fetchPlugins()
      } else {
        console.error("Failed to create plugin")
      }
    } catch (error) {
      console.error("Error creating plugin:", error)
    }
  }

  const handleGeneratePlugin = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    setGeneratedCode("")

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: aiPrompt,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedCode(data.code)
        const words = aiPrompt.split(" ").slice(0, 3).join(" ")
        setPluginName(words.charAt(0).toUpperCase() + words.slice(1) + " Plugin")
        setPluginDescription(aiPrompt.length > 100 ? aiPrompt.substring(0, 100) + "..." : aiPrompt)
      } else {
        const errorData = await response.json()
        console.error("Failed to generate plugin code:", errorData.error)
        setGeneratedCode(`// Error: ${errorData.error || "Failed to generate plugin code. Please try again."}`)
      }
    } catch (error) {
      console.error("Error generating plugin:", error)
      setGeneratedCode("// Error: Failed to connect to AI service. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePlugin = async () => {
    if (!generatedCode || !pluginName.trim()) return

    setIsSaving(true)
    try {
      const createResponse = await fetch("/api/plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: pluginName,
          description: pluginDescription,
          iconUrl: pluginProfileImage || "/sycord-logo.png",
          thumbnailUrl: pluginHeaderImage || "",
          code: generatedCode,
          aiGenerated: true,
          userCreated: true,
        }),
      })

      if (createResponse.ok) {
        const newPlugin = await createResponse.json()

        const installResponse = await fetch("/api/user-plugins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pluginId: newPlugin.plugin._id,
            action: "install",
          }),
        })

        if (installResponse.ok) {
          await fetchPlugins()
          await fetchUserPlugins()
          setShowSaveDialog(false)
          setShowAiCreator(false)
          setActiveTab("installed")
          setAiPrompt("")
          setGeneratedCode("")
          setPluginName("")
          setPluginDescription("")
          setPluginProfileImage("")
          setPluginHeaderImage("")
        }
      }
    } catch (error) {
      console.error("Error saving plugin:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${pluginName.replace(/\s+/g, "_").toLowerCase()}.py`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleInstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId, action: "install" }),
      })
      if (response.ok) {
        fetchUserPlugins()
        fetchPlugins()
      } else {
        console.error("Failed to install plugin")
      }
    } catch (error) {
      console.error("Error installing plugin:", error)
    }
  }

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId, action: "uninstall" }),
      })
      if (response.ok) {
        fetchUserPlugins()
        fetchPlugins()
      } else {
        console.error("Failed to uninstall plugin")
      }
    } catch (error) {
      console.error("Error uninstalling plugin:", error)
    }
  }

  const handleEditPlugin = (plugin: Plugin) => {
    setEditPluginId(plugin._id)
    setEditPluginName(plugin.name)
    setEditPluginDescription(plugin.description)
    setEditPluginActive(plugin.active)
    setEditPluginIconUrl(plugin.iconUrl || "")
    setEditPluginThumbnailUrl(plugin.thumbnailUrl || "")
    setIsEditDialogOpen(true)
  }

  const handleUpdatePlugin = async () => {
    if (!editPluginId) return
    try {
      const response = await fetch("/api/plugins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: editPluginId,
          name: editPluginName,
          description: editPluginDescription,
          active: editPluginActive,
          iconUrl: editPluginIconUrl,
          thumbnailUrl: editPluginThumbnailUrl,
        }),
      })
      if (response.ok) {
        setIsEditDialogOpen(false)
        fetchPlugins()
      } else {
        console.error("Failed to update plugin")
      }
    } catch (error) {
      console.error("Error updating plugin:", error)
    }
  }

  const handleDeletePlugin = async (pluginId: string) => {
    if (!window.confirm("Are you sure you want to delete this plugin?")) return
    try {
      const response = await fetch("/api/plugins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: pluginId }),
      })
      if (response.ok) {
        fetchPlugins()
      } else {
        console.error("Failed to delete plugin")
      }
    } catch (error) {
      console.error("Error deleting plugin:", error)
    }
  }

  const isPluginInstalled = (pluginId: string) => {
    return userPlugins.some((p) => p.pluginId === pluginId)
  }

  if (loading) {
    return (
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
        <p>Loading plugins...</p>
      </div>
    )
  }

  if (showAiCreator) {
    return (
      <div className="space-y-6 min-h-screen">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAiCreator(false)}
                  className="text-white hover:bg-white/10 mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Plugins
                </Button>
                <CardTitle className="text-white flex items-center text-xl">
                  <Image src="/sycord-logo.png" alt="Sycord" width={28} height={28} className="mr-3" />
                  AI Plugin Creator
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Create custom Discord bot plugins using AI. Describe what you want and let Sycord generate the code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-[calc(100vh-300px)]">
              {/* Chat Panel */}
              <Card className="glass-card flex flex-col h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center text-lg">
                    <Bot className="h-5 w-5 mr-2" />
                    Describe Your Plugin
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Tell the AI what functionality you want your Discord bot plugin to have.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <Textarea
                    placeholder="Example: Create a moderation plugin that can ban, kick, and mute users with logging to a specific channel. Include slash commands and permission checks..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="bg-black/60 border-white/20 text-white placeholder-gray-400 flex-1 resize-none text-base leading-relaxed"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={handleGeneratePlugin}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white hover:opacity-90 py-4 mt-4 text-lg"
                  >
                    <Image src="/sycord-logo.png" alt="Sycord" width={24} height={24} className="mr-3" />
                    {isGenerating ? "Generating Plugin..." : "Generate Plugin"}
                  </Button>
                </CardContent>
              </Card>

              {/* Code Editor Panel */}
              <Card className="glass-card flex flex-col h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Generated Code
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Review your generated plugin code and save it to your collection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {isGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      <div className="w-20 h-20 relative">
                        <Image
                          src="/sycord-logo.png"
                          alt="Sycord Bot"
                          width={80}
                          height={80}
                          className="animate-pulse"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-xl animate-pulse">sycord is working</p>
                        <p className="text-gray-400 mt-2">Generating your plugin code...</p>
                      </div>
                    </div>
                  ) : generatedCode ? (
                    <div className="flex-1 flex flex-col space-y-4">
                      <div className="bg-gray-900 border border-white/20 rounded-lg overflow-hidden flex-1 flex flex-col">
                        <div className="p-4 border-b border-white/20 bg-gray-800 flex justify-between items-center">
                          <p className="text-white font-medium">Plugin Code</p>
                          <div className="flex gap-3">
                            <Button
                              onClick={handleDownloadCode}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              onClick={() => setShowSaveDialog(true)}
                              disabled={!pluginName.trim()}
                              size="sm"
                              className="bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white hover:opacity-90"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Plugin
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                          <pre className="p-6 text-sm text-gray-300 h-full">
                            <code>{generatedCode}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      <Bot className="h-16 w-16 text-gray-400 opacity-50" />
                      <div>
                        <p className="text-gray-400 text-xl mb-2">Ready to create</p>
                        <p className="text-gray-500">Describe your plugin to get started with AI generation</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-[500px] bg-black border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center">
                <Save className="h-5 w-5 mr-2" />
                Save Plugin
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure your plugin details before saving to your collection.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plugin-name" className="text-white text-sm font-medium">
                    Plugin Name *
                  </Label>
                  <Input
                    id="plugin-name"
                    value={pluginName}
                    onChange={(e) => setPluginName(e.target.value)}
                    className="mt-2 bg-black/60 border-white/20 text-white"
                    placeholder="Enter plugin name"
                  />
                </div>
                <div>
                  <Label htmlFor="plugin-description" className="text-white text-sm font-medium">
                    Description
                  </Label>
                  <Input
                    id="plugin-description"
                    value={pluginDescription}
                    onChange={(e) => setPluginDescription(e.target.value)}
                    className="mt-2 bg-black/60 border-white/20 text-white"
                    placeholder="Brief description"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile-image" className="text-white text-sm font-medium">
                    Profile Image URL
                  </Label>
                  <Input
                    id="profile-image"
                    value={pluginProfileImage}
                    onChange={(e) => setPluginProfileImage(e.target.value)}
                    className="mt-2 bg-black/60 border-white/20 text-white"
                    placeholder="https://example.com/icon.png"
                  />
                </div>
                <div>
                  <Label htmlFor="header-image" className="text-white text-sm font-medium">
                    Header Image URL
                  </Label>
                  <Input
                    id="header-image"
                    value={pluginHeaderImage}
                    onChange={(e) => setPluginHeaderImage(e.target.value)}
                    className="mt-2 bg-black/60 border-white/20 text-white"
                    placeholder="https://example.com/header.png"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePlugin}
                disabled={isSaving || !pluginName.trim()}
                className="bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white hover:opacity-90"
              >
                {isSaving ? "Saving..." : "Save Plugin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card min-h-[calc(100vh-200px)]">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Package className="h-6 w-6 mr-3" />
            Plugin Management
          </CardTitle>
          <CardDescription className="text-gray-400">
            Browse, install, and manage plugins for your server.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 mb-6">
              <TabsTrigger
                value="store"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Plugin Store
              </TabsTrigger>
              <TabsTrigger
                value="installed"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Installed Plugins
              </TabsTrigger>
            </TabsList>

            <TabsContent value="store" className="flex-1">
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {isAdmin && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-white text-black hover:bg-gray-200">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Plugin
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-black border-white/20 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Plugin</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Fill in the details for your new plugin.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right text-white">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={newPluginName}
                            onChange={(e) => setNewPluginName(e.target.value)}
                            className="col-span-3 bg-black/60 border-white/20 text-white"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="description" className="text-right text-white">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={newPluginDescription}
                            onChange={(e) => setNewPluginDescription(e.target.value)}
                            className="col-span-3 bg-black/60 border-white/20 text-white min-h-[80px]"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="iconUrl" className="text-right text-white">
                            Icon URL
                          </Label>
                          <Input
                            id="iconUrl"
                            value={newPluginIconUrl}
                            onChange={(e) => setNewPluginIconUrl(e.target.value)}
                            placeholder="https://example.com/icon.png"
                            className="col-span-3 bg-black/60 border-white/20 text-white"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="thumbnailUrl" className="text-right text-white">
                            Thumbnail URL
                          </Label>
                          <Input
                            id="thumbnailUrl"
                            value={newPluginThumbnailUrl}
                            onChange={(e) => setNewPluginThumbnailUrl(e.target.value)}
                            placeholder="https://example.com/thumbnail.png"
                            className="col-span-3 bg-black/60 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreatePlugin} className="bg-white text-black hover:bg-gray-200">
                          Create Plugin
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                <Button
                  onClick={() => setShowAiCreator(true)}
                  className="bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white hover:opacity-90 transition-opacity flex items-center justify-center px-4 py-2 sm:px-6"
                >
                  <Image src="/sycord-logo.png" alt="Sycord" width={20} height={20} className="mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Create Plugin Using AI</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plugins.map((plugin) => (
                  <Card key={plugin._id} className="glass-card flex flex-col">
                    {plugin.thumbnailUrl && plugin.thumbnailUrl !== "" ? (
                      <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                        <Image
                          src={plugin.thumbnailUrl || "/placeholder.svg"}
                          alt={`${plugin.name} thumbnail`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-t-lg"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-32 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <CardHeader className="flex-row items-center space-x-4 pb-2">
                      {plugin.iconUrl && plugin.iconUrl !== "" ? (
                        <Image
                          src={plugin.iconUrl || "/placeholder.svg"}
                          alt={`${plugin.name} icon`}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-white text-lg">{plugin.name}</CardTitle>
                        <CardDescription className="text-gray-400 text-sm">{plugin.installs} installs</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <p className="text-gray-300 text-sm mb-4">{plugin.description}</p>
                      <div className="flex justify-end space-x-2">
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPlugin(plugin)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePlugin(plugin._id)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isPluginInstalled(plugin._id) ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            className="bg-gray-600 text-white cursor-not-allowed"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Installed
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleInstallPlugin(plugin._id)}
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Install
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="installed" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPlugins.length === 0 ? (
                  <p className="text-gray-400 col-span-full text-center">No plugins installed yet.</p>
                ) : (
                  userPlugins.map((plugin) => (
                    <Card key={plugin.pluginId} className="glass-card flex flex-col">
                      {plugin.thumbnailUrl && plugin.thumbnailUrl !== "" ? (
                        <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                          <Image
                            src={plugin.thumbnailUrl || "/placeholder.svg"}
                            alt={`${plugin.name} thumbnail`}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-t-lg"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-32 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <CardHeader className="flex-row items-center space-x-4 pb-2">
                        {plugin.iconUrl && plugin.iconUrl !== "" ? (
                          <Image
                            src={plugin.iconUrl || "/placeholder.svg"}
                            alt={`${plugin.name} icon`}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-white text-lg">{plugin.name}</CardTitle>
                            {plugin.aiGenerated && (
                              <div className="flex items-center bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] px-2 py-1 rounded-full">
                                <Bot className="h-3 w-3 text-white mr-1" />
                                <span className="text-xs text-white font-medium">AI</span>
                              </div>
                            )}
                          </div>
                          <CardDescription className="text-gray-400 text-sm">
                            Installed on: {new Date(plugin.installed_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between">
                        <p className="text-gray-300 text-sm mb-4">{plugin.description}</p>
                        <div className="flex justify-between items-center">
                          {plugin.aiGenerated && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-500/50 text-green-400 hover:bg-green-500/10 bg-transparent"
                              >
                                <Power className="h-3 w-3 mr-1" />
                                Active
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                              >
                                <Code className="h-3 w-3 mr-1" />
                                Edit Code
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUninstallPlugin(plugin.pluginId)}
                            className="ml-auto"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Uninstall
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px] bg-black border-white/20 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Plugin</DialogTitle>
                <DialogDescription className="text-gray-400">Make changes to the plugin details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right text-white">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editPluginName}
                    onChange={(e) => setEditPluginName(e.target.value)}
                    className="col-span-3 bg-black/60 border-white/20 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right text-white">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editPluginDescription}
                    onChange={(e) => setEditPluginDescription(e.target.value)}
                    className="col-span-3 bg-black/60 border-white/20 text-white min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-iconUrl" className="text-right text-white">
                    Icon URL
                  </Label>
                  <Input
                    id="edit-iconUrl"
                    value={editPluginIconUrl}
                    onChange={(e) => setEditPluginIconUrl(e.target.value)}
                    placeholder="https://example.com/icon.png"
                    className="col-span-3 bg-black/60 border-white/20 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-thumbnailUrl" className="text-right text-white">
                    Thumbnail URL
                  </Label>
                  <Input
                    id="edit-thumbnailUrl"
                    value={editPluginThumbnailUrl}
                    onChange={(e) => setEditPluginThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/thumbnail.png"
                    className="col-span-3 bg-black/60 border-white/20 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-active" className="text-right text-white">
                    Active
                  </Label>
                  <Switch
                    id="edit-active"
                    checked={editPluginActive}
                    onCheckedChange={setEditPluginActive}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdatePlugin} className="bg-white text-black hover:bg-gray-200">
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
