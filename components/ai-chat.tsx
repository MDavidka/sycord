"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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

    let currentStepIndex = 0
    const progressInterval = setInterval(() => {
      if (currentStepIndex < progressSteps.length) {
        setGenerationStep(progressSteps[currentStepIndex].step)
        setGenerationProgress(progressSteps[currentStepIndex].progress)
        currentStepIndex++
      }
    }, 1000)

    try {
      let contextPrompt = `Create a Discord bot plugin. User request: ${aiPrompt}`
      if (currentCodeVersion && currentChatSession) {
        const previousVersions = codeVersions.slice(-2)
        const contextInfo = previousVersions
          .map((v) => `Version ${v.version}: ${v.code.substring(0, 300)}...`)
          .join("\n\n")

        contextPrompt = `Current code context:\n${contextInfo}\n\nUser modification request: ${aiPrompt}\n\nProvide only raw Python code without explanations or usage instructions.`
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

      const workPlan = `Work Plan:\n1. Analyze user requirements\n2. Design bot architecture\n3. Implement core functionality\n4. Add error handling\n5. Test and optimize`

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: aiPrompt,
        timestamp: new Date(),
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: "I've created a work plan and generated the code for your Discord bot plugin.",
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
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationStep("")
      }, 500)
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
          usageInstructions: "",
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
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 relative">
                <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
              </div>
              <span className="text-white font-semibold text-lg">S1 AI Lab</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewChat}
            className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-full"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32" ref={chatContainerRef}>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 relative mb-6 opacity-60">
                <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
              </div>
              <h2 className="text-white text-2xl font-semibold mb-3">Welcome to S1 AI Lab</h2>
              <p className="text-gray-400 text-lg max-w-md">
                Describe what Discord bot you want to create and I'll generate the code for you.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${message.role === "user" ? "" : "w-full"}`}>
                  <div
                    className={`rounded-2xl px-5 py-4 ${
                      message.role === "user"
                        ? "bg-white text-black ml-auto max-w-md"
                        : "bg-gray-900/60 backdrop-blur-sm text-white border border-white/10"
                    }`}
                  >
                    {message.isCode ? (
                      <div className="space-y-4">
                        <ReactMarkdown className="text-base leading-relaxed">{message.content}</ReactMarkdown>

                        {message.workPlan && (
                          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                            <h4 className="text-blue-300 font-semibold mb-2">Work Plan</h4>
                            <ReactMarkdown className="text-blue-100 text-sm leading-relaxed">
                              {message.workPlan}
                            </ReactMarkdown>
                          </div>
                        )}

                        {generatedCode && (
                          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                              <span className="text-gray-300 font-medium">Generated Code</span>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleCodeVisibility(message.id)}
                                  className="h-8 px-3 text-white bg-white/10 hover:bg-white/20 rounded-lg"
                                >
                                  {message.showCode ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-1" />
                                      Hide Code
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Show Code
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(generatedCode)}
                                  className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-lg"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {message.showCode && (
                              <div className="p-4">
                                <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                  {generatedCode}
                                </pre>
                              </div>
                            )}

                            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
                              <div className="flex items-center space-x-3">
                                <Button
                                  onClick={handleSaveAIFunction}
                                  disabled={!pluginName.trim() || !generatedCode.trim() || isSaving}
                                  className="bg-white text-black hover:bg-gray-200 h-9 px-4 rounded-lg font-medium"
                                >
                                  {isSaving ? (
                                    "Saving..."
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="h-9 px-4 text-white bg-white/10 hover:bg-white/20 rounded-lg"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Check Code
                                </Button>
                              </div>

                              {isGenerating && (
                                <div className="flex items-center space-x-2 text-sm text-gray-400">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                  <span>{generationStep}</span>
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
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-sm mx-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 relative">
                <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{generationStep}</span>
                  <span className="text-gray-400 text-sm">{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          {hasError && (
            <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <Textarea
              ref={textareaRef}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="flex-1 bg-gray-900/60 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 resize-none min-h-[48px] max-h-32 text-base rounded-xl px-4 py-3"
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
              className="bg-white text-black hover:bg-gray-200 h-12 w-12 p-0 flex-shrink-0 rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
