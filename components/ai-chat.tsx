"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Send, Eye, Loader2, User, Lightbulb, Wrench, Bug, CheckCircle } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal" | "usage" | "missing-details" | "out-of-scope"
  code?: string
  pluginName?: string
  missingDetails?: string[]
  timestamp: Date
}

interface GenerationStep {
  id: string
  icon: React.ReactNode
  text: string
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
  const [pluginMetadata, setPluginMetadata] = useState({
    name: "",
    description: "",
    thumbnailUrl: "",
    profileUrl: "",
  })
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [showGenerationPipeline, setShowGenerationPipeline] = useState(false)
  const [generationTimer, setGenerationTimer] = useState(0)
  const [missingDetailsInputs, setMissingDetailsInputs] = useState<{ [key: string]: string }>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (showGenerationPipeline && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setGenerationTimer((prev) => prev + 1)
      }, 1000)
    } else if (!showGenerationPipeline && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
      setGenerationTimer(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [showGenerationPipeline])

  const initializeGenerationSteps = () => {
    const steps: GenerationStep[] = [
      {
        id: "collect",
        icon: <User className="h-4 w-4 text-gray-400" />,
        text: "Information collected",
        status: "active",
        progress: 20,
      },
      {
        id: "plan",
        icon: <Lightbulb className="h-4 w-4 text-gray-400" />,
        text: "Planning structure",
        status: "pending",
        progress: 40,
      },
      {
        id: "code",
        icon: <Wrench className="h-4 w-4 text-gray-400" />,
        text: "Making Python Cog",
        status: "pending",
        progress: 60,
      },
      {
        id: "debug",
        icon: <Bug className="h-4 w-4 text-gray-400" />,
        text: "Finding bugs / optimizing",
        status: "pending",
        progress: 80,
      },
      {
        id: "finish",
        icon: <CheckCircle className="h-4 w-4 text-gray-400" />,
        text: "Finishing code",
        status: "pending",
        progress: 100,
      },
    ]
    setGenerationSteps(steps)
  }

  const updateGenerationStep = (stepId: string, status: "pending" | "active" | "completed") => {
    setGenerationSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)))
  }

  const parseAIResponse = (response: string) => {
    // Parse different mark types
    const marks = {
      pluginName: response.match(/\[1\.1\](.*?)\[1\.1\]/)?.[1],
      code: response.match(/\[2\]([\s\S]*?)\[2\]/)?.[1],
      missingDetails: response.match(/\[3\](.*?)\[3\]/g)?.map((match) => match.replace(/\[3\]|\[3\]/g, "")),
      usage: response.match(/\[6\](.*?)(?=\[|$)/s)?.[1],
      outOfScope: response.includes("[5]"),
      question: response.includes("[1]"),
    }

    return marks
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

    // Check if this is a missing details response
    const isMissingDetailsResponse = Object.keys(missingDetailsInputs).length > 0

    if (isMissingDetailsResponse) {
      // Start generation pipeline
      setShowGenerationPipeline(true)
      initializeGenerationSteps()

      // Simulate the 5-step process
      setTimeout(() => updateGenerationStep("collect", "completed"), 1000)
      setTimeout(() => {
        updateGenerationStep("plan", "active")
        updateGenerationStep("collect", "completed")
      }, 2000)
      setTimeout(() => {
        updateGenerationStep("plan", "completed")
        updateGenerationStep("code", "active")
      }, 4000)
      setTimeout(() => {
        updateGenerationStep("code", "completed")
        updateGenerationStep("debug", "active")
      }, 6000)
      setTimeout(() => {
        updateGenerationStep("debug", "completed")
        updateGenerationStep("finish", "active")
      }, 8000)
    }

    try {
      const requestBody = isMissingDetailsResponse
        ? {
            message: `I requested this feature before ${messages[messages.length - 2]?.content}, but missed these details: ${Object.entries(
              missingDetailsInputs,
            )
              .map(([key, value]) => `${key}:${value}`)
              .join(", ")}.`,
            missingDetails: missingDetailsInputs,
          }
        : { message: inputValue }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()
      const content = data.response || ""

      // Parse the AI response for marks
      const marks = parseAIResponse(content)

      let messageType: ChatMessage["type"] = "normal"
      let displayContent = content
      let code = undefined
      let pluginName = undefined
      let missingDetails = undefined

      if (marks.question) {
        messageType = "question"
        displayContent = "This AI is only for plugin making."
      } else if (marks.outOfScope) {
        messageType = "out-of-scope"
        displayContent = "If you want a whole new function, start a new chat."
      } else if (marks.missingDetails && marks.missingDetails.length > 0) {
        messageType = "missing-details"
        displayContent = "I need some additional details to create your plugin:"
        missingDetails = marks.missingDetails
      } else if (marks.code) {
        messageType = "plugin"
        displayContent = "Plugin generated successfully!"
        code = marks.code.trim()
        pluginName = marks.pluginName || "Unknown Plugin"

        // Complete generation pipeline
        if (showGenerationPipeline) {
          setTimeout(() => {
            updateGenerationStep("finish", "completed")
            setTimeout(() => setShowGenerationPipeline(false), 2000)
          }, 1000)
        }
      }

      // Add usage instructions as separate message if present
      if (marks.usage) {
        const usageMessage: ChatMessage = {
          id: `msg_${Date.now()}_usage`,
          role: "ai",
          content: marks.usage.trim(),
          type: "usage",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, usageMessage])
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: displayContent,
        type: messageType,
        code,
        pluginName,
        missingDetails,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Clear missing details inputs after successful generation
      if (isMissingDetailsResponse) {
        setMissingDetailsInputs({})
      }
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

  const handleSavePlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code) return

    try {
      const response = await fetch("/api/user-ai-functions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: message.pluginName || pluginMetadata.name || "Untitled Plugin",
          description: pluginMetadata.description || "AI Generated Plugin",
          code: message.code,
          thumbnailUrl: pluginMetadata.thumbnailUrl,
          profileUrl: pluginMetadata.profileUrl,
        }),
      })

      if (response.ok) {
        setEditingPlugin(null)
        setPluginMetadata({ name: "", description: "", thumbnailUrl: "", profileUrl: "" })
      }
    } catch (error) {
      console.error("Error saving plugin:", error)
    }
  }

  const handleMissingDetailSubmit = (details: string[]) => {
    const inputs: { [key: string]: string } = {}
    details.forEach((detail) => {
      inputs[detail] = ""
    })
    setMissingDetailsInputs(inputs)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleBack = () => {
    if (messages.some((m) => m.type === "plugin")) {
      setShowSavePrompt(true)
    } else {
      onClose()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setExpandedCode(null)
    setEditingPlugin(null)
    setShowGenerationPipeline(false)
    setGenerationTimer(0)
    setMissingDetailsInputs({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-[#101010]/95 backdrop-blur-xl text-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
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
            onClick={handleNewChat}
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
                ) : message.type === "question" || message.type === "usage" || message.type === "out-of-scope" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.type === "out-of-scope" && (
                      <Button
                        onClick={handleNewChat}
                        className="mt-3 bg-white text-black hover:bg-gray-200 text-xs px-3 py-1 h-8"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        New Chat
                      </Button>
                    )}
                  </div>
                ) : message.type === "missing-details" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-4">{message.content}</p>
                    {message.missingDetails && (
                      <div className="space-y-3">
                        {message.missingDetails.map((detail, index) => (
                          <div key={index}>
                            <label className="block text-xs text-gray-400 mb-1 capitalize">
                              {detail.replace("-", " ")}
                            </label>
                            <input
                              type="text"
                              value={missingDetailsInputs[detail] || ""}
                              onChange={(e) =>
                                setMissingDetailsInputs((prev) => ({
                                  ...prev,
                                  [detail]: e.target.value,
                                }))
                              }
                              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder={`Enter ${detail}`}
                            />
                          </div>
                        ))}
                        <Button
                          onClick={() => {
                            const allFilled = message.missingDetails?.every((detail) =>
                              missingDetailsInputs[detail]?.trim(),
                            )
                            if (allFilled) {
                              handleSendMessage()
                            }
                          }}
                          disabled={!message.missingDetails?.every((detail) => missingDetailsInputs[detail]?.trim())}
                          className="w-full bg-white text-black hover:bg-gray-200 mt-3"
                        >
                          Continue Generation
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-mono">PY</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{message.pluginName || "Unknown Plugin"}</h3>
                          <p className="text-xs text-gray-400">AI Generated Discord Bot Plugin</p>
                        </div>
                      </div>

                      <p className="text-sm mb-4">{message.content}</p>

                      {showGenerationPipeline && (
                        <div className="mb-4 p-3 bg-black/40 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-400">Generation Pipeline</span>
                            <span className="text-xs text-gray-400 font-mono">{formatTime(generationTimer)}</span>
                          </div>
                          <div className="space-y-2">
                            {generationSteps.map((step) => (
                              <div key={step.id} className="flex items-center space-x-3">
                                <div
                                  className={`flex-shrink-0 ${
                                    step.status === "active" ? "animate-pulse" : ""
                                  } ${step.status === "completed" ? "text-green-400" : ""}`}
                                >
                                  {step.icon}
                                </div>
                                <span
                                  className={`text-xs flex-1 ${
                                    step.status === "completed"
                                      ? "text-green-400"
                                      : step.status === "active"
                                        ? "text-white"
                                        : "text-gray-500"
                                  }`}
                                >
                                  {step.text}
                                </span>
                                <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      step.status === "completed"
                                        ? "bg-green-400"
                                        : step.status === "active"
                                          ? "bg-blue-400"
                                          : "bg-gray-600"
                                    }`}
                                    style={{
                                      width:
                                        step.status === "completed" ? "100%" : step.status === "active" ? "60%" : "0%",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
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
                          className="bg-white text-black hover:bg-gray-200 px-4 h-8 text-xs font-medium flex-1"
                          onClick={() => handleSavePlugin(message.id)}
                        >
                          Deploy
                        </Button>
                      </div>
                    </div>

                    {expandedCode === message.id && message.code && (
                      <div className="border-t border-white/10 bg-black/40 p-4">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                          {message.code}
                        </pre>
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

        {showSavePrompt && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#101010]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Save Changes?</h3>
              <p className="text-gray-400 text-sm mb-4">
                You have unsaved plugins. Do you want to save them before leaving?
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowSavePrompt(false)
                    onClose()
                  }}
                  variant="ghost"
                  className="flex-1 text-white hover:bg-white/10"
                >
                  Don't Save
                </Button>
                <Button
                  onClick={() => setShowSavePrompt(false)}
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
