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
import { Progress } from "@/components/ui/progress"
import {
  Package,
  Plus,
  Download,
  Check,
  X,
  Edit,
  Trash2,
  ImageIcon,
  Save,
  Send,
  Copy,
  Beaker,
  Code,
} from "lucide-react"
import Image from "next/image"
import type { Plugin, UserPlugin, UserAIFunction } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface PluginsTabProps {
  serverId?: string
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

export default function PluginsTab({ serverId, activeTab, setActiveTab }: PluginsTabProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.email === "dmarton336@gmail.com"

  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [userAIFunctions, setUserAIFunctions] = useState<UserAIFunction[]>([])
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
  const [generationProgress, setGenerationProgress] = useState(0)
  const [pluginName, setPluginName] = useState("")
  const [pluginDescription, setPluginDescription] = useState("")
  const [pluginThumbnailUrl, setPluginThumbnailUrl] = useState("")
  const [pluginProfileUrl, setPluginProfileUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; isCode?: boolean }[]>([])
  const [editingMetadata, setEditingMetadata] = useState(false)
  const [showCodeViewer, setShowCodeViewer] = useState(false)
  const [usageInstructions, setUsageInstructions] = useState("")

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
    fetchUserAIFunctions()
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

  const fetchUserAIFunctions = async () => {
    try {
      const response = await fetch("/api/user-ai-functions")
      if (response.ok) {
        const data = await response.json()
        setUserAIFunctions(data.functions)
      }
    } catch (error) {
      console.error("Error fetching user AI functions:", error)
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
    setGenerationProgress(0)
    setShowCodeViewer(false)
    setMessages((prev) => [...prev, { role: "user", content: aiPrompt }])

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)

    const currentPrompt = aiPrompt
    setAiPrompt("")
    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: currentPrompt }),
      })
      if (response.ok) {
        const data = await response.json()
        const fullResponse = data.code
        const parts = fullResponse.split(/\n\s*2\.\s*/)
        const codeOnly = parts[0].trim()
        const usageInstructions = parts.length > 1 ? parts[1].trim() : "No usage instructions provided."

        setGeneratedCode(codeOnly)
        setUsageInstructions(usageInstructions)

        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `Generated Discord bot for: "${currentPrompt}"`, isCode: false },
        ])
        const words = currentPrompt.split(" ").slice(0, 3).join(" ")
        setPluginName(words.charAt(0).toUpperCase() + words.slice(1) + " Bot")
        setPluginDescription(currentPrompt.length > 100 ? currentPrompt.substring(0, 100) + "..." : currentPrompt)
        clearInterval(progressInterval)
        setGenerationProgress(100)
      } else {
        const errorData = await response.json()
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `Error: ${errorData.error || "Failed to generate plugin code."}`, isCode: false },
        ])
        clearInterval(progressInterval)
        setGenerationProgress(0)
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Error: Failed to connect to AI service.", isCode: false },
      ])
      clearInterval(progressInterval)
      setGenerationProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAIFunction = async () => {
    if (!generatedCode || !pluginName.trim()) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: pluginName,
          description: pluginDescription,
          code: generatedCode,
          thumbnailUrl: pluginThumbnailUrl,
          profileUrl: pluginProfileUrl,
        }),
      })
      if (response.ok) {
        await fetchUserAIFunctions()
        setIsAICreatorOpen(false)
        setAiPrompt("")
        setPluginName("")
        setPluginDescription("")
        setPluginThumbnailUrl("")
        setPluginProfileUrl("")
        setGeneratedCode("")
        setMessages([])
      }
    } catch (error) {
      console.error("Error saving AI function:", error)
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
    const lastCodeMessage = messages.filter((msg) => msg.isCode).pop()
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

  const handleDeleteAIFunction = async (functionId: string) => {
    if (!window.confirm("Are you sure you want to delete this AI function?")) return
    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: functionId }),
      })
      if (response.ok) {
        fetchUserAIFunctions()
      }
    } catch (error) {
      console.error("Error deleting AI function:", error)
    }
  }

  const handleEditAIFunction = (aiFunction: UserAIFunction) => {
    setIsAICreatorOpen(true)
    setPluginName(aiFunction.name)
    setPluginDescription(aiFunction.description)
    setGeneratedCode(aiFunction.code)
    setPluginThumbnailUrl(aiFunction.thumbnailUrl || "")
    setPluginProfileUrl(aiFunction.profileUrl || "")
    // Include full code context for editing/follow-up requests
    setMessages([
      {
        role: "system",
        content: `Current code context:\n${aiFunction.code}`,
        isCode: false,
      },
      {
        role: "ai",
        content: `Ready to edit: ${aiFunction.name}. You can now request modifications or additions to this Discord bot.`,
        isCode: false,
      },
    ])
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
      <Dialog open={isAICreatorOpen} onOpenChange={setIsAICreatorOpen}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] bg-black/95 backdrop-blur-xl border border-white/10 text-white overflow-hidden">
          <DialogHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 relative">
                <Image src="/s1-logo.png" alt="S1 AI Lab" width={32} height={32} className="object-contain" />
              </div>
              <DialogTitle className="text-white text-xl font-semibold">S1 AI Lab</DialogTitle>
            </div>
            <DialogDescription className="text-gray-400">Generate Discord bots with AI assistance</DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role !== "system" && (
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-white text-black"
                          : "bg-gray-800/50 text-white border border-gray-700/50"
                      }`}
                    >
                      {message.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(isGenerating || generatedCode) && (
              <div className="p-4 border-t border-white/10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 relative">
                        <Image src="/s1-logo.png" alt="S1" width={24} height={24} className="object-contain" />
                      </div>
                      <h3 className="text-white font-medium text-lg">{pluginName}</h3>
                    </div>
                    {!isGenerating && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGeneratedCode("")
                          setUsageInstructions("")
                          setGenerationProgress(0)
                        }}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {isGenerating && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>Generating Discord bot...</span>
                      </div>
                      <Progress value={generationProgress} className="h-2 bg-white/10" />
                    </div>
                  )}

                  {!isGenerating && usageInstructions && (
                    <div className="space-y-4">
                      <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                        <h4 className="text-white font-medium mb-2 text-sm">How to use:</h4>
                        <div className="text-gray-300 text-sm prose prose-invert max-w-none">
                          <ReactMarkdown>{usageInstructions}</ReactMarkdown>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 text-xs backdrop-blur-sm"
                          onClick={() => setShowCodeViewer(!showCodeViewer)}
                        >
                          <Code className="h-3 w-3 mr-1" />
                          {showCodeViewer ? "Hide Code" : "Show Code"}
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-3 bg-white/90 text-black hover:bg-white text-xs font-medium transition-all backdrop-blur-sm"
                          onClick={handleSaveAIFunction}
                          disabled={isSaving}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showCodeViewer && generatedCode && !isGenerating && (
              <div className="p-4 border-t border-white/10">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-sm">Generated Code</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyCode}
                        className="h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-800 text-sm"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-black/50 rounded border border-gray-700/50 overflow-hidden backdrop-blur-sm">
                      <pre className="p-4 text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                        {generatedCode}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
              <div className="flex space-x-2">
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the Discord bot you want to create..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-400 backdrop-blur-sm"
                  onKeyPress={(e) => e.key === "Enter" && !isGenerating && handleGeneratePlugin()}
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleGeneratePlugin}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="bg-white text-black hover:bg-gray-200 px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-black text-white">
        <div className="p-4 sm:p-6 border-b border-white/20 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
            <Package className="h-6 w-6 sm:h-7 sm:w-7 mr-3" />
            <span className="hidden sm:inline">Plugin Management</span>
            <span className="sm:hidden">Plugins</span>
          </h1>
          <div className="flex space-x-3">
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black hover:bg-gray-200 h-11 px-4 sm:px-6 text-sm sm:text-base font-medium">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Plugin</span>
                    <span className="sm:hidden ml-1">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[500px] bg-black border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white text-lg">Create New Plugin</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Fill in the details for your new plugin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                      <Label htmlFor="name" className="sm:text-right text-white font-medium">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newPluginName}
                        onChange={(e) => setNewPluginName(e.target.value)}
                        className="sm:col-span-3 bg-black/60 border-white/20 text-white h-11"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-3 sm:gap-4">
                      <Label htmlFor="description" className="sm:text-right text-white font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newPluginDescription}
                        onChange={(e) => setNewPluginDescription(e.target.value)}
                        className="sm:col-span-3 bg-black/60 border-white/20 text-white min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreatePlugin}
                      className="bg-white text-black hover:bg-gray-200 w-full sm:w-auto h-11 px-6 font-medium"
                    >
                      Create Plugin
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              onClick={() => setIsAICreatorOpen(true)}
              className="w-full bg-white text-black hover:bg-gray-100 transition-all duration-200 h-12 font-medium shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 relative">
                  <Image src="/s1-logo.png" alt="S1" width={20} height={20} className="object-contain" />
                </div>
                <span>S1 AI Lab</span>
              </div>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="store" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/60 backdrop-blur-sm rounded-xl h-12">
              <TabsTrigger
                value="store"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black py-3 text-sm sm:text-base font-medium rounded-lg transition-all"
              >
                <Package className="h-4 w-4 mr-2" />
                Plugin Store
              </TabsTrigger>
              <TabsTrigger
                value="created"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black py-3 text-sm sm:text-base font-medium rounded-lg transition-all"
              >
                <Code className="h-4 w-4 mr-2" />
                Created
              </TabsTrigger>
              <TabsTrigger
                value="installed"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black py-3 text-sm sm:text-base font-medium rounded-lg transition-all"
              >
                <Check className="h-4 w-4 mr-2" />
                Installed
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="store" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {plugins.map((plugin) => (
                <Card key={plugin._id} className="glass-card flex flex-col h-full min-h-[280px] sm:min-h-[320px]">
                  {plugin.thumbnailUrl ? (
                    <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden">
                      <Image
                        src={plugin.thumbnailUrl || "/placeholder.svg"}
                        alt={`${plugin.name} thumbnail`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    </div>
                  )}
                  <CardHeader className="flex-row items-center space-x-3 pb-3 p-4 sm:p-5">
                    {plugin.iconUrl ? (
                      <Image
                        src={plugin.iconUrl || "/placeholder.svg"}
                        alt={`${plugin.name} icon`}
                        width={36}
                        height={36}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-white text-base sm:text-lg truncate font-semibold">
                        {plugin.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm truncate">
                        {plugin.installs} installs
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4 px-4 sm:px-5 flex-1 flex flex-col">
                    <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-3 flex-1 leading-relaxed">
                      {plugin.description}
                    </p>
                    <div className="flex justify-end space-x-2">
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlugin(plugin)}
                            className="h-10 w-10 p-0 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePlugin(plugin._id)}
                            className="h-10 w-10 p-0 border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/40 transition-all"
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
                          className="h-10 px-4 bg-gray-600 text-white text-sm font-medium"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Installed
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleInstallPlugin(plugin._id)}
                          className="h-10 px-4 bg-white text-black text-sm font-medium hover:bg-gray-200 transition-all"
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

          <TabsContent value="created" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
            {userAIFunctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                <Beaker className="h-16 w-16 mb-6 opacity-50" />
                <p className="text-center text-base sm:text-lg font-medium mb-2">No AI functions created yet.</p>
                <p className="text-center text-sm sm:text-base opacity-75">
                  Use S1 AI Lab to create your first function!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {userAIFunctions.map((aiFunction) => (
                  <Card key={aiFunction._id} className="glass-card flex flex-col h-full min-h-[280px] sm:min-h-[320px]">
                    {aiFunction.thumbnailUrl ? (
                      <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden">
                        <Image
                          src={aiFunction.thumbnailUrl || "/placeholder.svg"}
                          alt={`${aiFunction.name} thumbnail`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-t-lg"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                        <Beaker className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                    <CardHeader className="flex-row items-center space-x-3 pb-3 p-4 sm:p-5">
                      {aiFunction.profileUrl ? (
                        <Image
                          src={aiFunction.profileUrl || "/placeholder.svg"}
                          alt={`${aiFunction.name} profile`}
                          width={36}
                          height={36}
                          className="rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                          <Beaker className="h-5 w-5 text-black" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-white text-base sm:text-lg truncate font-semibold">
                          {aiFunction.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-sm truncate">
                          Created {new Date(aiFunction.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 px-4 sm:px-5 flex-1 flex flex-col">
                      <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-3 flex-1 leading-relaxed">
                        {aiFunction.description}
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAIFunction(aiFunction)}
                          className="h-10 w-10 p-0 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAIFunction(aiFunction._id as string)}
                          className="h-10 px-4 text-sm font-medium transition-all"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="installed" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
            {userPlugins.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                <Package className="h-16 w-16 mb-6 opacity-50" />
                <p className="text-center text-base sm:text-lg font-medium mb-2">No plugins installed yet.</p>
                <p className="text-center text-sm sm:text-base opacity-75">Browse the Plugin Store to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {userPlugins.map((plugin) => (
                  <Card
                    key={plugin.pluginId}
                    className="glass-card flex flex-col h-full min-h-[280px] sm:min-h-[320px]"
                  >
                    {plugin.thumbnailUrl ? (
                      <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden">
                        <Image
                          src={plugin.thumbnailUrl || "/placeholder.svg"}
                          alt={`${plugin.name} thumbnail`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-t-lg"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                    <CardHeader className="flex-row items-center space-x-3 pb-3 p-4 sm:p-5">
                      {plugin.iconUrl ? (
                        <Image
                          src={plugin.iconUrl || "/placeholder.svg"}
                          alt={`${plugin.name} icon`}
                          width={36}
                          height={36}
                          className="rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                          <Beaker className="h-5 w-5 text-black" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-white text-base sm:text-lg truncate font-semibold">
                          {plugin.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-sm truncate">
                          Installed {new Date(plugin.installed_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 px-4 sm:px-5 flex-1 flex flex-col">
                      <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-3 flex-1 leading-relaxed">
                        {plugin.description}
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditPluginId(plugin.pluginId)
                            setIsAICreatorOpen(true)
                            setPluginName(plugin.name)
                            setPluginDescription(plugin.description)
                            setMessages([
                              {
                                role: "ai",
                                content: `Editing: ${plugin.name}\n\n${plugin.description}`,
                                isCode: false,
                              },
                            ])
                          }}
                          className="h-10 w-10 p-0 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
                        >
                          <Beaker className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUninstallPlugin(plugin.pluginId)}
                          className="h-10 px-4 text-sm font-medium transition-all"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[500px] bg-black border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">Edit Plugin</DialogTitle>
              <DialogDescription className="text-gray-400">Update plugin details and settings.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                <Label htmlFor="edit-name" className="sm:text-right text-white font-medium">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editPluginName}
                  onChange={(e) => setEditPluginName(e.target.value)}
                  className="sm:col-span-3 bg-black/60 border-white/20 text-white h-11"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-3 sm:gap-4">
                <Label htmlFor="edit-description" className="sm:text-right text-white font-medium">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editPluginDescription}
                  onChange={(e) => setEditPluginDescription(e.target.value)}
                  className="sm:col-span-3 bg-black/60 border-white/20 text-white min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                <Label htmlFor="edit-active" className="sm:text-right text-white font-medium">
                  Active Status
                </Label>
                <div className="sm:col-span-3">
                  <Switch id="edit-active" checked={editPluginActive} onCheckedChange={setEditPluginActive} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpdatePlugin}
                className="bg-white text-black hover:bg-gray-200 w-full sm:w-auto h-11 px-6 font-medium"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
