"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Send, Save } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal"
  code?: string
  timestamp: Date
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

interface PipelineState {
  isActive: boolean
  currentStep: number
  steps: Array<{
    id: number
    name: string
    icon: string
    status: "pending" | "active" | "completed"
  }>
  startTime: number
  pluginName: string
  pluginCode: string
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [editingPlugin, setEditingPlugin] = useState<string | null>(null)
  const [pluginMetadata, setPluginMetadata] = useState({
    name: "",
    description: "",
    thumbnailUrl: "",
    profileUrl: "",
  })

  const [pipeline, setPipeline] = useState<PipelineState>({
    isActive: false,
    currentStep: 0,
    steps: [
      { id: 1, name: "Information Collected", icon: "🧑‍🧒", status: "pending" },
      { id: 2, name: "Planning Structure", icon: "💡", status: "pending" },
      { id: 3, name: "Making Python Cog", icon: "🔧", status: "pending" },
      { id: 4, name: "Finding bugs/optimizing", icon: "🐞", status: "pending" },
      { id: 5, name: "Finishing Code", icon: "✅", status: "pending" },
    ],
    startTime: 0,
    pluginName: "",
    pluginCode: "",
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pipeline])

  const [elapsedTime, setElapsedTime] = useState(0)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (pipeline.isActive) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - pipeline.startTime)
      }, 100)
    }
    return () => clearInterval(interval)
  }, [pipeline.isActive, pipeline.startTime])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const executeStep = async (step: number, userMessage: string) => {
    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, step }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()

      // Update pipeline step status
      setPipeline((prev) => ({
        ...prev,
        steps: prev.steps.map((s) => (s.id === step ? { ...s, status: "completed" } : s)),
        currentStep: step,
      }))

      // Parse response for step 5 (final step)
      if (step === 5 && data.response) {
        const pluginNameMatch = data.response.match(/\[1\.1\]\s*(.+?)(?:\n|\[2\])/s)
        const codeMatch = data.response.match(/\[2\]\s*([\s\S]+)/)

        if (pluginNameMatch && codeMatch) {
          setPipeline((prev) => ({
            ...prev,
            pluginName: pluginNameMatch[1].trim(),
            pluginCode: codeMatch[1].trim(),
            isActive: false,
          }))
        }
      }

      return data
    } catch (error) {
      console.error(`Error in step ${step}:`, error)
      throw error
    }
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

    const isPluginRequest =
      inputValue.toLowerCase().includes("plugin") ||
      inputValue.toLowerCase().includes("command") ||
      inputValue.toLowerCase().includes("bot") ||
      inputValue.toLowerCase().includes("create") ||
      inputValue.toLowerCase().includes("make")

    if (isPluginRequest) {
      // Initialize pipeline
      setPipeline((prev) => ({
        ...prev,
        isActive: true,
        currentStep: 1,
        startTime: Date.now(),
        steps: prev.steps.map((s, i) => ({
          ...s,
          status: i === 0 ? "active" : "pending",
        })),
        pluginName: "",
        pluginCode: "",
      }))

      try {
        // Execute steps with delays
        for (let step = 1; step <= 5; step++) {
          // Update current step to active
          setPipeline((prev) => ({
            ...prev,
            currentStep: step,
            steps: prev.steps.map((s) =>
              s.id === step ? { ...s, status: "active" } : s.id < step ? { ...s, status: "completed" } : s,
            ),
          }))

          await executeStep(step, inputValue)

          // Add delay between steps (except last step)
          if (step < 5) {
            await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000))
          }
        }
      } catch (error) {
        console.error("Pipeline error:", error)
        setPipeline((prev) => ({ ...prev, isActive: false }))
      }
    } else {
      // Handle regular questions
      try {
        const response = await fetch("/api/ai/generate-plugin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: inputValue, step: 1 }),
        })

        if (!response.ok) throw new Error("Failed to generate response")

        const data = await response.json()
        const content = data.response || ""
        const displayContent = content.replace(/^\[1\]\s*/, "")

        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          role: "ai",
          content: displayContent,
          type: "question",
          timestamp: new Date(),
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
      }
    }

    setIsGenerating(false)
  }

  const handleSavePlugin = async () => {
    if (!pipeline.pluginCode || !pipeline.pluginName) return

    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pipeline.pluginName,
          description: pluginMetadata.description || "AI Generated Discord Bot Plugin",
          code: pipeline.pluginCode,
          thumbnailUrl: pluginMetadata.thumbnailUrl,
          profileUrl: pluginMetadata.profileUrl,
        }),
      })

      if (response.ok) {
        setPluginMetadata({ name: "", description: "", thumbnailUrl: "", profileUrl: "" })
        // Reset pipeline after saving
        setPipeline((prev) => ({
          ...prev,
          isActive: false,
          currentStep: 0,
          steps: prev.steps.map((s) => ({ ...s, status: "pending" })),
          pluginName: "",
          pluginCode: "",
        }))
      }
    } catch (error) {
      console.error("Error saving plugin:", error)
    }
  }

  const handleBack = () => {
    if (pipeline.pluginCode || messages.some((m) => m.type === "plugin")) {
      setShowSavePrompt(true)
    } else {
      onClose()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setEditingPlugin(null)
    setPipeline((prev) => ({
      ...prev,
      isActive: false,
      currentStep: 0,
      steps: prev.steps.map((s) => ({ ...s, status: "pending" })),
      pluginName: "",
      pluginCode: "",
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-[#101010]/95 backdrop-blur-xl text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center justify-center">
            <div className="w-8 h-8 relative">
              <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
            </div>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !pipeline.isActive && !pipeline.pluginCode ? (
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
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "user" ? (
                    <div className="max-w-[80%] bg-white/90 backdrop-blur-sm text-gray-900 rounded-2xl px-4 py-3 shadow-lg">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {(pipeline.isActive || pipeline.pluginCode) && (
                <div className="max-w-[90%] mx-auto">
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header with status and timer */}
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                            <span className="text-lg">⚡</span>
                          </div>
                          <div>
                            <h3 className="text-white font-medium">
                              {pipeline.isActive
                                ? pipeline.steps.find((s) => s.id === pipeline.currentStep)?.name || "Processing..."
                                : "Plugin Generated"}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {pipeline.isActive ? "Generating plugin..." : "Ready to deploy"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-mono text-sm">{formatTime(elapsedTime)}</div>
                          <div className="text-gray-400 text-xs">{pipeline.isActive ? "In Progress" : "Completed"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Status bar */}
                    <div className="px-4 py-3">
                      <div className="relative h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-400 to-white rounded-full transition-all duration-500"
                          style={{ width: `${(pipeline.currentStep / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        {pipeline.steps.map((step, index) => (
                          <div key={step.id} className="flex flex-col items-center">
                            <div
                              className={`
                              w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300
                              ${
                                step.status === "completed"
                                  ? "bg-white/20 text-white"
                                  : step.status === "active"
                                    ? "bg-white/30 text-white animate-pulse"
                                    : "bg-gray-600/50 text-gray-400"
                              }
                            `}
                            >
                              {step.icon}
                            </div>
                            {index < pipeline.steps.length - 1 && (
                              <div
                                className={`
                                absolute w-16 h-0.5 mt-5 transition-all duration-300
                                ${step.status === "completed" ? "bg-white/30" : "bg-gray-600/30"}
                              `}
                                style={{ left: `${index * 20 + 10}%` }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Plugin content when completed */}
                    {pipeline.pluginCode && (
                      <div className="border-t border-white/10">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-mono text-white">PY</span>
                              </div>
                              <div>
                                <h3 className="font-medium text-white">{pipeline.pluginName}</h3>
                                <p className="text-xs text-gray-400">Discord Bot Plugin</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={handleSavePlugin}
                                className="bg-white text-black hover:bg-gray-200 h-8 px-3"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Deploy
                              </Button>
                            </div>
                          </div>

                          <div className="bg-black/40 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                              {pipeline.pluginCode}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4 bg-[#101010]/40 backdrop-blur-sm">
          <div className="flex items-end space-x-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                messages.length > 0 || pipeline.pluginCode
                  ? "Continue the conversation or ask for modifications..."
                  : "Ask a question or request a plugin..."
              }
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

        {/* Save prompt modal */}
        {showSavePrompt && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#101010]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Save Changes?</h3>
              <p className="text-gray-400 text-sm mb-4">
                You have an unsaved plugin. Do you want to save it before leaving?
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
