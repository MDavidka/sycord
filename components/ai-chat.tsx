"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Copy, Settings, HelpCircle, RotateCcw, ArrowLeft, X, Save, Menu, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [codeViewerContent, setCodeViewerContent] = useState("")
  const [editingMetadata, setEditingMetadata] = useState(false)
  const [showCodeViewer, setShowCodeViewer] = useState(false)
  const [usageInstructions, setUsageInstructions] = useState("")
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
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
      let contextPrompt = aiPrompt
      if (currentCodeVersion && currentChatSession) {
        const previousVersions = codeVersions.slice(-3)
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

  const handleClearConversation = () => {
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
      <DialogContent className="w-full h-full sm:w-[95vw] sm:max-w-6xl sm:h-[90vh] bg-black/95 backdrop-blur-xl border-0 sm:border sm:border-white/10 text-white overflow-hidden p-0 sm:rounded-lg">
        <DialogHeader className="border-b border-white/10 p-2 sm:p-4 bg-black/50 backdrop-blur-sm flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-5 h-5 sm:w-8 sm:h-8 relative">
              <Image src="/s1-logo.png" alt="S1 AI Lab" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <DialogTitle className="text-white text-sm sm:text-xl font-semibold">S1 AI Lab</DialogTitle>
              <DialogDescription className="text-gray-400 text-xs hidden sm:block">
                Generate Discord bots with AI
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
              title="Clear Conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 sm:hidden"
              title="Toggle Code Preview"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Section */}
          <div className={`flex-1 flex flex-col ${showMobileSidebar ? "hidden sm:flex" : "flex"}`}>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 bg-black/20">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 relative mb-4 opacity-50">
                    <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
                  </div>
                  <p className="text-center text-sm sm:text-lg font-medium mb-2">Welcome to S1 AI Lab</p>
                  <p className="text-center text-xs sm:text-base opacity-75 max-w-md">
                    Describe what you want to create and I'll generate Discord bot code for you.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} max-w-full`}
                  >
                    <div
                      className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 max-w-[90%] sm:max-w-[70%] ${
                        message.role === "user"
                          ? "bg-white text-black rounded-br-none"
                          : "bg-gray-800/60 backdrop-blur-sm text-white border border-white/10 rounded-bl-none"
                      }`}
                    >
                      {message.isCode ? (
                        <div className="space-y-2">
                          <ReactMarkdown className="text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none">
                            {message.content}
                          </ReactMarkdown>
                          {generatedCode && (
                            <div className="bg-black/40 rounded-lg p-2 sm:p-3 border border-white/10 mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400 font-mono">Generated Code</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(generatedCode)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <pre className="text-xs sm:text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap rounded-md p-2 bg-black/30 border border-white/10">
                                {generatedCode.substring(0, 150)}
                                {generatedCode.length > 150 && "..."}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 p-2 sm:p-4 bg-black/30 backdrop-blur-sm">
              {isGenerating && (
                <div className="mb-3 bg-gray-800/60 rounded-lg p-2 sm:p-3 border border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 relative">
                      <Image src="/s1-logo.png" alt="S1" width={16} height={16} className="object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm text-gray-300">Generating code...</span>
                        <span className="text-xs text-gray-400">{Math.round(generationProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-white h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasError && (
                <div className="mb-3 bg-red-900/20 border border-red-500/30 rounded-lg p-2 sm:p-3 flex items-center justify-between">
                  <p className="text-red-400 text-xs sm:text-sm">{errorMessage}</p>
                  <Button
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 h-6 px-2"
                  >
                    Retry
                  </Button>
                </div>
              )}

              <div className="flex space-x-1 sm:space-x-2">
                <Textarea
                  ref={textareaRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="flex-1 bg-black/60 border-white/20 text-white placeholder-gray-400 resize-none min-h-[40px] max-h-24 text-xs sm:text-sm py-2 px-3 rounded-lg"
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
                  className="bg-white text-black hover:bg-gray-200 h-10 w-10 p-0 flex-shrink-0 rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Code Preview Section - Mobile Toggle */}
          {generatedCode && (
            <div
              className={`fixed sm:relative inset-0 z-50 sm:z-auto w-full sm:w-96 border-l border-white/10 bg-black/40 backdrop-blur-sm flex flex-col transform transition-transform duration-300 ${
                showMobileSidebar ? "translate-x-0" : "translate-x-full sm:translate-x-0"
              }`}
            >
              <div className="border-b border-white/10 p-2 sm:p-4 flex items-center justify-between">
                <h3 className="text-white font-semibold text-xs sm:text-sm">Generated Code</h3>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedCode)}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowMobileSidebar(false)}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-white sm:hidden"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="p-2 sm:p-4 flex-1 overflow-y-auto">
                <div className="space-y-2 mb-3">
                  <input
                    type="text"
                    value={pluginName}
                    onChange={(e) => setPluginName(e.target.value)}
                    placeholder="Plugin name..."
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-2 py-1.5 text-white placeholder-gray-400 text-xs"
                  />
                  <textarea
                    value={pluginDescription}
                    onChange={(e) => setPluginDescription(e.target.value)}
                    placeholder="Plugin description..."
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-2 py-1.5 text-white placeholder-gray-400 text-xs resize-none h-16"
                  />
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg p-2 sm:p-3 mb-3">
                  <pre className="text-[10px] sm:text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {generatedCode}
                  </pre>
                </div>
              </div>
              <div className="border-t border-white/10 p-2 sm:p-4">
                <Button
                  onClick={handleSaveAIFunction}
                  disabled={!pluginName.trim() || !generatedCode.trim() || isSaving}
                  className="w-full bg-white text-black hover:bg-gray-200 h-8 text-xs font-medium rounded-lg"
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
