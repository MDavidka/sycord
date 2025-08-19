"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MessageSquare, Send, Eye, Loader2, User, Lightbulb, Wrench, Bug, Check } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal" | "missing_details" | "complex_task" | "out_of_scope"
  pluginName?: string
  code?: string
  usageInstructions?: string
  missingDetails?: string[]
  complexFiles?: { filename: string; code: string }[]
  timestamp: Date
}

interface GenerationStep {
  id: string
  icon: React.ReactNode
  label: string
  status: "pending" | "active" | "completed"
  progress: number
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [editingPlugin, setEditingPlugin] = useState<string | null>(null)
  const [missingDetailsInputs, setMissingDetailsInputs] = useState<{ [key: string]: string }>({})

  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [generationTimer, setGenerationTimer] = useState<number>(0)
  const [isGenerationActive, setIsGenerationActive] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isGenerationActive) {
      timerRef.current = setInterval(() => {
        setGenerationTimer((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isGenerationActive])

  const initializeGenerationSteps = () => {
    const steps: GenerationStep[] = [
      {
        id: "info",
        icon: <User className="h-4 w-4" />,
        label: "Information collected",
        status: "pending",
        progress: 20,
      },
      {
        id: "planning",
        icon: <Lightbulb className="h-4 w-4" />,
        label: "Planning structure",
        status: "pending",
        progress: 40,
      },
      {
        id: "coding",
        icon: <Wrench className="h-4 w-4" />,
        label: "Making Python Cog",
        status: "pending",
        progress: 60,
      },
      {
        id: "debugging",
        icon: <Bug className="h-4 w-4" />,
        label: "Finding bugs / optimizing",
        status: "pending",
        progress: 80,
      },
      {
        id: "finishing",
        icon: <Check className="h-4 w-4" />,
        label: "Finishing code",
        status: "pending",
        progress: 100,
      },
    ]
    setGenerationSteps(steps)
    setCurrentStep(0)
    setGenerationTimer(0)
    setIsGenerationActive(true)
  }

  const runGenerationPipeline = async () => {
    for (let i = 0; i < generationSteps.length; i++) {
      setCurrentStep(i)
      setGenerationSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === i ? "active" : index < i ? "completed" : "pending",
        })),
      )

      // Simulate step duration
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))
    }

    setIsGenerationActive(false)
    setCurrentStep(-1)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: inputValue,
      type: "normal",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: data.content || "Response generated",
        type: data.type || "normal",
        timestamp: new Date(),
      }

      // Add specific data based on type
      if (data.type === "plugin") {
        aiMessage.pluginName = data.pluginName
        aiMessage.code = data.code
        aiMessage.usageInstructions = data.usageInstructions

        // Start generation pipeline for plugin creation
        initializeGenerationSteps()
        runGenerationPipeline()
      } else if (data.type === "missing_details") {
        aiMessage.missingDetails = data.missingDetails
      } else if (data.type === "complex_task") {
        aiMessage.complexFiles = data.complexFiles
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: "ai",
        content: "Sorry, I encountered an error. Please try again.",
        type: "question",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMissingDetailsSubmit = async (messageId: string, details: string[]) => {
    const detailsText = details
      .map((detail, index) => `${detail}:${missingDetailsInputs[`${messageId}_${index}`] || ""}`)
      .join(", ")

    const followUpMessage = `I requested this feature before, but missed this detail ${detailsText}.`

    setInputValue(followUpMessage)
    setMissingDetailsInputs({})
  }

  const handleSavePlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code || !message?.pluginName) return

    try {
      const response = await fetch("/api/user-ai-functions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pluginName: message.pluginName,
          code: message.code,
          usageInstructions: message.usageInstructions,
          serverId: "default",
        }),
      })

      if (response.ok) {
        // Show success feedback
        console.log("Plugin saved successfully")
      }
    } catch (error) {
      console.error("Error saving plugin:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-[#101010]/95 backdrop-blur-xl text-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClose()}
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 relative">
              <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
            </div>
            <span className="text-xs text-gray-400 mt-1">s1-small</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([])}
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-16 h-16 relative mb-4 opacity-50">
                <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
              </div>
              <p className="text-center text-lg font-medium mb-2">Welcome to S1 AI Lab</p>
              <p className="text-center opacity-75 max-w-md">
                Ask questions about Discord bots or request plugin creation
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "user" ? (
                  <div className="max-w-[80%] bg-white/90 backdrop-blur-sm text-gray-900 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                ) : message.type === "question" || message.type === "out_of_scope" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.type === "out_of_scope" && (
                      <div className="mt-3 flex justify-center">
                        <Button
                          size="sm"
                          onClick={() => setMessages([])}
                          className="bg-white text-black hover:bg-gray-200"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          New Chat
                        </Button>
                      </div>
                    )}
                  </div>
                ) : message.type === "missing_details" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-4">{message.content}</p>
                    <div className="space-y-3">
                      {message.missingDetails?.map((detail, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium mb-1">{detail}</label>
                          <Input
                            value={missingDetailsInputs[`${message.id}_${index}`] || ""}
                            onChange={(e) =>
                              setMissingDetailsInputs((prev) => ({
                                ...prev,
                                [`${message.id}_${index}`]: e.target.value,
                              }))
                            }
                            className="bg-black/40 border-white/20 text-white"
                            placeholder={`Enter ${detail}`}
                          />
                        </div>
                      ))}
                      <Button
                        onClick={() => handleMissingDetailsSubmit(message.id, message.missingDetails || [])}
                        className="w-full bg-white text-black hover:bg-gray-200"
                      >
                        Submit Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-mono">PY</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{message.pluginName || "Discord Bot Plugin"}</h3>
                          <p className="text-xs text-gray-400">AI Generated Discord Bot Plugin</p>
                        </div>
                        {message.type === "complex_task" && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-red-400">Complex Task</span>
                          </div>
                        )}
                      </div>

                      {/* Usage Instructions */}
                      {message.usageInstructions && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-blue-300">{message.usageInstructions}</p>
                        </div>
                      )}

                      {/* Generation Pipeline */}
                      {isGenerationActive && generationSteps.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">Generating Plugin</span>
                            <span className="text-xs text-gray-400">{formatTime(generationTimer)}</span>
                          </div>
                          <div className="space-y-2">
                            {generationSteps.map((step, index) => (
                              <div key={step.id} className="flex items-center space-x-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    step.status === "completed"
                                      ? "bg-green-600"
                                      : step.status === "active"
                                        ? "bg-blue-600 animate-pulse"
                                        : "bg-gray-600"
                                  }`}
                                >
                                  {step.icon}
                                </div>
                                <span
                                  className={`text-sm ${step.status === "active" ? "text-white" : "text-gray-400"}`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${generationSteps[currentStep]?.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedCode(expandedCode === message.id ? null : message.id)}
                          className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSavePlugin(message.id)}
                          className="flex-1 bg-white text-black hover:bg-gray-200 h-10 font-medium"
                        >
                          Deploy
                        </Button>
                      </div>
                    </div>

                    {/* Code Display */}
                    {expandedCode === message.id && (
                      <div className="border-t border-white/10 bg-black/40">
                        {message.type === "complex_task" && message.complexFiles ? (
                          <div className="p-4">
                            <div className="flex space-x-2 mb-4 border-b border-white/10">
                              {message.complexFiles.map((file, index) => (
                                <button key={index} className="px-3 py-2 text-sm bg-gray-700 rounded-t-lg">
                                  {file.filename}
                                </button>
                              ))}
                            </div>
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                              {message.complexFiles[0]?.code}
                            </pre>
                          </div>
                        ) : (
                          <div className="p-4">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                              {message.code}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating response...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 p-4 bg-[#101010]/40 backdrop-blur-sm">
          <div className="flex items-end space-x-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question or request a plugin..."
              className="flex-1 bg-[#101010]/60 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 text-white placeholder-gray-400 resize-none min-h-[40px] max-h-32 text-base focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ fontSize: "16px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGenerating}
              className="bg-white text-black hover:bg-gray-200 h-10 w-10 p-0 rounded-full flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
