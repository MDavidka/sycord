"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Copy, ArrowLeft, X, Save, Code, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
  id: string
  role: "user" | "ai" | "system"
  content: string
  isCode?: boolean
  timestamp?: Date
  codeVersionId?: string
  workPlan?: string[]
  status?: "processing" | "completed" | "error"
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

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: AIChatProps) {
  const [aiPrompt, setAiPrompt] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [pluginName, setPluginName] = useState("")
  const [pluginDescription, setPluginDescription] = useState("")
  const [pluginThumbnailUrl, setPluginThumbnailUrl] = useState("")
  const [pluginProfileUrl, setPluginProfileUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showCodeViewer, setShowCodeViewer] = useState(false)
  const [usageInstructions, setUsageInstructions] = useState("")
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([])
  const [currentCodeVersion, setCurrentCodeVersion] = useState<CodeVersion | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [aiPrompt])

  useEffect(() => {
    if (currentAIFunction && isOpen) {
      const sessions = currentAIFunction.chatSessions || []
      setChatSessions(sessions)

      if (sessions.length > 0) {
        const currentSession = sessions.find((s) => s.id === currentAIFunction.currentChatId) || sessions[0]
        setCurrentChatSession(currentSession)
        setMessages(currentSession.messages || [])
        setCodeVersions(currentSession.codeVersions || [])

        if (currentSession.codeVersions && currentSession.codeVersions.length > 0) {
          const latestVersion = currentSession.codeVersions[currentSession.codeVersions.length - 1]
          setCurrentCodeVersion(latestVersion)
          setGeneratedCode(latestVersion.code)
          setUsageInstructions(latestVersion.usageInstructions)
        }
      } else {
        const initialSession: ChatSession = {
          id: `chat_${Date.now()}`,
          name: "Main Chat",
          messages: [],
          codeVersions: [
            {
              id: `version_${Date.now()}`,
              code: currentAIFunction.code,
              usageInstructions: currentAIFunction.usageInstructions || "",
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
        setGeneratedCode(currentAIFunction.code)
        setUsageInstructions(currentAIFunction.usageInstructions || "")
      }

      setPluginName(currentAIFunction.name)
      setPluginDescription(currentAIFunction.description)
      setPluginThumbnailUrl(currentAIFunction.thumbnailUrl || "")
      setPluginProfileUrl(currentAIFunction.profileUrl || "")
    }
  }, [currentAIFunction, isOpen])

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setHasError(false)

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 15, 95))
    }, 500)

    try {
      let contextPrompt = `Please provide only raw Python code without explanations, comments about usage, or installation instructions. Just the pure code implementation.

User request: ${aiPrompt}`

      if (currentCodeVersion && currentChatSession) {
        const previousVersions = codeVersions.slice(-3)
        const contextInfo = previousVersions
          .map((v) => `Version ${v.version}: ${v.code.substring(0, 500)}...`)
          .join("\n\n")

        contextPrompt = `Previous code context:\n${contextInfo}\n\n${contextPrompt}`
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      clearInterval(progressInterval)
      setGenerationProgress(100)

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: aiPrompt,
        timestamp: new Date(),
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: data.response || "Code generated successfully!",
        isCode: true,
        timestamp: new Date(),
        status: "completed",
        workPlan: data.workPlan || [],
      }

      const newMessages = [...messages, userMessage, aiMessage]
      setMessages(newMessages)

      const newCodeVersion: CodeVersion = {
        id: `version_${Date.now()}`,
        code: data.code || "",
        usageInstructions: data.usageInstructions || "",
        version: codeVersions.length + 1,
        created_at: new Date().toISOString(),
        prompt: aiPrompt,
      }

      const newCodeVersions = [...codeVersions, newCodeVersion]
      setCodeVersions(newCodeVersions)
      setCurrentCodeVersion(newCodeVersion)
      setGeneratedCode(data.code || "")
      setUsageInstructions(data.usageInstructions || "")

      if (currentChatSession) {
        const updatedSession = {
          ...currentChatSession,
          messages: newMessages,
          codeVersions: newCodeVersions,
          last_updated: new Date().toISOString(),
        }
        setCurrentChatSession(updatedSession)

        const updatedSessions = chatSessions.map((s) => (s.id === currentChatSession.id ? updatedSession : s))
        setChatSessions(updatedSessions)
      }

      setAiPrompt("")
    } catch (error) {
      console.error("Error generating AI response:", error)
      setHasError(true)
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred")
      clearInterval(progressInterval)
      setGenerationProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAIFunction = async () => {
    if (!pluginName.trim() || !generatedCode.trim()) return

    setIsSaving(true)
    try {
      const method = currentAIFunction ? "PUT" : "POST"
      const url = currentAIFunction ? `/api/user-ai-functions/${currentAIFunction._id}` : "/api/user-ai-functions"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: pluginName,
          description: pluginDescription,
          code: generatedCode,
          usageInstructions,
          thumbnailUrl: pluginThumbnailUrl,
          profileUrl: pluginProfileUrl,
          chatSessions,
          currentChatId: currentChatSession?.id,
        }),
      })

      if (response.ok) {
        onClose()
      }
    } catch (error) {
      console.error("Error saving AI function:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `chat_${Date.now()}`,
      name: `Chat ${chatSessions.length + 1}`,
      messages: [],
      codeVersions: [],
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }

    const updatedSessions = [...chatSessions, newSession]
    setChatSessions(updatedSessions)
    setCurrentChatSession(newSession)
    setMessages([])
    setCodeVersions([])
    setCurrentCodeVersion(null)
    setGeneratedCode("")
    setUsageInstructions("")
    setAiPrompt("")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:w-[95vw] sm:max-w-7xl sm:h-[95vh] p-0 border-0 bg-transparent overflow-hidden">
        <div className="glass-card w-full h-full flex flex-col overflow-hidden">
          <DialogHeader className="border-b border-white/10 p-4 bg-black/30 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="w-8 h-8 relative">
                  <Image src="/s1-logo.png" alt="S1 AI Lab" width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <DialogTitle className="text-white text-xl font-semibold">S1 AI Lab</DialogTitle>
                  <DialogDescription className="text-gray-400 text-sm">
                    Advanced Discord Bot Generator
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleNewChat} className="btn-secondary h-9 px-4 text-sm font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-black/10 to-black/20"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                    <div className="w-16 h-16 relative mb-6 opacity-60">
                      <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
                    </div>
                    <h2 className="text-center text-2xl font-semibold mb-3 text-white">Welcome to S1 AI Lab</h2>
                    <p className="text-center text-lg opacity-75 max-w-md leading-relaxed">
                      Describe your Discord bot functionality and I'll generate the complete Python code for you.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] ${message.role === "user" ? "chat-message-user" : "chat-message-ai"}`}
                      >
                        {message.isCode ? (
                          <div className="space-y-4">
                            <ReactMarkdown className="text-sm leading-relaxed prose prose-invert max-w-none">
                              {message.content}
                            </ReactMarkdown>

                            {message.workPlan && message.workPlan.length > 0 && (
                              <div className="glass-card p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-white flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                                  Work Plan
                                </h4>
                                <ul className="space-y-1">
                                  {message.workPlan.map((step, index) => (
                                    <li key={index} className="text-xs text-gray-300 flex items-center">
                                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2" />
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {generatedCode && (
                              <div className="glass-card p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Code className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm font-medium text-white">Generated Code</span>
                                    <div
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        message.status === "completed"
                                          ? "status-success"
                                          : message.status === "processing"
                                            ? "status-processing"
                                            : "status-error"
                                      }`}
                                    >
                                      {message.status === "completed"
                                        ? "Ready"
                                        : message.status === "processing"
                                          ? "Processing"
                                          : "Error"}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(generatedCode)}
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => setShowCodeViewer(!showCodeViewer)}
                                      className="btn-secondary h-8 px-3 text-xs"
                                    >
                                      {showCodeViewer ? "Hide Code" : "Show Code"}
                                    </Button>
                                  </div>
                                </div>

                                {showCodeViewer && (
                                  <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                    <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                      {generatedCode}
                                    </pre>
                                  </div>
                                )}

                                <div className="flex space-x-2">
                                  <Button
                                    onClick={handleSaveAIFunction}
                                    disabled={!pluginName.trim() || !generatedCode.trim() || isSaving}
                                    className="btn-primary h-9 px-4 text-sm font-medium flex-1"
                                  >
                                    {isSaving ? (
                                      <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => setShowCodeViewer(true)}
                                    className="btn-secondary h-9 px-4 text-sm font-medium"
                                  >
                                    Check Code
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm flex-shrink-0">
                {isGenerating && (
                  <div className="px-6 py-3 border-b border-white/10">
                    <div className="glass-card p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 relative">
                          <Image
                            src="/s1-logo.png"
                            alt="S1"
                            width={24}
                            height={24}
                            className="object-contain animate-pulse"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">Generating your Discord bot...</span>
                            <span className="text-xs text-gray-400">{Math.round(generationProgress)}%</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300 animate-pulse-glow"
                              style={{ width: `${generationProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {hasError && (
                  <div className="px-6 py-3 border-b border-white/10">
                    <div className="status-error rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex space-x-3">
                    <Textarea
                      ref={textareaRef}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe the Discord bot functionality you want to create..."
                      className="flex-1 bg-black/60 border-white/20 text-white placeholder-gray-400 resize-none min-h-[52px] max-h-32 text-base rounded-xl backdrop-blur-sm"
                      style={{ fontSize: "16px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleGenerateAI()
                        }
                      }}
                    />
                    <Button
                      onClick={handleGenerateAI}
                      disabled={!aiPrompt.trim() || isGenerating}
                      className="btn-primary h-[52px] w-[52px] p-0 flex-shrink-0 rounded-xl"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {generatedCode && (
              <div className="w-80 border-l border-white/10 bg-black/20 backdrop-blur-sm flex flex-col">
                <div className="border-b border-white/10 p-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Plugin Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Plugin Name</label>
                      <input
                        type="text"
                        value={pluginName}
                        onChange={(e) => setPluginName(e.target.value)}
                        placeholder="Enter plugin name..."
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Description</label>
                      <textarea
                        value={pluginDescription}
                        onChange={(e) => setPluginDescription(e.target.value)}
                        placeholder="Describe what this plugin does..."
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm resize-none h-20 backdrop-blur-sm"
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="text-white font-medium mb-3">Code Preview</h4>
                  <div className="glass-card p-4">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                      {generatedCode.substring(0, 1000)}
                      {generatedCode.length > 1000 && "\n\n... (truncated)"}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
