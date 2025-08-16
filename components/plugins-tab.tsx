"use client"

import type React from "react"

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
  Beaker,
  Code,
  Copy,
  Settings,
  HelpCircle,
  RotateCcw,
  ArrowLeft,
} from "lucide-react"
import Image from "next/image"
import type { Plugin, UserPlugin, UserAIFunction } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface PluginsTabProps {
  serverId?: string
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

interface ChatMessage {
  id: string
  role: "user" | "ai" | "system"
  content: string
  isCode?: boolean
  timestamp?: Date
  codeVersionId?: string
}

interface CodeVersion {
  id: string
  code: string
  usageInstructions: string
  version: number
  created_at: string
  prompt: string
}

interface ChatSession {
  id: string
  name: string
  messages: ChatMessage[]
  codeVersions: CodeVersion[]
  created_at: string
  last_updated: string
}

export default function PluginsTab() {
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
  const [codeViewerContent, setCodeViewerContent] = useState("")
  const [editingMetadata, setEditingMetadata] = useState(false)
  const [showCodeViewer, setShowCodeViewer] = useState(false)
  const [usageInstructions, setUsageInstructions] = useState("")
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [editPluginId, setEditPluginId] = useState<string | null>(null)
  const [editPluginName, setEditPluginName] = useState("")
  const [editPluginDescription, setEditPluginDescription] = useState("")
  const [editPluginActive, setEditPluginActive] = useState(false)
  const [editPluginIconUrl, setEditPluginIconUrl] = useState("")
  const [editPluginThumbnailUrl, setEditPluginThumbnailUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [currentAIFunction, setCurrentAIFunction] = useState<UserAIFunction | null>(null)
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([])
  const [currentCodeVersion, setCurrentCodeVersion] = useState<CodeVersion | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchPlugins()
    fetchUserPlugins()
    fetchUserAIFunctions()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
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

  const handleEditAIFunction = async (aiFunction: UserAIFunction) => {
    setCurrentAIFunction(aiFunction)

    // Load existing chat sessions or create default one
    const sessions = aiFunction.chatSessions || []
    setChatSessions(sessions)

    if (sessions.length > 0) {
      const currentSession = sessions.find((s) => s.id === aiFunction.currentChatId) || sessions[0]
      setCurrentChatSession(currentSession)
      setMessages(currentSession.messages || [])
      setCodeVersions(currentSession.codeVersions || [])

      // Set current code version to latest
      if (currentSession.codeVersions && currentSession.codeVersions.length > 0) {
        const latestVersion = currentSession.codeVersions[currentSession.codeVersions.length - 1]
        setCurrentCodeVersion(latestVersion)
        setGeneratedCode(latestVersion.code)
        setUsageInstructions(latestVersion.usageInstructions)
      }
    } else {
      // Create initial chat session
      const initialSession: ChatSession = {
        id: `chat_${Date.now()}`,
        name: "Main Chat",
        messages: [],
        codeVersions: [
          {
            id: `version_${Date.now()}`,
            code: aiFunction.code,
            usageInstructions: aiFunction.usageInstructions || "",
            version: 1,
            created_at: new Date().toISOString(),
            prompt: "Initial creation",
          },
        ],
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }

      setChatSessions([initialSession])
      setCurrentChatSession(initialSession)
      setMessages([])
      setCodeVersions(initialSession.codeVersions)
      setCurrentCodeVersion(initialSession.codeVersions[0])
      setGeneratedCode(aiFunction.code)
      setUsageInstructions(aiFunction.usageInstructions || "")
    }

    setIsAICreatorOpen(true)
    setPluginName(aiFunction.name)
    setPluginDescription(aiFunction.description)
    setPluginThumbnailUrl(aiFunction.thumbnailUrl || "")
    setPluginProfileUrl(aiFunction.profileUrl || "")
  }

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setHasError(false)

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 15, 95))
    }, 500)

    try {
      let contextPrompt = aiPrompt
      if (currentCodeVersion && currentChatSession) {
        const previousVersions = codeVersions.slice(-3) // Last 3 versions for context
        const contextInfo = previousVersions
          .map((v) => `Version ${v.version}: ${v.code.substring(0, 500)}...`)
          .join("\n\n")

        contextPrompt = `Previous code context:\n${contextInfo}\n\nUser request: ${aiPrompt}`
      }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate plugin")
      }

      const data = await response.json()
      clearInterval(progressInterval)
      setGenerationProgress(100)

      const fullResponse = data.code
      const parts = fullResponse.split(/2\.\s*/)

      let codeSection = ""
      let usageSection = ""

      if (parts.length >= 2) {
        codeSection = parts[0].trim()
        usageSection = parts[1].trim()
      } else {
        codeSection = fullResponse
        usageSection = "No usage instructions provided."
      }

      setGeneratedCode(codeSection)
      setUsageInstructions(usageSection)

      const newCodeVersion: CodeVersion = {
        id: `version_${Date.now()}`,
        code: codeSection,
        usageInstructions: usageSection,
        version: (currentCodeVersion?.version || 0) + 1,
        created_at: new Date().toISOString(),
        prompt: aiPrompt,
      }

      setCurrentCodeVersion(newCodeVersion)
      setCodeVersions((prev) => [...prev, newCodeVersion])

      const newMessages: ChatMessage[] = [
        ...messages,
        {
          id: `msg_${Date.now()}_user`,
          role: "user",
          content: aiPrompt,
          timestamp: new Date(),
        },
        {
          id: `msg_${Date.now()}_ai`,
          role: "ai",
          content: "Discord bot generated successfully!",
          isCode: true,
          timestamp: new Date(),
          codeVersionId: newCodeVersion.id,
        },
      ]

      setMessages(newMessages)

      if (currentAIFunction && currentChatSession) {
        await fetch("/api/user-ai-functions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            functionId: currentAIFunction._id,
            chatSessionId: currentChatSession.id,
            messages: newMessages,
            action: "updateChat",
          }),
        })

        await fetch("/api/user-ai-functions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            functionId: currentAIFunction._id,
            chatSessionId: currentChatSession.id,
            newCodeVersion,
            action: "addCodeVersion",
          }),
        })
      }
    } catch (error) {
      console.error("Error generating plugin:", error)
      clearInterval(progressInterval)
      setGenerationProgress(0)
      setIsGenerating(false)
      setHasError(true)
      setErrorMessage("Sorry, there was an error generating the bot. Please try again.")
    } finally {
      setIsGenerating(false)
      setAiPrompt("")
    }
  }

  const handleSaveAIFunction = async () => {
    if (!generatedCode || !pluginName.trim()) return
    setIsSaving(true)

    try {
      if (currentAIFunction) {
        // Update existing function
        await fetch("/api/user-ai-functions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            functionId: currentAIFunction._id,
            chatSessionId: currentChatSession?.id,
            messages,
            action: "updateChat",
          }),
        })
      } else {
        // Create new function
        const response = await fetch("/api/user-ai-functions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pluginName,
            description: pluginDescription,
            code: generatedCode,
            usageInstructions: usageInstructions,
            thumbnailUrl: pluginThumbnailUrl,
            profileUrl: pluginProfileUrl,
            chatSessionId: currentChatSession?.id,
          }),
        })

        if (!response.ok) throw new Error("Failed to save function")
      }

      await fetchUserAIFunctions()
      handleCloseAICreator()
    } catch (error) {
      console.error("Error saving AI function:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartNewChat = () => {
    setCurrentAIFunction(null)
    setCurrentChatSession(null)
    setChatSessions([])
    setMessages([])
    setCodeVersions([])
    setCurrentCodeVersion(null)
    setGeneratedCode("")
    setUsageInstructions("")
    setPluginName("")
    setPluginDescription("")
    setPluginThumbnailUrl("")
    setPluginProfileUrl("")
    setIsAICreatorOpen(true)
  }

  const handleCloseAICreator = () => {
    setIsAICreatorOpen(false)
    setCurrentAIFunction(null)
    setCurrentChatSession(null)
    setChatSessions([])
    setMessages([])
    setCodeVersions([])
    setCurrentCodeVersion(null)
    setGeneratedCode("")
    setUsageInstructions("")
    setPluginName("")
    setPluginDescription("")
    setPluginThumbnailUrl("")
    setPluginProfileUrl("")
    setAiPrompt("")
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

  const handleClearConversation = () => {
    setMessages([])
    setGeneratedCode("")
    setUsageInstructions("")
    setGenerationProgress(0)
    setHasError(false)
    setErrorMessage("")
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleGenerateAI()
    }
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
      <>
        <Dialog open={isAICreatorOpen} onOpenChange={setIsAICreatorOpen}>
          <DialogContent className="w-full h-full sm:w-[95vw] sm:max-w-6xl sm:h-[90vh] bg-black/95 backdrop-blur-xl border-0 sm:border sm:border-white/10 text-white overflow-hidden p-0 sm:rounded-lg">
            <DialogHeader className="border-b border-white/10 p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAICreatorOpen(false)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 sm:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-5 h-5 sm:w-8 sm:h-8 relative">
                    <Image src="/s1-logo.png" alt="S1 AI Lab" width={32} height={32} className="object-contain" />
                  </div>
                  <div>
                    <DialogTitle className="text-white text-base sm:text-xl font-semibold">S1</DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs sm:text-sm hidden sm:block">
                      Generate Discord bots with AI assistance
                    </DialogDescription>
                    <div className="text-gray-400 text-xs sm:hidden">Model: S1</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearConversation}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 hidden sm:flex"
                    title="Clear Conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 hidden sm:flex"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 hidden sm:flex"
                    title="Help"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAICreatorOpen(false)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 hidden sm:flex"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 flex flex-col overflow-hidden h-full">
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role !== "system" && (
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl sm:rounded-xl relative ${
                          message.role === "user"
                            ? "bg-white text-black ml-4"
                            : hasError && message.content.startsWith("Error:")
                              ? "bg-red-900/50 text-red-100 border border-red-700/50 mr-4"
                              : "bg-gray-800/60 text-white border border-gray-700/30 mr-4"
                        }`}
                        style={{
                          fontSize: window.innerWidth < 768 ? "14px" : "16px",
                          lineHeight: "1.5",
                        }}
                      >
                        <div className="mb-1">{message.content}</div>
                        {message.timestamp && (
                          <div
                            className={`text-xs opacity-60 mt-2 ${
                              message.role === "user" ? "text-right" : "text-left"
                            }`}
                          >
                            {formatTimestamp(message.timestamp)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/60 text-white border border-gray-700/30 mr-4 p-3 sm:p-4 rounded-2xl sm:rounded-xl max-w-[85%] sm:max-w-[75%]">
                      <div className="flex items-center space-x-2">
                        <span style={{ fontSize: window.innerWidth < 768 ? "14px" : "16px", lineHeight: "1.5" }}>
                          Generating your Discord bot
                        </span>
                        <div className="flex space-x-1">
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {(isGenerating || generatedCode) && (
                <div className="p-3 sm:p-6 border-t border-white/10 max-w-4xl mx-auto w-full">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-xl p-4 sm:p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 relative">
                          <Image src="/s1-logo.png" alt="S1" width={24} height={24} className="object-contain" />
                        </div>
                        <h3 className="text-white font-medium text-base sm:text-lg">{pluginName}</h3>
                        {generatedCode && (
                          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                            Latest Version
                          </span>
                        )}
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
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>

                    {isGenerating && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300 text-sm">Generating...</span>
                          <span className="text-gray-300 text-sm">{Math.round(generationProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-800/50 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${generationProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {usageInstructions && (
                      <div className="mb-4">
                        <h4 className="text-white font-medium mb-2 text-sm sm:text-base">How to use:</h4>
                        <div
                          className="text-gray-300 prose prose-invert max-w-none"
                          style={{
                            fontSize: window.innerWidth < 768 ? "14px" : "16px",
                            lineHeight: "1.5",
                          }}
                        >
                          <ReactMarkdown>{usageInstructions}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {(isGenerating || generatedCode) && (
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setIsCodeModalOpen(true)}
                            variant="outline"
                            className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-12 justify-center"
                          >
                            <Code className="h-5 w-5" />
                          </Button>
                          <Button
                            onClick={handleSaveAIFunction}
                            className="flex-1 bg-white text-black hover:bg-gray-200 h-12 justify-center font-medium"
                          >
                            <Save className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 p-3 sm:p-6 bg-black/50 backdrop-blur-sm sticky bottom-0 max-w-4xl mx-auto w-full">
                <div className="flex space-x-2 sm:space-x-3 items-end">
                  <div className="flex-1 min-w-0">
                    <Textarea
                      ref={textareaRef}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe the Discord bot you want to create..."
                      className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 resize-none min-h-[44px] max-h-32 w-full"
                      style={{
                        fontSize: "16px",
                        lineHeight: "1.4",
                        padding: "12px 14px",
                      }}
                      disabled={isGenerating}
                      rows={1}
                    />
                    <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !aiPrompt.trim()}
                    size="sm"
                    className="bg-white text-black hover:bg-gray-200 h-11 px-3 sm:px-6 flex-shrink-0 ml-2"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
          <DialogContent className="w-[95vw] max-w-6xl h-[90vh] bg-black/95 backdrop-blur-xl border border-white/10 text-white overflow-hidden p-0 sm:rounded-lg">
            <DialogHeader className="border-b border-white/10 p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCodeModalOpen(false)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 sm:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Code className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  <DialogTitle className="text-white text-sm sm:text-lg font-semibold truncate">
                    {pluginName} - Source Code
                  </DialogTitle>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-8 px-2 sm:px-3 text-xs"
                  >
                    <Copy className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                  <Button
                    onClick={handleSaveAIFunction}
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-8 px-2 sm:px-3 text-xs"
                  >
                    <Save className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                  <Button
                    onClick={handleDownloadCode}
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-8 px-2 sm:px-3 text-xs"
                  >
                    <Download className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCodeModalOpen(false)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 hidden sm:flex"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <div className="h-full bg-gray-900/30 border-t border-gray-700/30">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-gray-700/30">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-gray-400 text-xs font-mono">{pluginName}.py</span>
                  </div>
                  <div className="text-gray-500 text-xs">Python</div>
                </div>
                <div className="h-full overflow-auto p-4">
                  <pre className="text-sm font-mono text-gray-100 leading-relaxed whitespace-pre-wrap">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
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
                        className="sm:col-span-3 bg-black/60 border-white/20 text-white h-10 sm:h-11"
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
              onClick={handleStartNewChat}
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
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlugin(plugin)}
                            className="h-9 w-9 p-0 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePlugin(plugin._id)}
                            className="h-9 w-9 p-0 border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/40 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {isPluginInstalled(plugin._id) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="h-9 px-4 bg-gray-600 text-white text-sm font-medium w-full sm:w-auto"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Installed
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleInstallPlugin(plugin._id)}
                          className="h-9 px-4 bg-white text-black text-sm font-medium hover:bg-gray-200 transition-all w-full sm:w-auto"
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
              // Updated Created tab to show edit functionality
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAIFunctions.map((aiFunction) => (
                  <div key={aiFunction._id?.toString()} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start space-x-3">
                      <img
                        src={aiFunction.thumbnailUrl || "/placeholder.svg?height=40&width=40"}
                        alt={aiFunction.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{aiFunction.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{aiFunction.description}</p>
                        {aiFunction.usageInstructions && (
                          <div className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300">
                            {aiFunction.usageInstructions.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleEditAIFunction(aiFunction)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Continue Chat
                      </button>
                      <button
                        onClick={() => handleDeleteAIFunction(aiFunction._id?.toString() || "")}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
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
