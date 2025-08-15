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
import { Package, Plus, Download, Check, X, Edit, Trash2, ImageIcon, Bot, ArrowLeft, Save, Send, Copy, CheckCheck } from "lucide-react"
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
  const [copied, setCopied] = useState(false)

  const [editPluginId, setEditPluginId] = useState<string | null>(null)
  const [editPluginName, setEditPluginName] = useState("")
  const [editPluginDescription, setEditPluginDescription] = useState("")
  const [editPluginActive, setEditPluginActive] = useState(false)
  const [editPluginIconUrl, setEditPluginIconUrl] = useState("")
  const [editPluginThumbnailUrl, setEditPluginThumbnailUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchPlugins()
    fetchUserPlugins()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [aiPrompt])

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
        body: JSON.stringify({
          message: `Create a Discord bot using the latest discord.py version with the appropriate intents, based on the user’s request: "${aiPrompt}". Return only the complete Python code, without any explanations, comments, or additional text.`
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setGeneratedCode(data.code)
        setMessages(prev => [...prev, { role: "ai", content: `Here is your generated plugin code:\n\`\`\`python\n${data.code}\n\`\`\`` }])
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <div className="flex items-center justify-between p-3 border-b border-white/20">
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
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Input
              value={pluginName}
              onChange={(e) => setPluginName(e.target.value)}
              placeholder="Plugin Name"
              className="text-white bg-black/50 border-white/20 text-sm"
            />
            <Button
              onClick={handleSavePlugin}
              disabled={isSaving || !pluginName.trim()}
              className="p-2 h-9 w-9"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-[#4A90E2] text-white"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  {msg.content.includes("```python") ? (
                    <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                      {msg.content}
                    </pre>
                  ) : (
                    msg.content
                  )}
                  {msg.role === "ai" && msg.content.includes("```python") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 ml-2 float-right"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <CheckCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="max-w-[90%] p-3 rounded-lg bg-gray-800 text-gray-200 animate-pulse">
                  AI is generating your plugin code...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-white/20 bg-black">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Describe your plugin..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleGeneratePlugin()
                  }
                }}
                className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[50px] max-h-[200px] resize-none pr-10 w-full"
                disabled={isGenerating}
              />
              <Button
                size="sm"
                className="absolute right-3 bottom-3 h-8 w-8 p-0 rounded-full"
                onClick={handleGeneratePlugin}
                disabled={isGenerating || !aiPrompt.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-white/20">
        <h1 className="text-lg font-semibold text-white flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Plugin Management
        </h1>
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-gray-200 text-sm py-1 px-2">
                  <Plus className="h-4 w-4 mr-1" />
                  New
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
                    <Label htmlFor="name" className="text-right text-white text-sm">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newPluginName}
                      onChange={(e) => setNewPluginName(e.target.value)}
                      className="col-span-3 bg-black/60 border-white/20 text-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right text-white text-sm">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newPluginDescription}
                      onChange={(e) => setNewPluginDescription(e.target.value)}
                      className="col-span-3 bg-black/60 border-white/20 text-white min-h-[80px] text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="iconUrl" className="text-right text-white text-sm">
                      Icon URL
                    </Label>
                    <Input
                      id="iconUrl"
                      value={newPluginIconUrl}
                      onChange={(e) => setNewPluginIconUrl(e.target.value)}
                      placeholder="https://example.com/icon.png"
                      className="col-span-3 bg-black/60 border-white/20 text-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="thumbnailUrl" className="text-right text-white text-sm">
                      Thumbnail URL
                    </Label>
                    <Input
                      id="thumbnailUrl"
                      value={newPluginThumbnailUrl}
                      onChange={(e) => setNewPluginThumbnailUrl(e.target.value)}
                      placeholder="https://example.com/thumbnail.png"
                      className="col-span-3 bg-black/60 border-white/20 text-white text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreatePlugin} className="bg-white text-black hover:bg-gray-200 text-sm">
                    Create Plugin
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button
            onClick={() => {
              setIsAICreatorOpen(true)
              setMessages([])
            }}
            className="bg-gradient-to-r from-[#0D2C54] to-[#4A90E2] text-white hover:opacity-90 text-sm py-1 px-2"
          >
            <Bot className="h-4 w-4 mr-1" />
            AI Lab
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="store" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
            <TabsTrigger value="store" className="text-white data-[state=active]:bg-white data-[state=active]:text-black text-sm py-1 px-2">
              Plugin Store
            </TabsTrigger>
            <TabsTrigger value="installed" className="text-white data-[state=active]:bg-white data-[state=active]:text-black text-sm py-1 px-2">
              Installed
            </TabsTrigger>
          </TabsList>
          <TabsContent value="store" className="flex-1 overflow-auto p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plugins.map((plugin) => (
                <Card key={plugin._id} className="glass-card flex flex-col">
                  {plugin.thumbnailUrl ? (
                    <div className="relative w-full h-24 rounded-t-lg overflow-hidden">
                      <Image
                        src={plugin.thumbnailUrl}
                        alt={`${plugin.name} thumbnail`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-24 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <CardHeader className="flex-row items-center space-x-3 pb-2">
                    {plugin.iconUrl ? (
                      <Image
                        src={plugin.iconUrl}
                        alt={`${plugin.name} icon`}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-white text-base">{plugin.name}</CardTitle>
                      <CardDescription className="text-gray-400 text-xs">{plugin.installs} installs</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between p-3">
                    <p className="text-gray-300 text-xs mb-2">{plugin.description}</p>
                    <div className="flex justify-end space-x-1">
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlugin(plugin)}
                            className="border-white/20 text-white hover:bg-white/10 h-7 w-7 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePlugin(plugin._id)}
                            className="border-white/20 text-white hover:bg-white/10 h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {isPluginInstalled(plugin._id) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="bg-gray-600 text-white cursor-not-allowed h-7 text-xs px-2"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Installed
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleInstallPlugin(plugin._id)}
                          className="bg-white text-black hover:bg-gray-200 h-7 text-xs px-2"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Install
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="installed" className="flex-1 overflow-auto p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {userPlugins.length === 0 ? (
                <p className="text-gray-400 col-span-full text-center text-sm">No plugins installed yet.</p>
              ) : (
                userPlugins.map((plugin) => (
                  <Card key={plugin.pluginId} className="glass-card flex flex-col">
                    {plugin.thumbnailUrl ? (
                      <div className="relative w-full h-24 rounded-t-lg overflow-hidden">
                        <Image
                          src={plugin.thumbnailUrl}
                          alt={`${plugin.name} thumbnail`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-t-lg"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-24 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <CardHeader className="flex-row items-center space-x-3 pb-2">
                      {plugin.iconUrl ? (
                        <Image
                          src={plugin.iconUrl}
                          alt={`${plugin.name} icon`}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-white text-base">{plugin.name}</CardTitle>
                        <CardDescription className="text-gray-400 text-xs">
                          {new Date(plugin.installed_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between p-3">
                      <p className="text-gray-300 text-xs mb-2">{plugin.description}</p>
                      <div className="flex justify-end space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 h-7 w-7 p-0"
                          onClick={() => {
                            setEditPluginId(plugin.pluginId)
                            setIsAICreatorOpen(true)
                            setPluginName(plugin.name)
                            setAiPrompt(`Edit this plugin: ${plugin.description}`)
                            setMessages([{ role: "ai", content: `Here is the current code for **${plugin.name}**:\n\`\`\`python\n${plugin.code || "No code available."}\n\`\`\`` }])
                          }}
                        >
                          <Bot className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUninstallPlugin(plugin.pluginId)}
                          className="h-7 text-xs px-2"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
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
              <Label htmlFor="edit-name" className="text-right text-white text-sm">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editPluginName}
                onChange={(e) => setEditPluginName(e.target.value)}
                className="col-span-3 bg-black/60 border-white/20 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right text-white text-sm">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={editPluginDescription}
                onChange={(e) => setEditPluginDescription(e.target.value)}
                className="col-span-3 bg-black/60 border-white/20 text-white min-h-[80px] text-sm"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-iconUrl" className="text-right text-white text-sm">
                Icon URL
              </Label>
              <Input
                id="edit-iconUrl"
                value={editPluginIconUrl}
                onChange={(e) => setEditPluginIconUrl(e.target.value)}
                placeholder="https://example.com/icon.png"
                className="col-span-3 bg-black/60 border-white/20 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-thumbnailUrl" className="text-right text-white text-sm">
                Thumbnail URL
              </Label>
              <Input
                id="edit-thumbnailUrl"
                value={editPluginThumbnailUrl}
                onChange={(e) => setEditPluginThumbnailUrl(e.target.value)}
                placeholder="https://example.com/thumbnail.png"
                className="col-span-3 bg-black/60 border-white/20 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-active" className="text-right text-white text-sm">
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
            <Button onClick={handleUpdatePlugin} className="bg-white text-black hover:bg-gray-200 text-sm">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
