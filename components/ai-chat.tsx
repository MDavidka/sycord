"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Send, Eye, Edit3, Loader2, User, Lightbulb, Wrench, Bug, Check } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal"
  code?: string
  timestamp: Date
  marks?: {
    isQuestion: boolean
    pluginName: string
    code: string
    missingDetails: string[]
    isComplexTask: boolean
    complexFiles: Array<{ index: string; filename: string; code: string }>
    isOutOfScope: boolean
    usageInstructions: string
  }
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

interface GenerationStep {
  id: string
  label: string
  icon: React.ReactNode
  status: "pending" | "active" | "complete"
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
  const [currentStep, setCurrentStep] = useState(0)
  const [generationTimer, setGenerationTimer] = useState(0)
  const [showPipeline, setShowPipeline] = useState(false)
  const [missingDetailsInputs, setMissingDetailsInputs] = useState<Record<string, string>>({})
  const [deployedPlugins, setDeployedPlugins] = useState<Set<string>>(new Set())
  const [showDeploySuccess, setShowDeploySuccess] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (showPipeline && isGenerating) {
      timerRef.current = setInterval(() => {
        setGenerationTimer((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [showPipeline, isGenerating])

  const initializeGenerationPipeline = () => {
    const steps: GenerationStep[] = [
      {
        id: "collect",
        label: "Information collected",
        icon: <User className="h-4 w-4 text-gray-400" />,
        status: "active",
      },
      {
        id: "plan",
        label: "Planning structure",
        icon: <Lightbulb className="h-4 w-4 text-gray-400" />,
        status: "pending",
      },
      {
        id: "code",
        label: "Making Python Cog",
        icon: <Wrench className="h-4 w-4 text-gray-400" />,
        status: "pending",
      },
      {
        id: "debug",
        label: "Finding bugs / optimizing",
        icon: <Bug className="h-4 w-4 text-gray-400" />,
        status: "pending",
      },
      {
        id: "finish",
        label: "Finishing code",
        icon: <Check className="h-4 w-4 text-gray-400" />,
        status: "pending",
      },
    ]
    setGenerationSteps(steps)
    setCurrentStep(0)
    setGenerationTimer(0)
    setShowPipeline(true)
  }

  const advanceStep = () => {
    setGenerationSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        status: index < currentStep ? "complete" : index === currentStep ? "active" : "pending",
      })),
    )
    setCurrentStep((prev) => Math.min(prev + 1, generationSteps.length - 1))
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

    if (inputValue.toLowerCase().includes("bot") || inputValue.toLowerCase().includes("plugin")) {
      initializeGenerationPipeline()

      // Simulate pipeline progression
      setTimeout(() => advanceStep(), 1000)
      setTimeout(() => advanceStep(), 2000)
      setTimeout(() => advanceStep(), 3000)
      setTimeout(() => advanceStep(), 4000)
    }

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()
      const content = data.content || data.code || data.response || ""
      const marks = data.marks || {}

      let messageType: "question" | "plugin" | "normal" = "normal"
      let displayContent = content

      if (marks.isQuestion) {
        messageType = "question"
        displayContent = content.replace(/^\[1\]\s*/, "")
      } else if (marks.code || marks.pluginName) {
        messageType = "plugin"
        displayContent = marks.usageInstructions || "Plugin generated successfully!"
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: displayContent,
        type: messageType,
        code: marks.code || data.code,
        marks,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      if (marks.missingDetails && marks.missingDetails.length > 0) {
        const inputs: Record<string, string> = {}
        marks.missingDetails.forEach((detail: string) => {
          inputs[detail] = ""
        })
        setMissingDetailsInputs(inputs)
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
      setShowPipeline(false)
    }
  }

  const handleMissingDetailsSubmit = async () => {
    const details = Object.entries(missingDetailsInputs)
      .map(([key, value]) => `${key}:${value}`)
      .join(", ")

    const followUpMessage = `I requested this feature before, but missed this detail ${details}.`
    setInputValue(followUpMessage)
    setMissingDetailsInputs({})
    await handleSendMessage()
  }

  const handleDeployPlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code && !message?.marks?.code) return

