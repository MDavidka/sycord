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
import { Package, Plus, Download, Check, X, Edit, Trash2, ImageIcon, ArrowLeft, Save, Send, Copy, Trash } from "lucide-react"
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
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; isCode?: boolean }[]>([])
  const [editingMetadata, setEditingMetadata] = useState(false)

  const [editPluginId, setEditPluginId] = useState<string | null>(null)
  const [editPluginName, setEditPluginName] = useState("")
  const [editPluginDescription, setEditPluginDescription] = useState("")
  const [editPluginActive, setEditPluginActive] = useState(false)
  const [editPluginIconUrl, setEditPluginIconUrl] = useState("")
  const [editPluginThumbnailUrl, setEditPluginThumbnailUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

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
        setMessages(prev => [
          ...prev,
          { role: "ai", content: `Generated plugin code for: "${aiPrompt}"`, isCode: false },
          { role: "ai", content: data.code, isCode: true }
        ])
        const words = aiPrompt.split(" ").slice(0, 3).join(" ")
        setPluginName(words.charAt(0).toUpperCase() + words.slice(1) + " Plugin")
        setPluginDescription(aiPrompt.length > 100 ? aiPrompt.substring(0, 100) + "..." : aiPrompt)
      } else {
        const errorData = await response.json()
        setMessages(prev => [...prev, { role: "ai", content: `Error: ${errorData.error || "Failed to generate plugin code."}`, isCode: false }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: "Error: Failed to connect to AI service.", isCode: false }])
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
          iconUrl: "https://i.ibb.co/RLVF1Rj/IMG-0362.png",
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
  }

  const handleClearChat = () => {
    const lastCodeMessage = messages.filter(msg => msg.isCode).pop()
    if (lastCodeMessage) {
      setMessages([lastCodeMessage])
    } else {
      setMessages([])
    }
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
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAICreatorOpen(false)
              setAiPrompt("")
              setPluginName("")
              setPluginDescription("")
              setMessages([])
            }}
            className="text-white hover:bg-white/10 p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Image
              src="https://i.ibb.co/RLVF1Rj/IMG-0362.png"
              alt="AI Logo"
              width={32}
              height={32}
              className="rounded"
            />
            {editingMetadata ? (
              <Input
                value={pluginName}
                onChange={(e) => setPluginName(e.target.value)}
                className="text-center bg-transparent border-none focus:ring-0 text-white font-semibold text-lg"
              />
            ) : (
              <h1 className="text-lg font-semibold text-white">{pluginName || "New Plugin"}</h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingMetadata(!editingMetadata)}
              className="text-white hover:bg-white/10 p-1"
            >
              <Save className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-gray-400 hover:text-white p-1"
          >
            <Trash className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-auto p-3" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Image
                src="https://i.ibb.co/RLVF1Rj/IMG-0362.png"
                alt="AI Logo"
                width={64}
                height={64}
                className="mb-4 opacity-50"
              />
              <p className="text-center">Describe your plugin to generate code.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && !msg.isCode && (
                  <Image
                    src="https://i.ibb.co/RLVF1Rj/IMG-0362.png"
                    alt="AI"
                    width={24}
                    height={24}
                    className="mr-2 self-end"
                  />
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-[#4A90E2] text-white rounded-br-none"
                      : msg.isCode
                        ? "bg-gray-800 text-gray-200 w-full"
                        : "bg-gray-800 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.isCode ? (
                    <div className="relative">
                      <pre className="text-sm overflow-x-auto font-mono whitespace-pre-wrap">
                        {msg.content}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={handleCopyCode}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-6"></div>
                )}
              </div>
            ))
          )}
          {isGenerating && (
            <div className="flex justify-start mb-3">
              <Image
                src="https://i.ibb.co/RLVF1Rj/IMG-0362.png"
                alt="AI"
                width={24}
                height={24}
                className="mr-2"
              />
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-800 text-gray-200 rounded-bl-none animate-pulse">
                AI is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-2 border-t border-white/20 bg-black">
          {editingMetadata && (
            <div className="mb-2">
              <Textarea
                value={pluginDescription}
                onChange={(e) => setPluginDescription(e.target.value)}
                placeholder="Plugin description..."
                className="bg-black/60 border-white/20 text-white w-full mb-2"
                rows={2}
              />
            </div>
          )}
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
              className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[50px] resize-none pr-10 w-full rounded-lg"
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
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white"
              onClick={handleSavePlugin}
              disabled={!generatedCode || isSaving}
            >
              {isSaving ? "Saving..." : "Save Plugin"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-white/20 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white flex items-center">
          <Package className="h-6 w-6 mr-2" />
          <span className="hidden sm:inline">Plugin Management</span>
        </h1>
        <div className="flex space-x-1">
          {isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-gray-200 p-2 h-8 w-8 sm:h-auto sm:w-auto sm:px-3">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New</span>
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
                </div>
                <DialogFooter>
                  <Button onClick={handleCreatePlugin} className="bg-white text-black hover:bg-gray-200">
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button
            onClick={() => setIsAICreatorOpen(true)}
            className="bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white hover:opacity-90 p-2 h-8 w-8 sm:h-auto sm:w-auto sm:px-3"
          >
            <Image
              src="https://i.ibb.co/RLVF1Rj/IMG-0362.png"
              alt="AI"
              width={16}
              height={16}
              className="sm:mr-2"
            />
            <span className="hidden sm:inline">AI Lab</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="store" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
          <TabsTrigger value="store" className="text-white data-[state=active]:bg-white data-[state=active]:text-black py-1.5 text-xs sm:text-sm">
            Plugin Store
          </TabsTrigger>
          <TabsTrigger value="installed" className="text-white data-[state=active]:bg-white data-[state=active]:text-black py-1.5 text-xs sm:text-sm">
            Installed
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="store" className="flex-1 overflow-auto p-2 sm:p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {plugins.map((plugin) => (
              <Card key={plugin._id} className="glass-card flex flex-col">
                {plugin.thumbnailUrl ? (
                  <div className="relative w-full h-20 sm:h-28 rounded-t-lg overflow-hidden">
                    <Image
                      src={plugin.thumbnailUrl}
                      alt={`${plugin.name} thumbnail`}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-20 sm:h-28 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                  </div>
                )}
                <CardHeader className="flex-row items-center space-x-2 pb-1.5">
                  {plugin.iconUrl ? (
                    <Image
                      src={plugin.iconUrl}
                      alt={`${plugin.name} icon`}
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-white text-sm sm:text-base truncate">{plugin.name}</CardTitle>
                    <CardDescription className="text-gray-400 text-xs truncate">
                      {plugin.installs} installs
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-1.5 pb-2 px-3 sm:px-4">
                  <p className="text-gray-300 text-xs mb-2 line-clamp-2">{plugin.description}</p>
                  <div className="flex justify-end space-x-1">
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlugin(plugin)}
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0 border-white/20 text-white hover:bg-white/10"
                        >
                          <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlugin(plugin._id)}
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0 border-white/20 text-white hover:bg-white/10"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </>
                    )}
                    {isPluginInstalled(plugin._id) ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        className="h-6 sm:h-7 px-1.5 sm:px-2 bg-gray-600 text-white text-xs"
                      >
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        <span className="hidden sm:inline">Installed</span>
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleInstallPlugin(plugin._id)}
                        className="h-6 sm:h-7 px-1.5 sm:px-2 bg-white text-black text-xs hover:bg-gray-200"
                      >
                        <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        <span className="hidden sm:inline">Install</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="flex-1 overflow-auto p-2 sm:p-3">
          {userPlugins.length === 0 ? (
            <p className="text-gray-400 text-center p-4 text-sm">No plugins installed yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {userPlugins.map((plugin) => (
                <Card key={plugin.pluginId} className="glass-card flex flex-col">
                  {plugin.thumbnailUrl ? (
                    <div className="relative w-full h-20 sm:h-28 rounded-t-lg overflow-hidden">
                      <Image
                        src={plugin.thumbnailUrl}
                        alt={`${plugin.name} thumbnail`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-20 sm:h-28 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                  )}
                  <CardHeader className="flex-row items-center space-x-2 pb-1.5">
                    {plugin.iconUrl ? (
                      <Image
                        src={plugin.iconUrl}
                        alt={`${plugin.name} icon`}
                        width={28}
                        height={28}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-white text-sm sm:text-base truncate">{plugin.name}</CardTitle>
                      <CardDescription className="text-gray-400 text-xs truncate">
                        {new Date(plugin.installed_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1.5 pb-2 px-3 sm:px-4">
                    <p className="text-gray-300 text-xs mb-2 line-clamp-2">{plugin.description}</p>
                    <div className="flex justify-end space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditPluginId(plugin.pluginId)
                          setIsAICreatorOpen(true)
                          setPluginName(plugin.name)
                          setPluginDescription(plugin.description)
                          setMessages([{ role: "ai", content: `Editing: ${plugin.name}\n\n${plugin.description}`, isCode: false }])
                        }}
                        className="h-6 w-6 sm:h-7 sm:w-7 p-0 border-white/20 text-white hover:bg-white/10"
                      >
                        <Image
                          src="https://i.ibb.co/RLVF1Rj/IMG-0362.png"
                          alt="AI"
                          width={14}
                          height={14}
                          className="sm:h-3.5 sm:w-3.5"
                        />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUninstallPlugin(plugin.pluginId)}
                        className="h-6 sm:h-7 px-1.5 sm:px-2"
                      >
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-black border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Plugin</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update plugin details.
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
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
