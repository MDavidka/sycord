"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Send, Eye, Edit3, Loader2, Play, Check } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal" | "detail-request" | "complex" | "new-chat-suggestion" | "usage"
  code?: string
  pluginName?: string
  files?: { name: string; code: string }[]
  detailRequests?: string[]
  timestamp: Date
  isDeployed?: boolean
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
  const [editingPlugin, setEditingPlugin] = useState<string | null>(null)
  const [pluginMetadata, setPluginMetadata] = useState({
    name: "",
    description: "",
    thumbnailUrl: "",
    profileUrl: "",
  })
  const [detailInputs, setDetailInputs] = useState<{ [key: string]: string }>({})
  const [activeTab, setActiveTab] = useState<{ [messageId: string]: number }>({})
  const [lastUserMessage, setLastUserMessage] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const parseAIResponse = (content: string) => {
    const markers = {
      question: content.match(/^\[1\]/),
      pluginName: content.match(/^\[1\.1\]([^[]+)\[1\.1\]/),
      plugin: content.match(/^\[2\]/),
      detailRequest: content.match(/^\[3\](.+)/),
      complex: content.match(/^\[4\]/),
      newChatSuggestion: content.match(/^\[5\]/),
      usage: content.match(/^\[6\]/),
    }

    let messageType: ChatMessage["type"] = "normal"
    let pluginName = ""
    let detailRequests: string[] = []
    let files: { name: string; code: string }[] = []

    if (markers.question) {
      messageType = "question"
      content = content.replace(/^\[1\]\s*/, "")
    } else if (markers.pluginName) {
      pluginName = markers.pluginName[1].trim()
      content = content.replace(/^\[1\.1\][^[]+\[1\.1\]\s*/, "")
    } else if (markers.plugin) {
      messageType = "plugin"
      content = content.replace(/^\[2\]\s*/, "")
    } else if (markers.detailRequest) {
      messageType = "detail-request"
      const detailMatch = content.match(/\[3\]([^[]+)/g)
      if (detailMatch) {
        detailRequests = detailMatch.map((match) => match.replace(/\[3\]/, "").trim())
      }
      content = ""
    } else if (markers.complex) {
      messageType = "complex"
      content = content.replace(/^\[4\]\s*/, "")

      // Parse multi-file structure [4.1], [4.2], etc.
      const fileMatches = content.match(/\[4\.\d+\]\s*([^\n]+)\n([\s\S]*?)(?=\[4\.\d+\]|$)/g)
      if (fileMatches) {
        files = fileMatches.map((match) => {
          const [, fileName, code] = match.match(/\[4\.\d+\]\s*([^\n]+)\n([\s\S]*)/) || []
          return { name: fileName?.trim() || "file.py", code: code?.trim() || "" }
        })
      }
    } else if (markers.newChatSuggestion) {
      messageType = "new-chat-suggestion"
      content = content.replace(/^\[5\]\s*/, "")
    } else if (markers.usage) {
      messageType = "usage"
      content = content.replace(/^\[6\]\s*/, "")
    }

    return { messageType, content, pluginName, detailRequests, files }
  }

  const handleSendMessage = async (isFollowUp = false, detailAnswers?: { [key: string]: string }) => {
    if (!inputValue.trim() || isGenerating) return

    let messageToSend = inputValue

    if (detailAnswers) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.type === "detail-request") {
        const detailString = Object.entries(detailAnswers)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
        messageToSend = `I requested this feature before: "${lastUserMessage}", but missed these details: ${detailString}`
      }
    } else if (isFollowUp && messages.some((m) => m.type === "plugin" && m.isDeployed)) {
      const lastDeployedPlugin = messages.filter((m) => m.type === "plugin" && m.isDeployed).pop()
      if (lastDeployedPlugin?.code) {
        messageToSend = `This is the current state of the code: ${lastDeployedPlugin.code}. Please make this change: ${inputValue}`
      }
    }

    if (!isFollowUp) {
      setLastUserMessage(inputValue)
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: inputValue,
      type: "normal",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setDetailInputs({})
    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          serverId,
          isFollowUp,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()
      const content = data.code || data.response || ""

      const { messageType, content: parsedContent, pluginName, detailRequests, files } = parseAIResponse(content)

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: parsedContent,
        type: messageType,
        code: messageType === "plugin" ? content : undefined,
        pluginName: pluginName || undefined,
        detailRequests: detailRequests.length > 0 ? detailRequests : undefined,
        files: files.length > 0 ? files : undefined,
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
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code && !message?.files) return

    try {
      const pluginData = {
        name: message.pluginName || "Untitled Plugin",
        description: "AI Generated Plugin",
        code: message.code,
        files: message.files,
        serverId,
        userId: "current-user", // This should come from session
      }

      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pluginData),
      })

      if (!response.ok) {
        throw new Error("Failed to save plugin")
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
    setDetailInputs({})
    setActiveTab({})
  }

  const handleDetailSubmit = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.detailRequests) return

    const answers = message.detailRequests.reduce(
      (acc, detail) => {
        acc[detail] = detailInputs[`${messageId}_${detail}`] || ""
        return acc
      },
      {} as { [key: string]: string },
    )

    handleSendMessage(false, answers)
  }

  const handleDeployPlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code && !message?.files) return

    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeployed: true } : m)))

    try {
      const pluginData = {
        name: message.pluginName || "Untitled Plugin",
        description: "AI Generated Plugin",
        code: message.code,
        files: message.files,
        serverId,
        userId: "current-user", // This should come from session
      }

      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pluginData),
      })

      if (!response.ok) {
        throw new Error("Failed to save plugin")
      }
    } catch (error) {
      console.error("Error saving plugin:", error)
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
                ) : message.type === "question" || message.type === "usage" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                ) : message.type === "detail-request" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-4">I need some additional details:</p>
                    <div className="space-y-3">
                      {message.detailRequests?.map((detail, index) => (
                        <div key={index}>
                          <label className="block text-xs text-gray-400 mb-1">{detail}</label>
                          <input
                            type="text"
                            value={detailInputs[`${message.id}_${detail}`] || ""}
                            onChange={(e) =>
                              setDetailInputs((prev) => ({
                                ...prev,
                                [`${message.id}_${detail}`]: e.target.value,
                              }))
                            }
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400"
                            placeholder={`Enter ${detail}`}
                          />
                        </div>
                      ))}
                      <Button
                        onClick={() => handleDetailSubmit(message.id)}
                        className="bg-white text-black hover:bg-gray-200 text-sm px-4 py-2"
                      >
                        Submit Details
                      </Button>
                    </div>
                  </div>
                ) : message.type === "new-chat-suggestion" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed mb-3">{message.content}</p>
                    <Button onClick={handleNewChat} size="sm" className="bg-white text-black hover:bg-gray-200">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                ) : (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-mono">PY</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{message.pluginName || "Generated Plugin"}</h3>
                          <p className="text-xs text-gray-400">AI Generated Discord Bot Plugin</p>
                        </div>
                        {message.type === "complex" && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-red-400">Complex Task</span>
                          </div>
                        )}
                      </div>

                      {message.content && <p className="text-sm mb-4">{message.content}</p>}

                      <div className="flex items-center space-x-2">
                        {!message.isDeployed ? (
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
                              className="flex-1 bg-white text-black hover:bg-gray-200 h-8"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Deploy
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2 text-green-400">
                              <Check className="h-4 w-4" />
                              <span className="text-xs">Deployed</span>
                            </div>
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
                              variant="ghost"
                              onClick={() => setEditingPlugin(editingPlugin === message.id ? null : message.id)}
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
                        {message.files && message.files.length > 1 ? (
                          <>
                            <div className="flex border-b border-white/10">
                              {message.files.map((file, index) => (
                                <button
                                  key={index}
                                  onClick={() => setActiveTab((prev) => ({ ...prev, [message.id]: index }))}
                                  className={`px-4 py-2 text-xs border-r border-white/10 ${
                                    (activeTab[message.id] || 0) === index
                                      ? "bg-white/10 text-white"
                                      : "text-gray-400 hover:text-white"
                                  }`}
                                >
                                  {file.name}
                                </button>
                              ))}
                            </div>
                            <div className="p-4">
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                {message.files[activeTab[message.id] || 0]?.code}
                              </pre>
                            </div>
                          </>
                        ) : (
                          <div className="p-4">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                              {message.code || message.files?.[0]?.code}
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
