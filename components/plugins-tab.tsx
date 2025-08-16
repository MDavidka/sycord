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
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Plus,
  X,
  Edit,
  Trash2,
  Save,
  Send,
  Code,
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
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto w-full">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role !== "system" && (
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] p-3 sm:p-4 relative transition-all duration-200 ${
                          message.role === "user"
                            ? "bg-white text-black ml-2 sm:ml-4 rounded-2xl sm:rounded-xl shadow-lg"
                            : hasError && message.content.startsWith("Error:")
                              ? "bg-red-900/50 text-red-100 border border-red-700/50 mr-2 sm:mr-4 rounded-2xl sm:rounded-xl"
                              : "bg-gray-800/60 text-white border border-gray-700/30 mr-2 sm:mr-4 rounded-2xl sm:rounded-xl backdrop-blur-sm"
                        }`}
                      >
                        <div className="text-sm sm:text-base leading-relaxed">{message.content}</div>
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
                    <div className="bg-gray-800/60 text-white border border-gray-700/30 mr-2 sm:mr-4 p-3 sm:p-4 rounded-2xl sm:rounded-xl max-w-[90%] sm:max-w-[85%] md:max-w-[75%] backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm sm:text-base leading-relaxed">Generating your Discord bot</span>
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
                <div className="p-2 sm:p-4 md:p-6 border-t border-white/10 max-w-4xl mx-auto w-full">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0">
                          <Image src="/s1-logo.png" alt="S1" width={24} height={24} className="object-contain" />
                        </div>
                        <h3 className="text-white font-medium text-sm sm:text-base md:text-lg truncate">
                          {pluginName}
                        </h3>
                        {generatedCode && (
                          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full whitespace-nowrap">
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
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>

                    {isGenerating && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300 text-xs sm:text-sm">Generating...</span>
                          <span className="text-gray-300 text-xs sm:text-sm">{Math.round(generationProgress)}%</span>
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
                        <h4 className="text-white font-medium mb-2 text-xs sm:text-sm md:text-base">How to use:</h4>
                        <div className="text-gray-300 prose prose-invert max-w-none text-xs sm:text-sm md:text-base leading-relaxed">
                          <ReactMarkdown>{usageInstructions}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {(isGenerating || generatedCode) && (
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => setIsCodeModalOpen(true)}
                            variant="outline"
                            className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-10 sm:h-12 justify-center text-sm"
                          >
                            <Code className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            View Code
                          </Button>
                          <Button
                            onClick={handleSaveAIFunction}
                            className="flex-1 bg-white text-black hover:bg-gray-200 h-10 sm:h-12 justify-center font-medium text-sm"
                          >
                            <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Save Plugin
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 p-2 sm:p-4 md:p-6 bg-black/50 backdrop-blur-sm sticky bottom-0 max-w-4xl mx-auto w-full">
                <div className="flex space-x-2 sm:space-x-3 items-end">
                  <div className="flex-1 min-w-0">
                    <Textarea
                      ref={textareaRef}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        messages.length > 0
                          ? "Continue the conversation or ask for modifications..."
                          : "Describe the Discord bot you want to create..."
                      }
                      className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 resize-none min-h-[40px] sm:min-h-[44px] max-h-32 w-full text-sm sm:text-base leading-relaxed px-3 sm:px-4 py-2 sm:py-3 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all"
                      disabled={isGenerating}
                      rows={1}
                    />
                    <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                    <div className="text-xs text-gray-500 mt-1 sm:hidden">Tap send to continue</div>
                  </div>
                  <Button
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !aiPrompt.trim()}
                    size="sm"
                    className="bg-white text-black hover:bg-gray-200 h-10 sm:h-11 px-3 sm:px-6 flex-shrink-0 rounded-xl font-medium transition-all disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Send</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plugins</h2>
        {isAdmin && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-500 text-white hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Plugin
          </Button>
        )}
      </div>

      <Tabs defaultValue="installed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="installed">Installed</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
        </TabsList>
        <TabsContent value="installed">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userPlugins.map((userPlugin) => (
              <Card key={userPlugin.pluginId} className="bg-gray-800/50 text-white">
                <CardHeader>
                  <CardTitle>{plugins.find((p) => p._id === userPlugin.pluginId)?.name}</CardTitle>
                  <CardDescription>{plugins.find((p) => p._id === userPlugin.pluginId)?.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                  <Button
                    onClick={() => handleUninstallPlugin(userPlugin.pluginId)}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Uninstall
                  </Button>
                  <Button
                    onClick={() => handleEditPlugin(plugins.find((p) => p._id === userPlugin.pluginId)!)}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="available">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plugins.map((plugin) => (
              <Card key={plugin._id} className="bg-gray-800/50 text-white">
                <CardHeader>
                  <CardTitle>{plugin.name}</CardTitle>
                  <CardDescription>{plugin.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                  {!isPluginInstalled(plugin._id) && (
                    <Button
                      onClick={() => handleInstallPlugin(plugin._id)}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Install
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      onClick={() => handleEditPlugin(plugin)}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {isCreateDialogOpen && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="bg-black/95 backdrop-blur-xl border-0 sm:border sm:border-white/10 text-white p-6 sm:p-8 md:p-10 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Create Plugin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="pluginName">Plugin Name</Label>
                <Input
                  id="pluginName"
                  value={newPluginName}
                  onChange={(e) => setNewPluginName(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="pluginDescription">Description</Label>
                <Textarea
                  id="pluginDescription"
                  value={newPluginDescription}
                  onChange={(e) => setNewPluginDescription(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 resize-none"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="pluginIconUrl">Icon URL</Label>
                <Input
                  id="pluginIconUrl"
                  value={newPluginIconUrl}
                  onChange={(e) => setNewPluginIconUrl(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="pluginThumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="pluginThumbnailUrl"
                  value={newPluginThumbnailUrl}
                  onChange={(e) => setNewPluginThumbnailUrl(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={handleCreatePlugin} className="bg-blue-500 text-white hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-black/95 backdrop-blur-xl border-0 sm:border sm:border-white/10 text-white p-6 sm:p-8 md:p-10 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Edit Plugin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="editPluginName">Plugin Name</Label>
                <Input
                  id="editPluginName"
                  value={editPluginName}
                  onChange={(e) => setEditPluginName(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="editPluginDescription">Description</Label>
                <Textarea
                  id="editPluginDescription"
                  value={editPluginDescription}
                  onChange={(e) => setEditPluginDescription(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 resize-none"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="editPluginIconUrl">Icon URL</Label>
                <Input
                  id="editPluginIconUrl"
                  value={editPluginIconUrl}
                  onChange={(e) => setEditPluginIconUrl(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="editPluginThumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="editPluginThumbnailUrl"
                  value={editPluginThumbnailUrl}
                  onChange={(e) => setEditPluginThumbnailUrl(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="editPluginActive">Active</Label>
                <Switch
                  id="editPluginActive"
                  checked={editPluginActive}
                  onCheckedChange={setEditPluginActive}
                  className="bg-gray-800/50 border-gray-700/50"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={handleUpdatePlugin} className="bg-blue-500 text-white hover:bg-blue-600">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
