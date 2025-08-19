"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MessageSquare, Send, Eye, Edit3, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "complex" | "missing_details" | "out_of_scope"
  pluginName?: string
  code?: string
  complexFiles?: Array<{ index: string; filename: string; code: string }>
  usageInstructions?: string
  missingDetails?: string[]
  timestamp: Date
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
  serverId?: string
}

export default function AIChat({ isOpen, onClose, currentAIFunction, serverId }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [deployedPlugins, setDeployedPlugins] = useState<Set<string>>(new Set())
  const [showingSuccess, setShowingSuccess] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [lastCodeState, setLastCodeState] = useState<string>("")
  const [missingDetailsInputs, setMissingDetailsInputs] = useState<Record<string, string>>({})
  const [activeComplexTab, setActiveComplexTab] = useState<string>("0")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (isDetailResponse = false, details?: Record<string, string>) => {
    let messageContent = inputValue.trim()

    if (isDetailResponse && details) {
      const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || ""
      const detailsText = Object.entries(details)
        .map(([key, value]) => `${key}:${value}`)
        .join(", ")
      messageContent = `I requested this feature before ${lastUserMessage}, but missed this detail ${detailsText}`
    }

    if (!messageContent || isGenerating) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: messageContent,
      type: "question",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setMissingDetailsInputs({})
    setIsGenerating(true)

    const newHistory = [...conversationHistory, { role: "user", content: messageContent }]
    setConversationHistory(newHistory)

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: newHistory.slice(-10), // Keep last 10 messages for context
          lastCodeState,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: data.rawContent,
        type: data.type,
        pluginName: data.pluginName,
        code: data.code,
        complexFiles: data.complexFiles,
        usageInstructions: data.usageInstructions,
        missingDetails: data.missingDetails,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      setConversationHistory((prev) => [...prev, { role: "assistant", content: data.rawContent }])
      if (data.code) {
        setLastCodeState(data.code)
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

  const handleDeployPlugin = async (messageId: string, pluginName: string, code?: string, complexFiles?: any[]) => {
    try {
      const response = await fetch("/api/user-ai-functions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pluginName,
          code,
          complexFiles,
          serverId,
        }),
      })

      if (response.ok) {
        setDeployedPlugins((prev) => new Set([...prev, messageId]))
        setShowingSuccess(messageId)

        // Show green checkmark for 1 second
        setTimeout(() => {
          setShowingSuccess(null)
        }, 1000)
      }
    } catch (error) {
      console.error("Error deploying plugin:", error)
    }
  }

  const handleSubmitDetails = () => {
    handleSendMessage(true, missingDetailsInputs)
  }

  const handleNewChat = () => {
    setMessages([])
    setExpandedCode(null)
    setConversationHistory([])
    setLastCodeState("")
    setDeployedPlugins(new Set())
    setMissingDetailsInputs({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-[#101010]/95 backdrop-blur-xl text-white flex flex-col">
        {/* ... existing header code ... */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
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
              <p className="text-center opacity-75 max-w-md">Create Discord bot plugins with AI assistance</p>
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
                ) : message.type === "out_of_scope" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-orange-500/20 rounded-2xl px-4 py-3 shadow-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-400 text-sm font-medium">New Chat Suggested</span>
                    </div>
                    <p className="text-sm leading-relaxed">If you want a whole new function, start a new chat.</p>
                    <Button
                      onClick={handleNewChat}
                      className="mt-3 bg-orange-500 text-white hover:bg-orange-600 h-8 px-3 text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      New Chat
                    </Button>
                  </div>
                ) : message.type === "missing_details" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-400 text-sm font-medium">Missing Details</span>
                    </div>
                    <p className="text-sm mb-4">I need some additional information:</p>
                    <div className="space-y-3">
                      {message.missingDetails?.map((detail, index) => (
                        <div key={index}>
                          <label className="text-xs text-gray-400 mb-1 block">{detail}</label>
                          <Input
                            placeholder={`Enter ${detail}`}
                            value={missingDetailsInputs[detail] || ""}
                            onChange={(e) =>
                              setMissingDetailsInputs((prev) => ({
                                ...prev,
                                [detail]: e.target.value,
                              }))
                            }
                            className="bg-black/40 border-white/20 text-white text-sm h-8"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleSubmitDetails}
                      disabled={!message.missingDetails?.every((detail) => missingDetailsInputs[detail]?.trim())}
                      className="mt-3 bg-blue-500 text-white hover:bg-blue-600 h-8 px-3 text-xs"
                    >
                      Submit Details
                    </Button>
                  </div>
                ) : message.type === "complex" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center relative">
                          <span className="text-xs font-mono">PY</span>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{message.pluginName || "Complex Plugin"}</h3>
                          <p className="text-xs text-red-400">Complex Task • Multiple Files</p>
                        </div>
                      </div>

                      {message.usageInstructions && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-blue-300">{message.usageInstructions}</p>
                        </div>
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

                        {!deployedPlugins.has(message.id) ? (
                          showingSuccess === message.id ? (
                            <div className="flex items-center space-x-2 text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Deployed!</span>
                            </div>
                          ) : (
                            <Button
                              onClick={() =>
                                handleDeployPlugin(
                                  message.id,
                                  message.pluginName || "plugin",
                                  undefined,
                                  message.complexFiles,
                                )
                              }
                              className="bg-white text-black hover:bg-gray-200 h-8 px-4 text-sm font-medium"
                            >
                              Deploy
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {expandedCode === message.id && message.complexFiles && (
                      <div className="border-t border-white/10 bg-black/40">
                        <div className="flex border-b border-white/10">
                          {message.complexFiles.map((file, index) => (
                            <button
                              key={index}
                              onClick={() => setActiveComplexTab(index.toString())}
                              className={`px-4 py-2 text-sm border-r border-white/10 ${
                                activeComplexTab === index.toString()
                                  ? "bg-white/10 text-white"
                                  : "text-gray-400 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              {file.filename}
                            </button>
                          ))}
                        </div>
                        <div className="p-4">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                            {message.complexFiles[Number.parseInt(activeComplexTab)]?.code}
                          </pre>
                        </div>
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
                          <h3 className="font-medium">{message.pluginName || "Discord Plugin"}</h3>
                          <p className="text-xs text-gray-400">AI Generated Discord Bot Plugin</p>
                        </div>
                      </div>

                      {message.usageInstructions && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-blue-300">{message.usageInstructions}</p>
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

                        {!deployedPlugins.has(message.id) ? (
                          showingSuccess === message.id ? (
                            <div className="flex items-center space-x-2 text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Deployed!</span>
                            </div>
                          ) : (
                            <Button
                              onClick={() =>
                                handleDeployPlugin(message.id, message.pluginName || "plugin", message.code)
                              }
                              className="bg-white text-black hover:bg-gray-200 h-8 px-4 text-sm font-medium"
                            >
                              Deploy
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
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

        {/* ... existing input section ... */}
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
              onClick={() => handleSendMessage()}
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
