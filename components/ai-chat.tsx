"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Copy, ArrowLeft, Plus, Eye, EyeOff, Save, CheckCircle, Loader2 } from "lucide-react"
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
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl animate-fade-in">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-black/10 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 text-foreground hover:bg-black/5 rounded-full transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 relative">
                <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
              </div>
              <span className="text-foreground font-semibold text-lg tracking-tight">S1 AI Lab</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewChat}
            className="h-10 w-10 p-0 text-foreground hover:bg-black/5 rounded-full transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 smooth-scroll" ref={chatContainerRef}>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
              <div className="w-16 h-16 relative mb-6 opacity-60">
                <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
              </div>
              <h2 className="text-foreground text-2xl font-semibold mb-3 tracking-tight">Welcome to S1 AI Lab</h2>
              <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                Describe what Discord bot you want to create and I'll generate the code for you.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
              >
                <div className={`max-w-[85%] ${message.role === "user" ? "" : "w-full"}`}>
                  <div className={message.role === "user" ? "chat-bubble-user max-w-md ml-auto" : "chat-bubble-ai"}>
                    {message.isCode ? (
                      <div className="space-y-4">
                        <ReactMarkdown className="text-base leading-relaxed">{message.content}</ReactMarkdown>

                        {message.workPlan && (
                          <div className="glass-card p-4 border-l-4 border-l-primary">
                            <h4 className="text-primary font-semibold mb-2 flex items-center">
                              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                              Work Plan
                            </h4>
                            <ReactMarkdown className="text-foreground text-sm leading-relaxed">
                              {message.workPlan}
                            </ReactMarkdown>
                          </div>
                        )}

                        {generatedCode && (
                          <div className="glass-card overflow-hidden animate-scale-in">
                            <div className="flex items-center justify-between p-4 border-b border-black/10 bg-white/30">
                              <span className="text-foreground font-medium">Generated Code</span>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => toggleCodeVisibility(message.id)}
                                  className="modern-button h-8 px-3 text-sm"
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
                                  onClick={() => copyToClipboard(generatedCode)}
                                  className="modern-button h-8 w-8 p-0"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {message.showCode && (
                              <div className="p-4 bg-white/20">
                                <pre className="text-sm text-foreground overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-white/50 rounded-lg p-4 border border-black/10">
                                  {generatedCode}
                                </pre>
                              </div>
                            )}

                            <div className="flex items-center justify-between p-4 border-t border-black/10 bg-white/30">
                              <div className="flex items-center space-x-3">
                                <Button
                                  onClick={handleSaveAIFunction}
                                  disabled={!pluginName.trim() || !generatedCode.trim() || isSaving}
                                  className="modern-button-primary h-9 px-4"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </>
                                  )}
                                </Button>
                                <Button className="modern-button h-9 px-4">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Check Code
                                </Button>
                              </div>

                              {isGenerating && (
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
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
        <div className="status-overlay animate-fade-in">
          <div className="glass-overlay p-6 max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 relative">
                <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground font-medium">{generationStep}</span>
                  <span className="text-muted-foreground text-sm">{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-black/10 p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {hasError && (
            <div className="mb-4 glass-card p-3 border-l-4 border-l-destructive animate-slide-up">
              <p className="text-destructive text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <Textarea
              ref={textareaRef}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="modern-input mobile-safe-input flex-1 resize-none min-h-[48px] max-h-32"
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
              className="modern-button-primary h-12 w-12 p-0 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
