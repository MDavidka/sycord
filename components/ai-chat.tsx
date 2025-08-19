"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MessageSquare, Send, Eye, Edit3, Loader2, Play, CheckCircle } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal" | "missing_details" | "complex_task" | "new_chat_suggestion"
  code?: string
  files?: Array<{ filename: string; code: string }>
  pluginName?: string
  usage?: string
  details?: string[]
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
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [deployedPlugins, setDeployedPlugins] = useState<Set<string>>(new Set())
  const [detailInputs, setDetailInputs] = useState<{ [messageId: string]: { [detail: string]: string } }>({})
  const [activeFileTab, setActiveFileTab] = useState<{ [messageId: string]: number }>({})
  const [editingPlugin, setEditingPlugin] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    const currentInput = inputValue
    setInputValue("")
    setIsGenerating(true)

    try {
      const isFollowUp = messages.length > 0 && messages.some((m) => m.type === "plugin" || m.type === "complex_task")
      const lastPluginMessage = messages.findLast((m) => m.type === "plugin" || m.type === "complex_task")

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          followUp: isFollowUp,
          currentCode: lastPluginMessage?.code || lastPluginMessage?.files,
          serverId,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: data.content || "",
        type: data.type || "normal",
        code: data.code,
        files: data.files,
        pluginName: data.pluginName,
        usage: data.usage,
        details: data.details,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      if (data.type === "missing_details" && data.details) {
        const inputs: { [detail: string]: string } = {}
        data.details.forEach((detail: string) => {
          inputs[detail] = ""
        })
        setDetailInputs((prev) => ({
          ...prev,
          [aiMessage.id]: inputs,
        }))
      }

      if (data.type === "complex_task" && data.files?.length > 0) {
        setActiveFileTab((prev) => ({
          ...prev,
          [aiMessage.id]: 0,
        }))
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

  const handleDetailSubmission = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message || !message.details) return

    const inputs = detailInputs[messageId] || {}
    const filledDetails = message.details.map((detail) => `${detail}: ${inputs[detail] || "not provided"}`).join(", ")

    const originalUserMessage = messages[messages.findIndex((m) => m.id === messageId) - 1]
    if (!originalUserMessage) return

    const enhancedMessage = `I requested this feature before: "${originalUserMessage.content}", but missed these details: ${filledDetails}`

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user_enhanced`,
      role: "user",
      content: originalUserMessage.content,
      type: "normal",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: enhancedMessage,
          followUp: true,
          serverId,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate response")
      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai_enhanced`,
        role: "ai",
        content: data.content || "",
        type: data.type || "normal",
        code: data.code,
        files: data.files,
        pluginName: data.pluginName,
        usage: data.usage,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeployPlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    try {
      const response = await fetch("/api/user-ai-functions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: message.pluginName || "Untitled Plugin",
          description: "AI Generated Plugin",
          code: message.code,
          files: message.files,
          serverId,
          pluginType: message.type === "complex_task" ? "complex" : "single",
        }),
      })

      if (response.ok) {
        setDeployedPlugins((prev) => new Set([...prev, messageId]))
        setTimeout(() => {}, 1000)
      }
    } catch (error) {
      console.error("Error deploying plugin:", error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-[#101010]/95 backdrop-blur-xl text-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (messages.some((m) => m.type === "plugin")) {
                setShowSavePrompt(true)
              } else {
                onClose()
              }
            }}
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
            onClick={() => {
              setMessages([])
              setExpandedCode(null)
              setEditingPlugin(null)
            }}
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
                ) : message.type === "question" || message.type === "new_chat_suggestion" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.type === "new_chat_suggestion" && (
                      <Button
                        onClick={() => {
                          setMessages([])
                          setExpandedCode(null)
                        }}
                        className="mt-3 bg-white text-black hover:bg-gray-200 text-xs px-3 py-1 h-7"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        New Chat
                      </Button>
                    )}
                  </div>
                ) : message.type === "missing_details" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-4">Please provide the following details:</p>
                    <div className="space-y-3">
                      {message.details?.map((detail, index) => (
                        <div key={index}>
                          <label className="text-xs text-gray-400 mb-1 block">{detail}</label>
                          <Input
                            placeholder={`Enter ${detail}`}
                            value={detailInputs[message.id]?.[detail] || ""}
                            onChange={(e) =>
                              setDetailInputs((prev) => ({
                                ...prev,
                                [message.id]: {
                                  ...prev[message.id],
                                  [detail]: e.target.value,
                                },
                              }))
                            }
                            className="bg-black/40 border-white/20 text-white text-sm h-8"
                          />
                        </div>
                      ))}
                      <Button
                        onClick={() => handleDetailSubmission(message.id)}
                        className="bg-white text-black hover:bg-gray-200 text-sm px-4 py-2 h-8 mt-2"
                      >
                        Submit Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    {message.usage && (
                      <div className="p-3 bg-blue-500/10 border-b border-white/10">
                        <p className="text-xs text-blue-300">{message.usage}</p>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-mono">PY</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{message.pluginName || "Unknown Plugin"}</h3>
                          <p className="text-xs text-gray-400">AI Generated Discord Bot Plugin</p>
                        </div>
                        {message.type === "complex_task" && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-red-400">Complex Task</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm mb-4">Plugin generated successfully!</p>

                      <div className="flex items-center space-x-2">
                        {!deployedPlugins.has(message.id) ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedCode(expandedCode === message.id ? null : message.id)}
                              className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeployPlugin(message.id)}
                              className="bg-white text-black hover:bg-gray-200 text-sm px-6 py-2 h-8 flex-1"
                            >
                              <Play className="h-3 w-3 mr-2" />
                              Deploy
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedCode(expandedCode === message.id ? null : message.id)}
                              className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center text-green-400 text-sm">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Deployed
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {expandedCode === message.id && (
                      <div className="border-t border-white/10 bg-black/40">
                        {message.type === "complex_task" && message.files ? (
                          <div>
                            <div className="flex border-b border-white/10">
                              {message.files.map((file, index) => (
                                <button
                                  key={index}
                                  onClick={() =>
                                    setActiveFileTab((prev) => ({
                                      ...prev,
                                      [message.id]: index,
                                    }))
                                  }
                                  className={`px-4 py-2 text-xs border-r border-white/10 ${
                                    activeFileTab[message.id] === index
                                      ? "bg-white/10 text-white"
                                      : "text-gray-400 hover:text-white"
                                  }`}
                                >
                                  {file.filename}
                                </button>
                              ))}
                            </div>
                            <div className="p-4">
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                {message.files[activeFileTab[message.id] || 0]?.code}
                              </pre>
                            </div>
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
