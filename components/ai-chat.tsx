"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Send, Eye, Loader2, Code, CheckCircle } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal" | "missing_details" | "complex_task" | "out_of_scope"
  code?: string
  pluginName?: string
  usageInstructions?: string
  missingDetails?: string[]
  files?: Array<{ id: string; filename: string; code: string }>
  timestamp: Date
}

interface GenerationStep {
  id: number
  name: string
  icon: string
  status: "pending" | "active" | "completed"
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

  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    { id: 1, name: "Information collected", icon: "👥", status: "pending" },
    { id: 2, name: "Planning structure", icon: "💡", status: "pending" },
    { id: 3, name: "Making Python Cog", icon: "🔧", status: "pending" },
    { id: 4, name: "Finding bugs / optimizing", icon: "🐞", status: "pending" },
    { id: 5, name: "Finishing code", icon: "✅", status: "pending" },
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [showPipeline, setShowPipeline] = useState(false)
  const [pipelineProgress, setPipelineProgress] = useState(0)
  const [pipelineTimer, setPipelineTimer] = useState(0)
  const [missingDetailsInputs, setMissingDetailsInputs] = useState<Record<string, string>>({})
  const [deployedPlugins, setDeployedPlugins] = useState<Set<string>>(new Set())
  const [showingCheckmark, setShowingCheckmark] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (showPipeline && currentStep > 0) {
      timerRef.current = setInterval(() => {
        setPipelineTimer((prev) => prev + 1)
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
  }, [showPipeline, currentStep])

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
        content: data.content || "",
        type: data.type || "normal",
        code: data.code,
        pluginName: data.pluginName,
        usageInstructions: data.usageInstructions,
        missingDetails: data.missingDetails,
        files: data.files,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      if (data.type === "missing_details" && data.missingDetails) {
        const inputs: Record<string, string> = {}
        data.missingDetails.forEach((detail: string) => {
          inputs[detail] = ""
        })
        setMissingDetailsInputs(inputs)
      }

      if (data.type === "plugin" && data.code) {
        await startGenerationPipeline(inputValue)
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

  const startGenerationPipeline = async (originalMessage: string) => {
    setShowPipeline(true)
    setPipelineProgress(20)
    setPipelineTimer(0)

    for (let step = 1; step <= 5; step++) {
      setCurrentStep(step)
      setGenerationSteps((prev) =>
        prev.map((s) => (s.id === step ? { ...s, status: "active" } : s.id < step ? { ...s, status: "completed" } : s)),
      )

      setPipelineProgress(20 * step)

      // Simulate step processing time
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      setGenerationSteps((prev) => prev.map((s) => (s.id === step ? { ...s, status: "completed" } : s)))
    }

    setShowPipeline(false)
    setCurrentStep(0)
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
    if (!message?.code || !message?.pluginName) return

    setShowingCheckmark(messageId)

    try {
      const response = await fetch("/api/user-ai-functions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pluginName: message.pluginName,
          code: message.code,
          usageInstructions: message.usageInstructions || "",
          serverId: "default",
        }),
      })

      if (response.ok) {
        setTimeout(() => {
          setShowingCheckmark(null)
          setDeployedPlugins((prev) => new Set([...prev, messageId]))
        }, 1000)
      }
    } catch (error) {
      console.error("Error deploying plugin:", error)
      setShowingCheckmark(null)
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
    setMissingDetailsInputs({})
    setDeployedPlugins(new Set())
    setShowingCheckmark(null)
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
                      <div className="mt-3 p-2 bg-white/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span className="text-xs">Start New Chat</span>
                      </div>
                    )}
                  </div>
                ) : message.type === "missing_details" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-4">{message.content}</p>
                    <div className="space-y-3">
                      {message.missingDetails?.map((detail, index) => (
                        <div key={index}>
                          <label className="block text-xs text-gray-400 mb-1">{detail}</label>
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
                        onClick={handleMissingDetailsSubmit}
                        disabled={Object.values(missingDetailsInputs).some((v) => !v.trim())}
                        className="w-full bg-white text-black hover:bg-gray-200 mt-3"
                      >
                        Submit Details
                      </Button>
                    </div>
                  </div>
                ) : message.type === "complex_task" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center relative">
                          <Code className="h-6 w-6" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{message.pluginName || "Complex Task"}</h3>
                          <p className="text-xs text-red-400">Multiple files • Complex Task</p>
                        </div>
                      </div>

                      {message.usageInstructions && (
                        <p className="text-sm mb-4 text-gray-300">{message.usageInstructions}</p>
                      )}

                      <div className="flex items-center space-x-2 mb-4">
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
                          onClick={() => handleDeployPlugin(message.id)}
                          disabled={deployedPlugins.has(message.id) || showingCheckmark === message.id}
                          className="flex-1 bg-white text-black hover:bg-gray-200 h-8"
                        >
                          {showingCheckmark === message.id ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : deployedPlugins.has(message.id) ? (
                            "Edit"
                          ) : (
                            "Deploy"
                          )}
                        </Button>
                      </div>
                    </div>

                    {expandedCode === message.id && message.files && (
                      <div className="border-t border-white/10 bg-black/40">
                        <div className="flex border-b border-white/10">
                          {message.files.map((file, index) => (
                            <button
                              key={file.id}
                              className={`px-4 py-2 text-xs border-r border-white/10 ${
                                index === 0 ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
                              }`}
                            >
                              {file.filename}
                            </button>
                          ))}
                        </div>
                        <div className="p-4">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                            {message.files[0]?.code}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    {message.usageInstructions && (
                      <div className="p-4 border-b border-white/10 bg-blue-500/10">
                        <p className="text-sm text-blue-300">{message.usageInstructions}</p>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-mono">PY</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{message.pluginName || "Discord Bot Plugin"}</h3>
                          <p className="text-xs text-gray-400">AI Generated Discord Bot Plugin</p>
                        </div>
                      </div>

                      {showPipeline && (
                        <div className="mb-4 p-3 bg-black/40 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Generation Progress</span>
                            <span className="text-xs text-gray-400">{formatTime(pipelineTimer)}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1 mb-3">
                            <div
                              className="bg-white h-1 rounded-full transition-all duration-300"
                              style={{ width: `${pipelineProgress}%` }}
                            ></div>
                          </div>
                          <div className="space-y-2">
                            {generationSteps.map((step) => (
                              <div key={step.id} className="flex items-center space-x-2">
                                <span className="text-sm">{step.icon}</span>
                                <span
                                  className={`text-xs ${
                                    step.status === "completed"
                                      ? "text-green-400"
                                      : step.status === "active"
                                        ? "text-white"
                                        : "text-gray-500"
                                  }`}
                                >
                                  {step.name}
                                </span>
                                {step.status === "active" && (
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                )}
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
                          onClick={() => handleDeployPlugin(message.id)}
                          disabled={deployedPlugins.has(message.id) || showingCheckmark === message.id}
                          className="flex-1 bg-white text-black hover:bg-gray-200 h-8"
                        >
                          {showingCheckmark === message.id ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : deployedPlugins.has(message.id) ? (
                            "Edit"
                          ) : (
                            "Deploy"
                          )}
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
