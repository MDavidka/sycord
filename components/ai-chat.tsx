"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Copy, ArrowLeft, Plus, Eye, Save, Check } from "lucide-react"
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

  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([])
  const [currentCodeVersion, setCurrentCodeVersion] = useState<CodeVersion | null>(null)

  const [showWorkPlan, setShowWorkPlan] = useState(false)
  const [workPlan, setWorkPlan] = useState("")
  const [showCodeInCard, setShowCodeInCard] = useState<{ [key: string]: boolean }>({})
  const [processingStatus, setProcessingStatus] = useState("")

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
      // Load existing chat sessions or create default one
      const sessions = currentAIFunction.chatSessions || []
      setChatSessions(sessions)

      if (sessions.length > 0) {
        const currentSession = sessions.find((s) => s.id === currentAIFunction.currentChatId) || sessions[0]
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
    setProcessingStatus("Creating work plan...")

    try {
      const workPlanResponse = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Create a detailed work plan for: ${aiPrompt}. Only provide the work plan, no code yet.`,
          generateWorkPlan: true,
        }),
      })

      const workPlanData = await workPlanResponse.json()
      setWorkPlan(workPlanData.workPlan || "")
      setShowWorkPlan(true)
      setProcessingStatus("Generating code...")

      // Continue with code generation
      let contextPrompt = aiPrompt
      if (currentCodeVersion && currentChatSession) {
        const previousVersions = codeVersions.slice(-3)
        const contextInfo = previousVersions
          .map((v) => `Version ${v.version}: ${v.code.substring(0, 500)}...`)
          .join("\n\n")

        contextPrompt = `<current_code>${currentCodeVersion.code}</current_code>\n\nUser request: ${aiPrompt}`
      }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextPrompt + "\n\nProvide only raw Python code, no explanations or usage notes.",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setGenerationProgress(100)
      setProcessingStatus("Complete")

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: aiPrompt,
        timestamp: new Date(),
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: "Code generated successfully!",
        isCode: true,
        timestamp: new Date(),
        codeVersionId: `version_${Date.now()}`,
      }

      const newMessages = [...messages, userMessage, aiMessage]
      setMessages(newMessages)

      // Create new code version
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

      // Update current chat session
      if (currentChatSession) {
        const updatedSession = {
          ...currentChatSession,
          messages: newMessages,
          codeVersions: newCodeVersions,
          last_updated: new Date().toISOString(),
        }
        setCurrentChatSession(updatedSession)

        // Update sessions array
        const updatedSessions = chatSessions.map((s) => (s.id === currentChatSession.id ? updatedSession : s))
        setChatSessions(updatedSessions)
      }

      setAiPrompt("")
    } catch (error) {
      console.error("Error generating AI response:", error)
      setHasError(true)
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsGenerating(false)
      setProcessingStatus("")
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

  const toggleCodeVisibility = (messageId: string) => {
    setShowCodeInCard((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none bg-white/95 backdrop-blur-xl border-0 text-gray-900 overflow-hidden p-0 sm:rounded-none">
        <DialogHeader className="border-b border-gray-200/50 p-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-10 w-10 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 relative">
                <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <DialogTitle className="text-gray-900 text-xl font-semibold">S1 AI Lab</DialogTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              className="h-10 w-10 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                <div className="w-16 h-16 relative mb-6 opacity-60">
                  <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
                </div>
                <p className="text-center text-xl font-medium mb-3 text-gray-700">Welcome to S1 AI Lab</p>
                <p className="text-center text-base opacity-75 max-w-md">
                  Describe what you want to create and I'll generate a work plan and Python code for you.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gray-900 text-white"
                        : "bg-white/70 backdrop-blur-md text-gray-900 border border-gray-200/50 shadow-sm"
                    }`}
                  >
                    {message.isCode ? (
                      <div className="space-y-4">
                        <ReactMarkdown className="text-base leading-relaxed">{message.content}</ReactMarkdown>

                        {workPlan && showWorkPlan && (
                          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
                            <h4 className="font-semibold text-blue-900 mb-2">Work Plan</h4>
                            <ReactMarkdown className="text-sm text-blue-800 leading-relaxed">{workPlan}</ReactMarkdown>
                          </div>
                        )}

                        {generatedCode && (
                          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">Generated Code</span>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleCodeVisibility(message.id)}
                                  className="h-8 px-3 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {showCodeInCard[message.id] ? "Hide Code" : "Show Code"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(generatedCode)}
                                  className="h-8 px-3 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                            </div>

                            {showCodeInCard[message.id] && (
                              <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap font-mono bg-white/50 rounded-lg p-3 border border-gray-200/50">
                                {generatedCode}
                              </pre>
                            )}

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/50">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveAIFunction}
                                  disabled={!pluginName.trim() || !generatedCode.trim() || isSaving}
                                  className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Check Code
                                </Button>
                              </div>

                              {(isGenerating || processingStatus) && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span>{processingStatus || "Processing..."}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-base leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200/50 p-4 bg-white/80 backdrop-blur-md sticky bottom-0">
            {isGenerating && (
              <div className="mb-4 bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 relative">
                    <Image src="/s1-logo.png" alt="S1" width={20} height={20} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-800 font-medium">{processingStatus}</span>
                      <span className="text-xs text-blue-600">{Math.round(generationProgress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200/50 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Textarea
                ref={textareaRef}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to create..."
                className="flex-1 bg-white/70 backdrop-blur-sm border-gray-200 text-gray-900 placeholder-gray-500 resize-none min-h-[48px] max-h-32 text-base rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                style={{ fontSize: "16px" }} // Prevent mobile zoom
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
                className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 h-12 w-12 p-0 flex-shrink-0 rounded-xl"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