    try {
      const response = await fetch("/api/user-ai-functions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pluginName: message.marks?.pluginName || "untitled-plugin",
          code: message.marks?.code || message.code,
          serverId: "default-server", // This should come from context
          usageInstructions: message.marks?.usageInstructions || "",
          isComplexTask: message.marks?.isComplexTask || false,
          files: message.marks?.complexFiles || [],
        }),
      })

      if (response.ok) {
        setDeployedPlugins((prev) => new Set([...prev, messageId]))
        setShowDeploySuccess(messageId)
        setTimeout(() => setShowDeploySuccess(null), 1000)
      }
    } catch (error) {
      console.error("Error deploying plugin:", error)
    }
  }

  const handleSavePlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code) return

    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pluginMetadata.name || "Untitled Plugin",
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
                ) : message.type === "question" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                ) : (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    {showPipeline && message.id === messages[messages.length - 1]?.id && (
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">Generating Plugin</span>
                          <span className="text-xs text-gray-400">{formatTime(generationTimer)}</span>
                        </div>
                        <div className="space-y-2">
                          {generationSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center space-x-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  step.status === "complete"
                                    ? "bg-green-500/20 text-green-400"
                                    : step.status === "active"
                                      ? "bg-blue-500/20 text-blue-400 animate-pulse"
                                      : "bg-gray-500/20 text-gray-500"
                                }`}
                              >
                                {step.icon}
                              </div>
                              <span
                                className={`text-sm ${
                                  step.status === "complete"
                                    ? "text-green-400"
                                    : step.status === "active"
                                      ? "text-blue-400"
                                      : "text-gray-500"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStep + 1) / generationSteps.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-mono">PY</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">
                            {message.marks?.pluginName || pluginMetadata.name || "Unknown Plugin"}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {pluginMetadata.description || "AI Generated Discord Bot Plugin"}
                          </p>
                          {message.marks?.isComplexTask && (
                            <div className="flex items-center space-x-1 mt-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-xs text-red-400">Complex Task</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm mb-4">{message.content}</p>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedCode(expandedCode === message.id ? null : message.id)}
                          className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {!deployedPlugins.has(message.id) ? (
                          <Button
                            size="sm"
                            onClick={() => handleDeployPlugin(message.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-8"
                          >
                            {showDeploySuccess === message.id ? <Check className="h-4 w-4 text-green-400" /> : "Deploy"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingPlugin(editingPlugin === message.id ? null : message.id)}
                            className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {expandedCode === message.id &&
                      (message.code || message.marks?.code || message.marks?.complexFiles) && (
                        <div className="border-t border-white/10 bg-black/40">
                          {message.marks?.isComplexTask && message.marks?.complexFiles ? (
                            <div className="p-4">
                              <div className="flex space-x-2 mb-4 border-b border-white/10">
                                {message.marks.complexFiles.map((file, index) => (
                                  <button
                                    key={file.index}
                                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-t-lg"
                                  >
                                    {file.filename}
                                  </button>
                                ))}
                              </div>
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                {message.marks.complexFiles[0]?.code || ""}
                              </pre>
                            </div>
                          ) : (
                            <div className="p-4">
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                {message.marks?.code || message.code}
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

          {Object.keys(missingDetailsInputs).length > 0 && (
            <div className="bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm font-medium mb-3">Missing Details Required</h3>
              <div className="space-y-3">
                {Object.entries(missingDetailsInputs).map(([detail, value]) => (
                  <div key={detail}>
                    <label className="block text-xs text-gray-400 mb-1">{detail}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setMissingDetailsInputs((prev) => ({ ...prev, [detail]: e.target.value }))}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                      placeholder={`Enter ${detail}`}
                    />
                  </div>
                ))}
                <Button
                  onClick={handleMissingDetailsSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={Object.values(missingDetailsInputs).some((v) => !v.trim())}
                >
                  Submit Details
                </Button>
              </div>
            </div>
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
