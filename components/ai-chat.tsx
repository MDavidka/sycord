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
  const [isSaving, setIsSaving] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null)
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
        setCurrentChatSession(initialSession)
        setMessages([])
        setCodeVersions(initialSession.codeVersions)
        setCurrentCodeVersion(initialSession.codeVersions[0])
        setGeneratedCode(currentAIFunction.code)
      }
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
      let contextPrompt = `Provide only raw Python code without explanations. User request: ${aiPrompt}`
      if (currentCodeVersion) {
        contextPrompt = `Current code: ${currentCodeVersion.code}\n\nMake these changes: ${aiPrompt}`
      }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextPrompt }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGenerationStep("Complete!")

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: aiPrompt,
        timestamp: new Date(),
      }

      const workPlan = `Work Plan:\n1. Analyze requirements\n2. Generate Python code\n3. Optimize functionality\n4. Ensure quality`

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: "Code generated successfully",
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
    if (!generatedCode.trim()) return

    setIsSaving(true)
    try {
      const method = currentAIFunction ? "PUT" : "POST"
      const url = currentAIFunction ? `/api/user-ai-functions/${currentAIFunction._id}` : "/api/user-ai-functions"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentAIFunction?.name || "New Plugin",
          description: currentAIFunction?.description || "",
          code: generatedCode,
          usageInstructions: currentCodeVersion?.usageInstructions || "",
          chatSessions: currentChatSession ? [currentChatSession] : [],
        }),
      })

      if (response.ok) onClose()
    } catch (error) {
      console.error("Error saving AI function:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleCodeVisibility = (messageId: string) => {
    setMessages(messages.map((msg) => 
      msg.id === messageId ? { ...msg, showCode: !msg.showCode } : msg
    ))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: `chat_${Date.now()}`,
      name: `Chat ${Date.now()}`,
      messages: [],
      codeVersions: [],
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }
    setCurrentChatSession(newSession)
    setMessages([])
    setCodeVersions([])
    setCurrentCodeVersion(null)
    setGeneratedCode("")
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 w-full h-full max-w-none bg-gray-100/95 backdrop-blur-3xl border-0 p-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[size:20px_20px] opacity-10" />
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="sticky top-0 z-10 p-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 p-0 text-gray-700 hover:bg-gray-200/50"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 relative">
                    <Image src="/s1-logo.svg" alt="S1 AI" width={28} height={28} />
                  </div>
                  <DialogTitle className="text-gray-900 text-lg font-medium">AI Lab</DialogTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={createNewChat}
                className="h-9 w-9 p-0 text-gray-700 hover:bg-gray-200/50"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Chat Area */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                <div className="w-16 h-16 relative mb-4 opacity-50">
                  <Image src="/s1-logo.svg" alt="S1" width={64} height={64} />
                </div>
                <p className="text-center text-lg font-medium mb-2">AI Plugin Generator</p>
                <p className="text-center text-base opacity-75 max-w-md">
                  Describe your Discord bot plugin and I'll generate the code
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 backdrop-blur-md ${
                      message.role === "user"
                        ? "bg-gray-800 text-white"
                        : "bg-white/90 text-gray-900 border border-gray-200/50"
                    }`}
                  >
                    {message.isCode ? (
                      <div className="space-y-3">
                        {message.workPlan && (
                          <div className="bg-blue-50/80 rounded-lg p-3 border border-blue-200/50">
                            <h4 className="text-xs font-medium text-blue-800 mb-1">WORK PLAN</h4>
                            <pre className="text-xs text-blue-700 whitespace-pre-wrap">{message.workPlan}</pre>
                          </div>
                        )}

                        <div className="text-base">{message.content}</div>

                        <div className="bg-gray-50/80 rounded-lg border border-gray-200/50 overflow-hidden mt-2">
                          <div className="flex items-center justify-between p-3">
                            <span className="text-xs font-medium text-gray-700">GENERATED CODE</span>
                            <div className="flex space-x-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => toggleCodeVisibility(message.id)}
                                className="h-7 text-xs px-2 bg-white/80 text-gray-700 hover:bg-gray-100"
                              >
                                {message.showCode ? "HIDE CODE" : "SHOW CODE"}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyToClipboard(generatedCode)}
                                className="h-7 w-7 p-0 bg-white/80 text-gray-700 hover:bg-gray-100"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {message.showCode && (
                            <div className="p-3 bg-white/50 border-t border-gray-200/50">
                              <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono">
                                {generatedCode}
                              </pre>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-2 bg-white/80 border-t border-gray-200/50">
                            <div className="flex space-x-1">
                              <Button
                                size="xs"
                                onClick={handleSaveAIFunction}
                                disabled={isSaving}
                                className="h-7 text-xs px-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                              >
                                <Save className="h-3.5 w-3.5 mr-1" />
                                SAVE
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                className="h-7 text-xs px-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                CHECK
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-base">{message.content}</div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Status Indicators */}
          {isGenerating && (
            <div className="sticky bottom-0 p-3 bg-white/80 backdrop-blur-md border-t border-gray-200/50">
              <div className="flex items-center space-x-3 px-2 py-1.5 bg-blue-50/80 rounded-lg border border-blue-200/50">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-blue-800">{generationStep}</span>
                    <span className="text-blue-700">{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-blue-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasError && (
            <div className="sticky bottom-0 p-3 bg-white/80 backdrop-blur-md border-t border-gray-200/50">
              <div className="px-3 py-2 bg-red-50/80 rounded-lg border border-red-200/50">
                <p className="text-xs text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="sticky bottom-0 p-3 bg-white/80 backdrop-blur-md border-t border-gray-200/50">
            <div className="flex space-x-2">
              <Textarea
                ref={textareaRef}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe plugin feature..."
                className="flex-1 min-h-[44px] text-base bg-white/90 border-gray-200/60 resize-none placeholder:text-gray-500"
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
                className="h-11 w-11 p-0 bg-white border border-gray-200/60 hover:bg-gray-100 text-gray-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}