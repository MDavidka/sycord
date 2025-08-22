"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Send, Save } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [isDeployed, setIsDeployed] = useState(false)
  const [usageInstructions, setUsageInstructions] = useState("")
  const [requestedDetails, setRequestedDetails] = useState<string[]>([])
  const [detailAnswers, setDetailAnswers] = useState<Record<string, string>>({})
  const [originalPrompt, setOriginalPrompt] = useState("")
  const [multiFileData, setMultiFileData] = useState<{ filename: string; code: string }[] | null>(null)

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
    let timerInterval: NodeJS.Timeout
    if (pipeline.isActive) {
      timerInterval = setInterval(() => {
        setElapsedTime(Date.now() - pipeline.startTime)
      }, 100)
    }
    return () => clearInterval(timerInterval)
  }, [pipeline.isActive, pipeline.startTime])

  // Effect to simulate pipeline progress on the frontend
  useEffect(() => {
    let stepInterval: NodeJS.Timeout
    if (pipeline.isActive && pipeline.currentStep < 4) {
      stepInterval = setInterval(() => {
        setPipeline(prev => {
          if (prev.currentStep < 4) {
            const nextStep = prev.currentStep + 1
            return {
              ...prev,
              currentStep: nextStep,
              steps: prev.steps.map(s =>
                s.id === nextStep ? { ...s, status: "active" } : s.id < nextStep ? { ...s, status: "completed" } : s,
              ),
            }
          }
          return prev
        })
      }, 1500) // Simulate each step taking 1.5 seconds
    }
    return () => clearInterval(stepInterval)
  }, [pipeline.isActive, pipeline.currentStep])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const [activeFunction, setActiveFunction] = useState<UserAIFunction | null>(null)

  useEffect(() => {
    if (currentAIFunction) {
      const currentSession = currentAIFunction.chatSessions?.find(
        (s) => s.id === currentAIFunction.currentChatId,
      )
      // @ts-ignore
      setMessages(currentSession?.messages || [])
      setActiveFunction(currentAIFunction)
    }
  }, [currentAIFunction])

  const handleApiResponse = (aiResponseContent: string) => {
    // --- Mark Parsing ---
    const usageMatch = aiResponseContent.match(/\[6\]([\s\S]*?)\[6\]/s)
    const pluginNameMatch = aiResponseContent.match(/\[1\.1\](.*?)\[1\.1\]/s)
    const detailMatch = aiResponseContent.matchAll(/\[3\](.*?)\[3\]/g)
    const multiFileMatch = aiResponseContent.matchAll(/\[4\.\d+\]\s*(.*?)\s*\n([\s\S]*?)(?=\[4\.\d+\]|$)/g)

    const files = Array.from(multiFileMatch, m => ({ filename: m[1].trim(), code: m[2].trim() }))

    if (files.length > 0) {
      setMultiFileData(files)
      setPipeline(prev => ({ ...prev, pluginCode: "" }))
    } else {
      const codeMatch = aiResponseContent.match(/\[2\]([\s\S]*?)\[2\]/s)
      setMultiFileData(null)
      setPipeline(prev => ({ ...prev, pluginCode: codeMatch ? codeMatch[1].trim() : "" }))
    }

    const detailsToRequest = Array.from(detailMatch, m => m[1])
    if (detailsToRequest.length > 0) {
      setRequestedDetails(detailsToRequest)
      setDetailAnswers(detailsToRequest.reduce((acc, detail) => ({ ...acc, [detail]: "" }), {}))
    } else {
      // Only add non-detail-requesting messages to chat
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: aiResponseContent,
        type: "plugin",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    }

    setUsageInstructions(usageMatch ? usageMatch[1].trim() : "")

    setPipeline((prev) => ({
      ...prev,
      isActive: false,
      currentStep: detailsToRequest.length > 0 ? 1 : 5,
      pluginName: pluginNameMatch ? pluginNameMatch[1].trim() : prev.pluginName,
      steps: prev.steps.map(s => ({ ...s, status: detailsToRequest.length > 0 ? 'pending' : 'completed' })),
    }))
  }

  const handleSubmitDetails = async () => {
    setIsGenerating(true)
    setRequestedDetails([])
    setPipeline(prev => ({ ...prev, isActive: true, currentStep: 1, startTime: Date.now() }))

    try {
      const apiBody: any = { message: originalPrompt, details: detailAnswers }
      if (activeFunction) {
        apiBody.functionId = activeFunction._id
        apiBody.chatSessionId = activeFunction.currentChatId
      }
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      })
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      handleApiResponse(data.response || "")
    } catch (error) {
      // ... error handling
    } finally {
      setIsGenerating(false)
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
    if (!activeFunction) { // This is the start of a new plugin conversation
      setOriginalPrompt(inputValue)
    }
    setInputValue("")
    setIsGenerating(true)

    setPipeline((prev) => ({
      ...prev,
      isActive: true,
      currentStep: 1,
      startTime: Date.now(),
      steps: prev.steps.map(s => ({ ...s, status: 'pending' })),
    }))

    try {
      const apiBody: any = { message: inputValue }
      if (activeFunction) {
        apiBody.functionId = activeFunction._id
        apiBody.chatSessionId = activeFunction.currentChatId
      }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      handleApiResponse(data.response || "")

    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: "ai",
        content: "Sorry, I encountered an error. Please try again.",
        type: "question",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setPipeline(prev => ({ ...prev, isActive: false }))
    }

    setIsGenerating(false)
  }

  const handleSavePlugin = async () => {
    const codeToSave = multiFileData ? multiFileData[0].code : pipeline.pluginCode
    if (!codeToSave || !pipeline.pluginName) return

    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pipeline.pluginName,
          description: pluginMetadata.description || "AI Generated Discord Bot Plugin",
          code: codeToSave,
          usageInstructions: usageInstructions,
          thumbnailUrl: pluginMetadata.thumbnailUrl,
          profileUrl: pluginMetadata.profileUrl,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setActiveFunction(data.function)
        setIsDeployed(true)
        setPluginMetadata({ name: "", description: "", thumbnailUrl: "", profileUrl: "" })
      } else {
        throw new Error("Failed to save plugin")
      }
    } catch (error) {
      console.error("Error saving plugin:", error)
      // TODO: Show an error toast to the user
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
                    <div className="max-w-[80%] bg-blue-500 text-white rounded-2xl px-4 py-2.5 shadow-md">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  ) : (
                    <div
                      className="max-w-[80%] bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl px-4 py-2.5 shadow-lg"
                      style={{
                        background: "rgba(0, 0, 0, 0.18)",
                        backdropFilter: "blur(14px) saturate(120%)",
                      }}
                    >
                      <p className="text-sm leading-relaxed text-gray-200">{message.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {usageInstructions && (
                <div className="max-w-[90%] mx-auto my-2 p-4 bg-blue-900/20 border border-blue-500/30 rounded-2xl text-sm text-gray-300">
                  <h4 className="font-semibold text-white mb-2">Usage Instructions</h4>
                  <p className="whitespace-pre-wrap">{usageInstructions}</p>
                </div>
              )}

              {(pipeline.isActive || pipeline.pluginCode || multiFileData) && (
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
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                                step.status === "completed"
                                  ? "bg-white/20 text-white"
                                  : step.status === "active"
                                    ? "bg-white/30 text-white animate-pulse"
                                    : "bg-gray-600/50 text-gray-400"
                              }`}
                            >
                              {step.icon}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Plugin content when completed */}
                    {(pipeline.pluginCode || multiFileData) && (
                      <div className="border-t border-white/10 p-4">
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
                              className="bg-white text-black hover:bg-gray-200 h-8 px-3 disabled:bg-green-500 disabled:text-white"
                              disabled={isDeployed}
                            >
                              {isDeployed ? "✓ Deployed" : <><Save className="h-4 w-4 mr-1" /> Deploy</>}
                            </Button>
                          </div>
                        </div>

                        {multiFileData ? (
                          <Tabs defaultValue={multiFileData[0].filename}>
                            <TabsList>
                              {multiFileData.map(file => (
                                <TabsTrigger key={file.filename} value={file.filename}>{file.filename}</TabsTrigger>
                              ))}
                            </TabsList>
                            {multiFileData.map(file => (
                              <TabsContent key={file.filename} value={file.filename}>
                                <div className="bg-black/40 rounded-lg p-4 max-h-64 overflow-y-auto">
                                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{file.code}</pre>
                                </div>
                              </TabsContent>
                            ))}
                          </Tabs>
                        ) : (
                          <div className="bg-black/40 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{pipeline.pluginCode}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />

          {/* Details Request Form */}
          {requestedDetails.length > 0 && (
            <div className="max-w-[90%] mx-auto my-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-lg font-semibold mb-3 text-white">Details Required</h3>
              <div className="space-y-4">
                {requestedDetails.map(detail => (
                  <div key={detail}>
                    <label className="text-sm font-medium text-gray-300 capitalize">
                      {detail.replace(/-/g, " ")}
                    </label>
                    <input
                      type="text"
                      value={detailAnswers[detail] || ""}
                      onChange={e =>
                        setDetailAnswers(prev => ({ ...prev, [detail]: e.target.value }))
                      }
                      className="mt-1 w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                      style={{
                        background: "rgba(0, 0, 0, 0.18)",
                        backdropFilter: "blur(14px) saturate(120%)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleSubmitDetails}
                disabled={isGenerating}
                className="mt-4 w-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
              >
                Submit Details
              </Button>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4 bg-black/10 backdrop-blur-sm">
          <div className="flex items-end space-x-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question or request a plugin..."
              className="flex-1 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl px-4 py-2 text-white placeholder-gray-400 resize-none min-h-[44px] max-h-32 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              style={{
                background: "rgba(0, 0, 0, 0.18)",
                backdropFilter: "blur(14px) saturate(120%)",
              }}
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
