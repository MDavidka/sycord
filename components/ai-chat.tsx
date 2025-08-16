"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  workPlan?: string[]
  hasWorkPlan?: boolean
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
  const [showCodeInMessage, setShowCodeInMessage] = useState<{ [key: string]: boolean }>({})

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

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 10, 90))
    }, 800)

    try {
      // Step 1: Generate work plan
      setGenerationStep("Analyzing requirements...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setGenerationStep("Creating work plan...")
      setGenerationProgress(30)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      let contextPrompt = `Create a Discord bot plugin with the following request: ${aiPrompt}`
      if (currentCodeVersion && currentChatSession) {
        const previousVersions = codeVersions.slice(-2)
        const contextInfo = previousVersions
          .map((v) => `Version ${v.version}: ${v.code.substring(0, 300)}...`)
          .join("\n\n")

        contextPrompt = `Current code context:\n${contextInfo}\n\nUser modification request: ${aiPrompt}\n\nPlease modify the existing code according to the request. Only provide raw Python code without explanations.`
      }

      // Step 2: Generate code
      setGenerationStep("Generating code...")
      setGenerationProgress(60)

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

      // Create work plan
      const workPlan = [
        "Analyze user requirements",
        "Design bot architecture",
        "Implement core functionality",
        "Add error handling",
        "Test and validate code",
      ]

      // Add user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: aiPrompt,
        timestamp: new Date(),
      }

      // Add AI response with work plan
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: "I've created a work plan and generated the code for your Discord bot plugin.",
        isCode: true,
        timestamp: new Date(),
        workPlan,
        hasWorkPlan: true,
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
      setGenerationStep("")
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
      codeVersions: currentCodeVersion ? [currentCodeVersion] : [],
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }

    const updatedSessions = [...chatSessions, newSession]
    setChatSessions(updatedSessions)
    setCurrentChatSession(newSession)
    setMessages([])
  }

  const toggleCodeVisibility = (messageId: string) => {
    setShowCodeInMessage((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none bg-background/95 backdrop-blur-xl border-0 text-foreground overflow-hidden p-0 sm:rounded-none md:w-[95vw] md:max-w-6xl md:h-[90vh] md:rounded-xl md:border md:border-border">
        <DialogHeader className="frosted-glass border-b border-border p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 relative">
                <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-xl font-semibold">S1 AI Lab</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Discord Bot Plugin Creator
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4">
                  <div className="w-16 h-16 relative mb-4 opacity-50">
                    <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
                  </div>
                  <p className="text-center text-lg font-medium mb-2 text-foreground">Welcome to S1 AI Lab</p>
                  <p className="text-center text-base opacity-75 max-w-md">
                    Describe what Discord bot functionality you want to create and I'll generate the code for you.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] space-y-3">
                      <div className={message.role === "user" ? "chat-message-user" : "chat-message-ai"}>
                        <ReactMarkdown className="text-sm leading-relaxed">{message.content}</ReactMarkdown>
                      </div>

                      {message.hasWorkPlan && message.workPlan && (
                        <div className="work-plan-card animate-fade-in">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircle className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium text-foreground">Work Plan</span>
                          </div>
                          <div className="space-y-2">
                            {message.workPlan.map((step, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                <span className="text-muted-foreground">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.isCode && generatedCode && (
                        <div className="code-card animate-fade-in">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono text-muted-foreground">Generated Code</span>
                              <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                                Version {codeVersions.length}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleCodeVisibility(message.id)}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              >
                                {showCodeInMessage[message.id] ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide Code
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Show Code
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(generatedCode)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {showCodeInMessage[message.id] && (
                            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                              <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                {generatedCode}
                              </pre>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-border/50">
                            <Button
                              size="sm"
                              onClick={handleSaveAIFunction}
                              disabled={!pluginName.trim() || !generatedCode.trim() || isSaving}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowCodeInMessage((prev) => ({ ...prev, [message.id]: true }))}
                              className="h-8 px-3 text-xs"
                            >
                              Check Code
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

            <div className="frosted-glass border-t border-border p-4 sticky bottom-0">
              {isGenerating && (
                <div className="status-processing rounded-lg p-3 mb-4 animate-pulse-glow">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 relative">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{generationStep}</span>
                        <span className="text-xs">{Math.round(generationProgress)}%</span>
                      </div>
                      <div className="w-full bg-accent/20 rounded-full h-1.5">
                        <div
                          className="bg-accent h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
                  <p className="text-destructive text-sm">{errorMessage}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <Textarea
                  ref={textareaRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the Discord bot functionality you want to create..."
                  className="flex-1 bg-input border-border text-foreground placeholder-muted-foreground resize-none min-h-[44px] max-h-32 text-base"
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
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-11 p-0 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {generatedCode && (
            <div className="w-80 frosted-glass border-l border-border flex flex-col">
              <div className="border-b border-border p-4">
                <h3 className="text-foreground font-semibold text-base mb-3">Plugin Details</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={pluginName}
                    onChange={(e) => setPluginName(e.target.value)}
                    placeholder="Plugin name..."
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm"
                  />
                  <textarea
                    value={pluginDescription}
                    onChange={(e) => setPluginDescription(e.target.value)}
                    placeholder="Plugin description..."
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm resize-none h-20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-xs text-muted-foreground font-mono leading-relaxed">
                  <div className="mb-2 text-foreground font-medium">Code Preview:</div>
                  {generatedCode.substring(0, 500)}
                  {generatedCode.length > 500 && "..."}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
