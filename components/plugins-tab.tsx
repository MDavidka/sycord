"use client"

import { useState, useEffect, useRef } from "react"
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
import { Package, Plus, Download, Check, X, Edit, Trash2, ImageIcon, Bot, ArrowLeft, Save, Send } from "lucide-react"
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

  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [pluginName, setPluginName] = useState("")
  const [pluginDescription, setPluginDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([])

  const [editPluginId, setEditPluginId] = useState<string | null>(null)
  const [editPluginName, setEditPluginName] = useState("")
  const [editPluginDescription, setEditPluginDescription] = useState("")
  const [editPluginActive, setEditPluginActive] = useState(false)
  const [editPluginIconUrl, setEditPluginIconUrl] = useState("")
  const [editPluginThumbnailUrl, setEditPluginThumbnailUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPlugins()
    fetchUserPlugins()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
      }
    } catch (error) {
      console.error("Error creating plugin:", error)
    }
  }

  const handleGeneratePlugin = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    setMessages(prev => [...prev, { role: "user", content: aiPrompt }])
    setAiPrompt("")
    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: aiPrompt }),
      })
      if (response.ok) {
        const data = await response.json()
        setGeneratedCode(data.code)
        setMessages(prev => [...prev, { role: "ai", content: `Generated plugin code for: "${aiPrompt}"` }])
        const words = aiPrompt.split(" ").slice(0, 3).join(" ")
        setPluginName(words.charAt(0).toUpperCase() + words.slice(1) + " Plugin")
        setPluginDescription(aiPrompt.length > 100 ? aiPrompt.substring(0, 100) + "..." : aiPrompt)
      } else {
        const errorData = await response.json()
        setMessages(prev => [...prev, { role: "ai", content: `Error: ${errorData.error || "Failed to generate plugin code."}` }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: "Error: Failed to connect to AI service." }])
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
          iconUrl: "/generic-robot-icon.png",
          thumbnailUrl: "",
          code: generatedCode,
          aiGenerated: true,
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
          setIsAICreatorOpen(false)
          setAiPrompt("")
          setGeneratedCode("")
          setPluginName("")
          setPluginDescription("")
          setMessages([])
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
      if (response.ok) fetchPlugins()
    } catch (error) {
      console.error("Error deleting plugin:", error)
    }
  }

  const isPluginInstalled = (pluginId: string) => userPlugins.some((p) => p.pluginId === pluginId)

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p>Loading plugins...</p>
        </div>
      </div>
    )
  }

  if (isAICreatorOpen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAICreatorOpen(false)
              setAiPrompt("")
              setGeneratedCode("")
              setPluginName("")
              setPluginDescription("")
              setMessages([])
            }}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plugins
          </Button>
          <h1 className="text-xl font-semibold text-white flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            AI Plugin Lab
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDownloadCode}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleSavePlugin}
              disabled={isSaving || !pluginName.trim()}
              className="bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white hover:opacity-90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Plugin"}
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/3 border-r border-white/20 flex flex-col">
            <div className="p-4 border-b border-white/20">
              <h2 className="text-lg font-medium text-white mb-2">Chat with AI</h2>
              <p className="text-sm text-gray-400">
                Describe what you want your plugin to do.
              </p>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-[#4A90E2] text-white"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-800 text-gray-200 animate-pulse">
                    AI is thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-white/20">
              <div className="relative">
                <Textarea
                  placeholder="Describe your plugin..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleGeneratePlugin()
                    }
                  }}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[60px] resize-none pr-10"
                  disabled={isGenerating}
                />
                <Button
                  size="sm"
                  className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full"
                  onClick={handleGeneratePlugin}
                  disabled={isGenerating || !aiPrompt.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={pluginName}
                  onChange={(e) => setPluginName(e.target.value)}
                  placeholder="Plugin Name"
                  className="bg-black/60 border-white/20 text-white"
                />
                <Input
                  value={pluginDescription}
                  onChange={(e) => setPluginDescription(e.target.value)}
                  placeholder="Description"
                  className="bg-black/60 border-white/20 text-white"
                />
              </div>
            </div>
            <div className="flex-1 p-4">
              <div className="h-full bg-gray-900 border border-white/20 rounded-lg overflow-hidden">
                <div className="p-3 border-b border-white/20 bg-gray-800 flex justify-between items-center">
                  <p className="text-sm text-gray-300">Generated Code (editable)</p>
                </div>
                <textarea
                  value={generatedCode}
                  onChange={(e) => setGeneratedCode(e.target.value)}
                  className="p-4 text-sm text-gray-300 bg-gray-900 w-full h-full resize-none outline-none font-mono"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <h1 className="text-xl font-semibold text-white flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Plugin Management
        </h1>
        <div className="flex items-center space-x-2">
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
            onClick={() => setIsAICreatorOpen(true)}
            className="bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white hover:opacity-90"
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Plugin Lab
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="store" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
            <TabsTrigger value="store" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Plugin Store
            </TabsTrigger>
            <TabsTrigger value="installed" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Installed Plugins
            </TabsTrigger>
          </TabsList>
          <TabsContent value="store" className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map((plugin) => (
                <Card key={plugin._id} className="glass-card flex flex-col">
                  {plugin.thumbnailUrl ? (
                    <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                      <Image
                        src={plugin.thumbnailUrl}
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
                    {plugin.iconUrl ? (
                      <Image
                        src={plugin.iconUrl}
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
          <TabsContent value="installed" className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPlugins.length === 0 ? (
                <p className="text-gray-400 col-span-full text-center">No plugins installed yet.</p>
              ) : (
                userPlugins.map((plugin) => (
                  <Card key={plugin.pluginId} className="glass-card flex flex-col">
                    {plugin.thumbnailUrl ? (
                      <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                        <Image
                          src={plugin.thumbnailUrl}
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
                      {plugin.iconUrl ? (
                        <Image
                          src={plugin.iconUrl}
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
                        <CardDescription className="text-gray-400 text-sm">
                          Installed on: {new Date(plugin.installed_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <p className="text-gray-300 text-sm mb-4">{plugin.description}</p>
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => {
                            setEditPluginId(plugin.pluginId)
                            setIsAICreatorOpen(true)
                            setAiPrompt(`Edit this plugin: ${plugin.description}`)
                          }}
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          AI Lab
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUninstallPlugin(plugin.pluginId)}
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
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-black border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Plugin</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to the plugin details.
            </DialogDescription>
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
    </div>
  )
}
