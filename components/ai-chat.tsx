"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ArrowLeft, Plus, Eye, Copy, Save, CheckCircle } from "lucide-react"
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

      if (currentChatSession) {
        const updatedSession = {
          ...currentChatSession,
          messages: newMessages,
          codeVersions: newCodeVersions,
          last_updated: new Date().toISOString(),
        }
        setCurrentChatSession(updatedSession)

        const updatedSessions = chatSessions.map((s) => 
          s.id === currentChatSession.id ? updatedSession : s
        )
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
    if (!generatedCode.trim()) return

    setIsSaving(true)
    try {
      const method = currentAIFunction ? "PUT" : "POST"
      const url = currentAIFunction ? 
        `/api/user-ai-functions/${currentAIFunction._id}` : 
        "/api/user-ai-functions"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Plugin ${Date.now().toString().slice(-4)}`,
          code: generatedCode,
          usageInstructions: "Generated by S1 AI",
          chatSessions,
          currentChatId: currentChatSession?.id,
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
      name: `Chat ${chatSessions.length + 1}`,
      messages: [],
      codeVersions: [],
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }

    setChatSessions([...chatSessions, newSession])
    setCurrentChatSession(newSession)
    setMessages([])
    setCodeVersions([])
    setCurrentCodeVersion(null)
    setGeneratedCode("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] flex flex-col bg-white/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 p-4 bg-white/80 backdrop-blur-lg border-b border-white/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/50 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-gray-800" />
            </button>
            <div className="w-8 h-8 relative">
              <Image 
                src="/s1-logo.png" 
                alt="S1 AI Lab" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <h1 className="text-gray-900 text-xl font-bold">S1 AI Lab</h1>
          </div>
          
          <button 
            onClick={createNewChat}
            className="p-2 rounded-full hover:bg-white/50 transition-all"
          >
            <Plus className="h-5 w-5 text-gray-800" />
          </button>
        </div>

        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="mb-6 w-20 h-20 relative opacity-80">
                <Image 
                  src="/s1-logo.png" 
                  alt="S1" 
                  width={80} 
                  height={80} 
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to S1 AI Lab</h2>
              <p className="text-gray-600 max-w-md">
                Describe what you want to create and I'll generate Discord bot code for you.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 backdrop-blur-sm ${
                  message.role === "user"
                    ? "bg-gray-800 text-white"
                    : "bg-white/95 text-gray-900 border border-white/30 shadow-sm"
                }`}>
                  {message.isCode ? (
                    <div className="space-y-3">
                      {message.workPlan && (
                        <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-100/50 mb-3">
                          <h3 className="text-sm font-medium text-blue-900 mb-1">Work Plan</h3>
                          <p className="text-xs text-blue-800 whitespace-pre-line">{message.workPlan}</p>
                        </div>
                      )}
                      
                      <ReactMarkdown className="text-base">
                        {message.content}
                      </ReactMarkdown>
                      
                      <div className="mt-4 bg-gray-50/80 rounded-xl border border-gray-200/50 overflow-hidden">
                        <div className="flex items-center justify-between p-3 border-b border-gray-200/50 bg-white/50">
                          <span className="text-sm font-medium text-gray-700">Generated Code</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleCodeVisibility(message.id)}
                              className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {message.showCode ? "Hide" : "Show Code"}
                            </button>
                            <button
                              onClick={() => copyToClipboard(generatedCode)}
                              className="p-1.5 bg-white border border-gray-300 rounded-lg"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {message.showCode && (
                          <div className="p-3 bg-white/50 max-h-60 overflow-auto">
                            <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                              {generatedCode}
                            </pre>
                          </div>
                        )}
                        
                        <div className="p-3 border-t border-gray-200/50 bg-white/70 flex justify-between">
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveAIFunction}
                              disabled={!generatedCode.trim() || isSaving}
                              className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg flex items-center disabled:opacity-50"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {isSaving ? "Saving..." : "Save Plugin"}
                            </button>
                            <button className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Check Code
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-base">{message.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Progress Indicator */}
        {isGenerating && (
          <div className="sticky bottom-0 p-3 bg-white/80 backdrop-blur-sm border-t border-white/30">
            <div className="bg-blue-50/70 rounded-lg p-3 border border-blue-100/50">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 relative">
                  <Image 
                    src="/s1-logo.png" 
                    alt="S1" 
                    width={16} 
                    height={16} 
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-900 font-medium">{generationStep}</span>
                    <span className="text-blue-700">{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-blue-200/50 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {hasError && (
          <div className="sticky bottom-0 p-3 bg-red-50/80 backdrop-blur-sm border-t border-red-100/50">
            <div className="bg-red-100/80 border border-red-200/50 rounded-lg p-3">
              <p className="text-red-800 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0 p-4 bg-white/80 backdrop-blur-sm border-t border-white/30">
          <div className="flex space-x-3">
            <Textarea
              ref={textareaRef}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="flex-1 bg-white/90 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-500 resize-none min-h-[56px] max-h-40 text-base shadow-sm"
              style={{ fontSize: "16px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleGenerateAI()
                }
              }}
            />
            <button
              onClick={handleGenerateAI}
              disabled={!aiPrompt.trim() || isGenerating}
              className="h-14 w-14 flex-shrink-0 bg-white border border-gray-300/50 rounded-xl flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              <Send className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}