"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Copy, ArrowLeft, Plus, Eye, Save, CheckCircle } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface WorkPlan {
  id: string
  title: string
  steps: string[]
  estimatedTime: string
  status: "pending" | "processing" | "completed" | "error"
}

interface ChatMessage {
  id: string
  role: "user" | "ai" | "system"
  content: string
  isCode?: boolean
  timestamp?: Date
  codeVersionId?: string
  workPlan?: WorkPlan // Added work plan to messages
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

  const [currentWorkPlan, setCurrentWorkPlan] = useState<WorkPlan | null>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>("")

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

    const workPlan: WorkPlan = {
      id: `plan_${Date.now()}`,
      title: `Create: ${aiPrompt.substring(0, 50)}...`,
      steps: [
        "Analyze requirements",
        "Design code structure",
        "Generate Python code",
        "Add error handling",
        "Optimize and finalize",
      ],
      estimatedTime: "2-3 minutes",
      status: "processing",
    }
    setCurrentWorkPlan(workPlan)

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 15, 95))
    }, 500)

    try {
      const contextPrompt = `Generate only raw Python code. No explanations, no usage instructions, no comments about how to use it. Just pure Python code.

${
  currentCodeVersion
    ? `Current code: <code>${currentCodeVersion.code}</code>

User request: ${aiPrompt}`
    : `User request: ${aiPrompt}`
}`

      setProcessingStatus("Generating code...")

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
      setProcessingStatus("Complete")

      const completedWorkPlan = { ...workPlan, status: "completed" as const }
      setCurrentWorkPlan(completedWorkPlan)

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: aiPrompt,
        timestamp: new Date(),
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: "Code generated successfully based on your requirements.",
        isCode: true,
        timestamp: new Date(),
        workPlan: completedWorkPlan,
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
      setProcessingStatus("Error occurred")
      if (currentWorkPlan) {
        setCurrentWorkPlan({ ...currentWorkPlan, status: "error" })
      }
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
    setCurrentWorkPlan(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="fixed inset-0 w-full h-full max-w-none max-h-none bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-black/95 backdrop-blur-xl border-0 text-white overflow-hidden p-0 m-0 rounded-none sm:rounded-lg sm:inset-4 sm:w-auto sm:h-auto sm:max-w-6xl sm:max-h-[90vh]">
          <DialogHeader className="flex-row items-center justify-between border-b border-white/10 p-4 bg-white/5 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 relative">
                <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold">S1 AI Lab</DialogTitle>
                <DialogDescription className="text-gray-400 text-sm hidden sm:block">
                  Python Code Generator
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              className="h-9 w-9 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-black/20">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                  <div className="w-16 h-16 relative mb-6 opacity-60">
                    <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-white">Welcome to S1 AI Lab</h2>
                  <p className="text-center opacity-75 max-w-md">
                    Describe what you want to create and I'll generate Python code for you.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] ${message.role === "user" ? "" : "space-y-3"}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-white text-black shadow-lg"
                            : "bg-white/10 backdrop-blur-md text-white border border-white/20"
                        }`}
                      >
                        <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
                      </div>

                      {message.role === "ai" && message.workPlan && (
                        <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-xl p-4 space-y-4">
                          {/* Work Plan */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-white">Work Plan</h4>
                            <div className="space-y-1">
                              {message.workPlan.steps.map((step, index) => (
                                <div key={index} className="flex items-center space-x-2 text-xs text-gray-300">
                                  <CheckCircle className="h-3 w-3 text-green-400" />
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Bar */}
                          {isGenerating && currentWorkPlan?.id === message.workPlan.id && (
                            <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-300">{processingStatus}</span>
                                <span className="text-xs text-gray-400">{Math.round(generationProgress)}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div
                                  className="bg-white h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${generationProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => setShowCodeModal(true)}
                              className="bg-white text-black hover:bg-gray-200 h-8 px-3 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Show Code
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveAIFunction}
                              disabled={!generatedCode.trim() || isSaving}
                              className="bg-white text-black hover:bg-gray-200 h-8 px-3 text-xs"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-md">
              {hasError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <Textarea
                  ref={textareaRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="flex-1 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder-gray-400 resize-none min-h-[48px] max-h-32 text-base rounded-xl focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  style={{ fontSize: "16px" }} // Prevents mobile zoom
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
                  className="bg-white text-black hover:bg-gray-200 h-12 w-12 p-0 flex-shrink-0 rounded-xl"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showCodeModal && (
        <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
          <DialogContent className="fixed inset-0 w-full h-full max-w-none max-h-none bg-black/95 backdrop-blur-xl border-0 text-white overflow-hidden p-0 m-0 rounded-none sm:rounded-lg sm:inset-8 sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[80vh]">
            <DialogHeader className="border-b border-white/10 p-4 bg-white/5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCodeModal(false)}
                    className="h-9 w-9 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <DialogTitle className="text-white text-lg font-semibold">Generated Code</DialogTitle>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedCode)}
                  className="h-9 w-9 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4 mb-4">
                <input
                  type="text"
                  value={pluginName}
                  onChange={(e) => setPluginName(e.target.value)}
                  placeholder="Plugin name..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 text-base"
                  style={{ fontSize: "16px" }}
                />
                <textarea
                  value={pluginDescription}
                  onChange={(e) => setPluginDescription(e.target.value)}
                  placeholder="Plugin description..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 text-base resize-none h-20"
                  style={{ fontSize: "16px" }}
                />
              </div>

              <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                  {generatedCode}
                </pre>
              </div>
            </div>

            <div className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-md">
              <Button
                onClick={() => {
                  handleSaveAIFunction()
                  setShowCodeModal(false)
                }}
                disabled={!pluginName.trim() || !generatedCode.trim() || isSaving}
                className="w-full bg-white text-black hover:bg-gray-200 h-12 font-medium rounded-xl"
              >
                {isSaving ? "Saving..." : "Save Function"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
