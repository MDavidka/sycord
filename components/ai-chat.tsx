"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Copy, ArrowLeft, Plus, Eye, EyeOff, Save, CheckCircle } from "lucide-react"
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
  workPlan?: string
  showCode?: boolean
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
  const [generationStep, setGenerationStep] = useState("")
  const [pluginName, setPluginName] = useState("")
  const [pluginDescription, setPluginDescription] = useState("")
  const [pluginThumbnailUrl, setPluginThumbnailUrl] = useState("")
  const [pluginProfileUrl, setPluginProfileUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
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
    setGenerationStep("Creating work plan...")

    const progressSteps = [
      { step: "Creating work plan...", progress: 20 },
      { step: "Analyzing requirements...", progress: 40 },
      { step: "Generating code...", progress: 70 },
      { step: "Finalizing...", progress: 95 },
    ]

    let stepIndex = 0
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setGenerationStep(progressSteps[stepIndex].step)
        setGenerationProgress(progressSteps[stepIndex].progress)
        stepIndex++
      }
    }, 1000)

    try {
      let contextPrompt = `Please provide only raw Python code without any explanations, usage notes, or comments. User request: ${aiPrompt}`

      if (currentCodeVersion && currentChatSession) {
        const previousVersions = codeVersions.slice(-3)
        const contextInfo = previousVersions
          .map((v) => `Version ${v.version}: ${v.code.substring(0, 500)}...`)
          .join("\n\n")

        contextPrompt = `Current code state: ${currentCodeVersion.code}\n\nPlease make these changes and provide only raw Python code: ${aiPrompt}`
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
      setGenerationStep("Complete!")

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: aiPrompt,
        timestamp: new Date(),
      }

      const workPlan = `Work Plan:\n1. Analyze user requirements\n2. Generate Python code\n3. Optimize for Discord bot functionality\n4. Ensure code quality and structure`

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: "Code generated successfully based on your requirements.",
        isCode: true,
        timestamp: new Date(),
        workPlan: workPlan,
        showCode: false,
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
      setTimeout(() => {
        setGenerationStep("")
        setGenerationProgress(0)
      }, 2000)
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

  const toggleCodeVisibility = (messageId: string) => {
    setMessages(messages.map((msg) => (msg.id === messageId ? { ...msg, showCode: !msg.showCode } : msg)))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const createNewChat = () => {
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
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 w-full h-full max-w-none bg-white/95 backdrop-blur-xl border-0 text-gray-900 overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100/70 backdrop-blur-3xl" />
        <div className="relative flex flex-col h-full">
          <DialogHeader className="sticky top-0 z-10 border-b border-gray-200/50 p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-9 w-9 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="w-8 h-8 relative">
                  <Image src="/s1-logo.png" alt="S1 AI Lab" width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <DialogTitle className="text-gray-900 text-xl font-semibold">S1 AI Lab</DialogTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={createNewChat}
                className="h-9 w-9 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div 
              ref={chatContainerRef} 
              className="flex-1 overflow-y-auto p-4 space-y-6 bg-transparent"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                  <div className="w-16 h-16 relative mb-4 opacity-50">
                    <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
                  </div>
                  <p className="text-center text-lg font-medium mb-2">Welcome to S1 AI Lab</p>
                  <p className="text-center text-base opacity-75 max-w-md">
                    Describe what you want to create and I'll generate Discord bot code for you.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 backdrop-blur-sm ${
                        message.role === "user"
                          ? "bg-gray-900 text-white"
                          : "bg-white/90 text-gray-900 border border-gray-200/50 shadow-sm"
                      }`}
                    >
                      {message.isCode ? (
                        <div className="space-y-3">
                          {message.workPlan && (
                            <div className="bg-blue-50/80 rounded-lg p-3 border border-blue-200/50">
                              <h4 className="text-sm font-medium text-blue-900 mb-2">Work Plan</h4>
                              <pre className="text-xs text-blue-800 whitespace-pre-wrap">{message.workPlan}</pre>
                            </div>
                          )}

                          <ReactMarkdown className="text-base leading-relaxed">{message.content}</ReactMarkdown>

                          {generatedCode && (
                            <div className="bg-gray-50/80 rounded-lg border border-gray-200/50 overflow-hidden mt-3">
                              <div className="flex items-center justify-between p-3 border-b border-gray-200/50">
                                <span className="text-sm font-medium text-gray-700">Generated Code</span>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleCodeVisibility(message.id)}
                                    className="h-8 px-3 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100"
                                  >
                                    {message.showCode ? "Hide Code" : "Show Code"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(generatedCode)}
                                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {message.showCode && (
                                <div className="p-3 bg-white/50">
                                  <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                    {generatedCode}
                                  </pre>
                                </div>
                              )}

                              <div className="flex items-center justify-between p-3 border-t border-gray-200/50 bg-white/50">
                                <div className="flex items-center space-x-2">
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
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Check Code
                                  </Button>
                                </div>
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
              <div ref={messagesEndRef} />
            </div>

            {isGenerating && (
              <div className="sticky bottom-0 border-t border-gray-200/50 p-4 bg-white/80 backdrop-blur-sm">
                <div className="bg-blue-50/80 rounded-lg p-3 border border-blue-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 relative">
                      <Image src="/s1-logo.png" alt="S1" width={16} height={16} className="object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-900 font-medium">{generationStep}</span>
                        <span className="text-xs text-blue-700">{Math.round(generationProgress)}%</span>
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
              </div>
            )}

            {hasError && (
              <div className="sticky bottom-0 border-t border-red-200/50 p-4 bg-red-50/80 backdrop-blur-sm">
                <div className="bg-red-100/80 border border-red-200/50 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 border-t border-gray-200/50 p-4 bg-white/80 backdrop-blur-sm">
              <div className="flex space-x-3">
                <Textarea
                  ref={textareaRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="flex-1 bg-white/80 border-gray-200/50 text-gray-900 placeholder-gray-500 resize-none min-h-[44px] max-h-32 text-base"
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
                  className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 h-11 w-11 p-0 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}