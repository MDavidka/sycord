"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MessageSquare, Edit3, Loader2, Play, CheckCircle } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal" | "detail-request" | "complex" | "new-chat-suggestion"
  code?: string
  pluginName?: string
  usageInstructions?: string
  missingDetails?: string[]
  complexFiles?: { [key: string]: string }
  timestamp: Date
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

interface GenerationStep {
  id: string
  label: string
  icon: JSX.Element
  status: "pending" | "active" | "completed"
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [editingPlugin, setEditingPlugin] = useState<string | null>(null)
  const [deployedPlugins, setDeployedPlugins] = useState<Set<string>>(new Set())
  const [detailInputs, setDetailInputs] = useState<{ [key: string]: string }>({})
  const [showDetailInputs, setShowDetailInputs] = useState<string | null>(null)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [showPipeline, setShowPipeline] = useState(false)
  const [activeTab, setActiveTab] = useState<{ [messageId: string]: string }>({})
  const [generationTimer, setGenerationTimer] = useState(0)
  const [generatingPluginData, setGeneratingPluginData] = useState<{
    name: string
    description: string
    startTime: number
    finalCode?: string
    finalPluginName?: string
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const pipelineSteps: GenerationStep[] = [
    { id: "collect", label: "Information collected", icon: <ArrowLeft />, status: "pending" },
    { id: "plan", label: "Planning structure", icon: <Edit3 />, status: "pending" },
    { id: "code", label: "Making Python Cog", icon: <Play />, status: "pending" },
    { id: "debug", label: "Finding bugs / optimizing", icon: <CheckCircle />, status: "pending" },
    { id: "finish", label: "Finishing code", icon: <Loader2 />, status: "pending" },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (showPipeline && generatingPluginData) {
      interval = setInterval(() => {
        setGenerationTimer(Date.now() - generatingPluginData.startTime)
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showPipeline, generatingPluginData])

  const parseAIResponse = (content: string): ChatMessage => {
    const messageId = `msg_${Date.now()}_ai`
    let messageType: ChatMessage["type"] = "normal"
    let parsedContent = content
    let code: string | undefined
    let pluginName: string | undefined
    let usageInstructions: string | undefined
    let missingDetails: string[] = []
    const complexFiles: { [key: string]: string } = {}

    // Parse [1] - Questions/explanations
    if (content.startsWith("[1]")) {
      messageType = "question"
      parsedContent = content.replace(/^\[1\]\s*/, "").replace(/\[1\]$/, "")
    }

    // Parse [1.1] - Plugin name
    const pluginNameMatch = content.match(/\[1\.1\](.*?)\[1\.1\]/)
    if (pluginNameMatch) {
      pluginName = pluginNameMatch[1].substring(0, 20) // Max 20 characters
      parsedContent = content.replace(/\[1\.1\].*?\[1\.1\]/, "")
    }

    // Parse [2] - Plugin code
    if (content.includes("[2]")) {
      messageType = "plugin"
      const codeMatch = content.match(/\[2\]([\s\S]*?)(?=\[|$)/)
      if (codeMatch) {
        code = codeMatch[1].trim()
        parsedContent = "Plugin generated successfully!"
      }
    }

    // Parse [3] - Missing details
    const detailMatches = content.match(/\[3\](.*?)\[3\]/g)
    if (detailMatches) {
      messageType = "detail-request"
      missingDetails = detailMatches.map((match) => match.replace(/\[3\]/g, ""))
      parsedContent = `I need the following details: ${missingDetails.join(", ")}`
    }

    // Parse [4] - Complex tasks
    if (content.includes("[4]")) {
      messageType = "complex"
      const fileMatches = content.match(/\[4\.\d+\](.*?)\n([\s\S]*?)(?=\[4\.\d+\]|$)/g)
      if (fileMatches) {
        fileMatches.forEach((match) => {
          const [, filename, fileContent] = match.match(/\[4\.\d+\](.*?)\n([\s\S]*)/) || []
          if (filename && fileContent) {
            complexFiles[filename.trim()] = fileContent.trim()
          }
        })
      }
      parsedContent = "Complex plugin with multiple files generated!"
    }

    // Parse [5] - New chat suggestion
    if (content.startsWith("[5]")) {
      messageType = "new-chat-suggestion"
      parsedContent = content.replace(/^\[5\]\s*/, "")
    }

    // Parse [6] - Usage instructions
    const usageMatch = content.match(/\[6\](.*?)(?=\[|$)/s)
    if (usageMatch) {
      usageInstructions = usageMatch[1].trim()
    }

    return {
      id: messageId,
      role: "ai",
      content: parsedContent,
      type: messageType,
      code,
      pluginName,
      usageInstructions,
      missingDetails,
      complexFiles,
      timestamp: new Date(),
    }
  }

  const handleSendMessage = async (isFollowUp = false, originalMessage = inputValue) => {
    if (!originalMessage.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: originalMessage,
      type: "normal",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsGenerating(true)

    const isPluginRequest =
      originalMessage.toLowerCase().includes("plugin") ||
      originalMessage.toLowerCase().includes("bot") ||
      originalMessage.toLowerCase().includes("command") ||
      originalMessage.toLowerCase().includes("create") ||
      originalMessage.toLowerCase().includes("make")

    if (isPluginRequest && !isFollowUp) {
      setGeneratingPluginData({
        name: "New Plugin",
        description: originalMessage,
        startTime: Date.now(),
      })
      setGenerationTimer(0)
      setShowPipeline(true)
      setGenerationSteps(pipelineSteps.map((step) => ({ ...step, status: "pending" })))
      setCurrentStep(0)

      try {
        // Execute 5-step generation process
        for (let step = 1; step <= 5; step++) {
          setGenerationSteps((prev) =>
            prev.map((s, idx) => ({
              ...s,
              status: idx === step - 1 ? "active" : idx < step - 1 ? "completed" : "pending",
            })),
          )
          setCurrentStep(step - 1)

          const response = await fetch("/api/ai/generate-plugin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: originalMessage,
              followUp: isFollowUp,
              lastCode: null,
              step: step,
            }),
          })

          if (!response.ok) throw new Error("Failed to generate response")

          const data = await response.json()

          // Only add the final step response as a message with code
          if (step === 5 && data.response.includes("[2]")) {
            const aiMessage = parseAIResponse(data.response)
            setMessages((prev) => [...prev, aiMessage])

            setGeneratingPluginData((prev) =>
              prev
                ? {
                    ...prev,
                    finalCode: aiMessage.code,
                    finalPluginName: aiMessage.pluginName,
                  }
                : null,
            )
          }

          // Wait for step timing
          const stepTimings = [1200, 2000, 1800, 1500, 1000]
          await new Promise((resolve) => setTimeout(resolve, stepTimings[step - 1]))

          setGenerationSteps((prev) =>
            prev.map((s, idx) => ({
              ...s,
              status: idx < step ? "completed" : "pending",
            })),
          )
        }
      } catch (error) {
        console.error("Error:", error)
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}_error`,
          role: "ai",
          content: "Sorry, I encountered an error during generation. Please try again.",
          type: "question",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsGenerating(false)
        setTimeout(() => {
          setShowPipeline(false)
          setGeneratingPluginData(null)
          setGenerationTimer(0)
        }, 1000)
      }
    } else {
      // Handle non-plugin requests normally
      try {
        const lastPluginMessage = messages.findLast((m) => m.type === "plugin" || m.type === "complex")

        const response = await fetch("/api/ai/generate-plugin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: originalMessage,
            followUp: isFollowUp,
            lastCode: lastPluginMessage?.code || Object.values(lastPluginMessage?.complexFiles || {})[0],
          }),
        })

        if (!response.ok) throw new Error("Failed to generate response")

        const data = await response.json()
        const aiMessage = parseAIResponse(data.response)

        setMessages((prev) => [...prev, aiMessage])

        if (aiMessage.type === "detail-request" && aiMessage.missingDetails) {
          setShowDetailInputs(aiMessage.id)
          const initialInputs: { [key: string]: string } = {}
          aiMessage.missingDetails.forEach((detail) => {
            initialInputs[detail] = ""
          })
          setDetailInputs(initialInputs)
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
  }

  const handleSubmitDetails = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message || !message.missingDetails) return

    const detailsText = message.missingDetails
      .map((detail) => `${detail}: ${detailInputs[detail] || "Not provided"}`)
      .join(", ")

    const originalRequest = messages[messages.length - 2]?.content || ""
    const fullRequest = `I requested this feature before: ${originalRequest}, but missed these details: ${detailsText}`

    setShowDetailInputs(null)
    setDetailInputs({})
    handleSendMessage(false, fullRequest)
  }

  const handleDeployPlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code && !message?.complexFiles) return

    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: message.pluginName || "Untitled Plugin",
          description: message.content,
          code: message.code || JSON.stringify(message.complexFiles),
          isComplex: !!message.complexFiles,
        }),
      })

      if (response.ok) {
        setDeployedPlugins((prev) => new Set([...prev, messageId]))
        setTimeout(() => {
          setDeployedPlugins((prev) => {
            const newSet = new Set(prev)
            newSet.delete(messageId)
            return newSet
          })
        }, 1000)
      }
    } catch (error) {
      console.error("Error deploying plugin:", error)
    }
  }

  const handleBack = () => {
    if (messages.some((m) => m.type === "plugin" || m.type === "complex")) {
      setShowSavePrompt(true)
    } else {
      onClose()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setExpandedCode(null)
    setEditingPlugin(null)
    setDeployedPlugins(new Set())
    setShowDetailInputs(null)
    setDetailInputs({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-gradient-to-br from-[#0a0a0a]/95 via-[#101010]/95 to-[#0f0f0f]/95 backdrop-blur-xl text-white flex flex-col border border-white/5">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#101010]/90 via-[#0f0f0f]/90 to-[#101010]/90 backdrop-blur-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:border-white/20"
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
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:border-white/20"
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
              <div key={message.id}>
                {message.usageInstructions && (
                  <div className="mb-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-300">{message.usageInstructions}</p>
                  </div>
                )}

                <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "user" ? (
                    <div className="max-w-[80%] bg-white/90 backdrop-blur-sm text-gray-900 rounded-2xl px-4 py-3 shadow-lg">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  ) : message.type === "question" ? (
                    <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  ) : message.type === "detail-request" ? (
                    <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-4 shadow-lg">
                      <p className="text-sm mb-4">{message.content}</p>
                      {showDetailInputs === message.id && message.missingDetails && (
                        <div className="space-y-3">
                          {message.missingDetails.map((detail, idx) => (
                            <div key={idx}>
                              <label className="text-xs text-gray-400 mb-1 block">{detail}</label>
                              <Input
                                value={detailInputs[detail] || ""}
                                onChange={(e) => setDetailInputs((prev) => ({ ...prev, [detail]: e.target.value }))}
                                placeholder={`Enter ${detail}`}
                                className="bg-black/40 border-white/20 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent min-h-[44px] max-h-32"
                              />
                            </div>
                          ))}
                          <Button
                            onClick={() => handleSubmitDetails(message.id)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            Submit Details
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : message.type === "new-chat-suggestion" ? (
                    <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-4 shadow-lg">
                      <p className="text-sm mb-3">{message.content}</p>
                      <Button onClick={handleNewChat} className="bg-purple-500 hover:bg-purple-600 text-white">
                        Start New Chat
                      </Button>
                    </div>
                  ) : (
                    <div className="max-w-[90%] bg-gradient-to-br from-black/60 via-gray-900/40 to-black/60 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-xs font-mono text-white">PY</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{message.pluginName || "Generated Plugin"}</h3>
                            <p className="text-xs text-gray-400">{message.content}</p>
                            {message.type === "complex" && (
                              <div className="flex items-center mt-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-xs text-red-400">Complex Task</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {(message.code || message.complexFiles) && (
                          <div className="mb-4 border border-white/10 rounded-xl bg-black/40 backdrop-blur-sm overflow-hidden">
                            {message.complexFiles ? (
                              <div>
                                <div className="flex border-b border-white/10">
                                  {Object.keys(message.complexFiles).map((filename) => (
                                    <button
                                      key={filename}
                                      onClick={() => setActiveTab((prev) => ({ ...prev, [message.id]: filename }))}
                                      className={`px-4 py-2 text-sm border-r border-white/10 transition-colors ${
                                        (activeTab[message.id] || Object.keys(message.complexFiles!)[0]) === filename
                                          ? "bg-white/10 text-white"
                                          : "text-gray-400 hover:text-white"
                                      }`}
                                    >
                                      {filename}
                                    </button>
                                  ))}
                                </div>
                                <div className="p-4 max-h-64 overflow-y-auto">
                                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                                    {
                                      message.complexFiles[
                                        activeTab[message.id] || Object.keys(message.complexFiles)[0]
                                      ]
                                    }
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 max-h-64 overflow-y-auto">
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                                  {message.code}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          {!deployedPlugins.has(message.id) ? (
                            <Button
                              size="sm"
                              onClick={() => handleDeployPlugin(message.id)}
                              className="flex-1 bg-gradient-to-r from-white to-gray-100 text-black hover:from-gray-100 hover:to-white h-10 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Deploy Plugin
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingPlugin(editingPlugin === message.id ? null : message.id)}
                                className="text-white hover:bg-white/10 bg-white/5 h-10 px-4"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <div className="flex-1 flex items-center justify-center bg-green-500/10 border border-green-500/20 rounded-lg h-10">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                <span className="text-sm text-green-400 font-medium">Deployed</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isGenerating && !showPipeline && (
            <div className="flex justify-start">
              <div className="bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating response...</span>
                </div>
              </div>
            </div>
          )}

          {showPipeline && generatingPluginData && (
            <div className="flex justify-start">
              <div className="max-w-[90%] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header with status and timer */}
                <div className="px-6 py-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 relative">
                        <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
                        <span className="absolute -bottom-1 -right-1 text-[8px] text-gray-400 font-mono">s1-small</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {generationSteps[currentStep]?.label || "Generating Plugin"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 font-mono bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                      {Math.floor(generationTimer / 60000)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {Math.floor((generationTimer % 60000) / 1000)
                        .toString()
                        .padStart(2, "0")}
                    </div>
                  </div>
                </div>

                {/* Status bar with white-grey gradient */}
                <div className="px-6 py-4">
                  <div className="bg-gray-700/60 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="h-2 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-gray-400 to-white shadow-sm"
                      style={{ width: `${Math.min(((currentStep + 1) / generationSteps.length) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-400 text-center">
                    Step {currentStep + 1} of {generationSteps.length} •{" "}
                    {Math.round(((currentStep + 1) / generationSteps.length) * 100)}% Complete
                  </div>
                </div>

                {/* Pipeline steps with grey flat icons in connected dots */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between relative">
                    {/* Connection line */}
                    <div className="absolute top-4 left-4 right-4 h-px bg-gray-600/40"></div>

                    {generationSteps.map((step, idx) => (
                      <div key={step.id} className="flex flex-col items-center space-y-2 relative z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 border-2 ${
                            step.status === "completed"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : step.status === "active"
                                ? "bg-gray-700 border-gray-600 text-white animate-pulse"
                                : "bg-gray-800 border-gray-700 text-gray-500"
                          }`}
                        >
                          {step.icon}
                        </div>
                        <span
                          className={`text-[10px] text-center max-w-12 leading-tight transition-colors duration-300 ${
                            step.status === "active"
                              ? "text-gray-300 font-medium"
                              : step.status === "completed"
                                ? "text-gray-400"
                                : "text-gray-600"
                          }`}
                        >
                          {step.label.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {generatingPluginData.finalCode && (
                  <div className="px-6 py-4 border-t border-white/10">
                    <div className="mb-3">
                      <h3 className="font-medium text-white text-sm">
                        {generatingPluginData.finalPluginName || "Generated Plugin"}
                      </h3>
                      <p className="text-xs text-gray-400">Plugin generated successfully</p>
                    </div>

                    <div className="border border-white/10 rounded-xl bg-black/40 backdrop-blur-sm overflow-hidden">
                      <div className="p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                          {generatingPluginData.finalCode}
                        </pre>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Deploy the plugin from pipeline card
                          if (generatingPluginData.finalCode) {
                            const tempMessage = {
                              id: `pipeline_${Date.now()}`,
                              code: generatingPluginData.finalCode,
                              pluginName: generatingPluginData.finalPluginName,
                              content: generatingPluginData.description,
                            }
                            handleDeployPlugin(tempMessage.id)
                          }
                        }}
                        className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 h-10 font-medium transition-all duration-200"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Deploy Plugin
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
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

        <div className="border-t border-white/10 p-4 bg-gradient-to-r from-[#101010]/90 via-[#0f0f0f]/90 to-[#101010]/90 backdrop-blur-md">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    const hasExistingPlugins = messages.some((m) => m.type === "plugin" || m.type === "complex")
                    handleSendMessage(hasExistingPlugins)
                  }
                }}
                placeholder={
                  messages.some((m) => m.type === "plugin" || m.type === "complex")
                    ? "Continue working on your plugin..."
                    : "Ask about Discord bots or request a plugin..."
                }
                disabled={isGenerating}
                className="w-full bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 min-h-[44px] max-h-32 transition-all duration-200"
                rows={1}
                style={{
                  height: "auto",
                  minHeight: "44px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = Math.min(target.scrollHeight, 128) + "px"
                }}
              />
            </div>
            <Button
              onClick={() => {
                const hasExistingPlugins = messages.some((m) => m.type === "plugin" || m.type === "complex")
                handleSendMessage(hasExistingPlugins)
              }}
              disabled={!inputValue.trim() || isGenerating}
              className="h-11 w-11 p-0 bg-gradient-to-r from-white to-gray-100 text-black hover:from-gray-100 hover:to-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
