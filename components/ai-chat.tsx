"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Send, Eye, Edit3, Loader2, CheckCircle, Plus } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal" | "details" | "complex" | "suggestion" | "usage"
  code?: string
  pluginName?: string
  files?: { [key: string]: string }
  timestamp: Date
  isDeployed?: boolean
}

interface DetailRequest {
  messageId: string
  details: string[]
  responses: { [key: string]: string }
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
  const [detailRequests, setDetailRequests] = useState<DetailRequest[]>([])
  const [activeFileTab, setActiveFileTab] = useState<{ [messageId: string]: string }>({})
  const [lastUserMessage, setLastUserMessage] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const parseAIResponse = (content: string) => {
    const firstThreeChars = content.substring(0, 3)

    // Check for detail requests [3]
    if (firstThreeChars === "[3]") {
      const details = content.match(/\[3\]([^[]+)/g)?.map((match) => match.replace("[3]", "").trim()) || []
      return { type: "details", details, content: content.replace(/\[3\][^[]+/g, "").trim() }
    }

    // Check for complex tasks [4]
    if (firstThreeChars === "[4]") {
      const files: { [key: string]: string } = {}
      const fileMatches = content.match(/\[4\.\d+\]\s*([^\n]+)\n([\s\S]*?)(?=\[4\.\d+\]|$)/g)

      if (fileMatches) {
        fileMatches.forEach((match) => {
          const [, filename, code] = match.match(/\[4\.\d+\]\s*([^\n]+)\n([\s\S]*)/) || []
          if (filename && code) {
            files[filename.trim()] = code.trim()
          }
        })
      }

      return { type: "complex", files, content: "Complex plugin generated with multiple files" }
    }

    // Check for suggestions [5]
    if (firstThreeChars === "[5]") {
      return { type: "suggestion", content: content.replace("[5]", "").trim() }
    }

    // Check for usage instructions [6]
    if (firstThreeChars === "[6]") {
      return { type: "usage", content: content.replace("[6]", "").trim() }
    }

    // Extract plugin name [1.1]
    const pluginNameMatch = content.match(/\[1\.1\]([^[]+)/)
    const pluginName = pluginNameMatch ? pluginNameMatch[1].trim() : null

    // Check for questions [1]
    if (content.startsWith("[1]")) {
      return { type: "question", content: content.replace("[1]", "").trim(), pluginName }
    }

    // Check for plugin code [2]
    if (content.startsWith("[2]") || content.includes("import discord")) {
      return { type: "plugin", content: content.replace("[2]", "").trim(), pluginName }
    }

    return { type: "normal", content, pluginName }
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
    setLastUserMessage(inputValue)
    setInputValue("")
    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputValue,
          context: messages.length > 0 ? messages[messages.length - 1] : null,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()
      const content = data.code || data.response || ""
      const parsed = parseAIResponse(content)

      if (parsed.type === "details") {
        const detailRequest: DetailRequest = {
          messageId: `msg_${Date.now()}_ai`,
          details: parsed.details,
          responses: {},
        }
        setDetailRequests((prev) => [...prev, detailRequest])

        const aiMessage: ChatMessage = {
          id: detailRequest.messageId,
          role: "ai",
          content: "Please provide the following details:",
          type: "details",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          role: "ai",
          content: parsed.type === "plugin" ? "Plugin generated successfully!" : parsed.content,
          type: parsed.type as any,
          code: parsed.type === "plugin" ? content : undefined,
          files: parsed.files,
          pluginName: parsed.pluginName,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, aiMessage])

        // Set first file as active tab for complex tasks
        if (parsed.files && Object.keys(parsed.files).length > 0) {
          setActiveFileTab((prev) => ({
            ...prev,
            [aiMessage.id]: Object.keys(parsed.files)[0],
          }))
        }
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

  const handleDetailSubmit = async (messageId: string) => {
    const detailRequest = detailRequests.find((dr) => dr.messageId === messageId)
    if (!detailRequest) return

    const detailsText = detailRequest.details
      .map((detail) => `${detail}: ${detailRequest.responses[detail] || "not provided"}`)
      .join(", ")

    const followUpMessage = `I requested this feature before: ${lastUserMessage}, but missed these details: ${detailsText}`

    setInputValue(followUpMessage)
    setDetailRequests((prev) => prev.filter((dr) => dr.messageId !== messageId))

    // Remove the detail request message
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }

  const handleDeployPlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code && !message?.files) return

    try {
      const pluginData = {
        name: message.pluginName || "Untitled Plugin",
        description: "AI Generated Discord Bot Plugin",
        code: message.code,
        files: message.files,
        serverId: serverId,
      }

      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pluginData),
      })

      if (response.ok) {
        // Show checkmark animation
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeployed: true } : m)))

        // Remove checkmark after 1 second
        setTimeout(() => {
          setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeployed: undefined } : m)))
        }, 1000)
      }
    } catch (error) {
      console.error("Error deploying plugin:", error)
    }
  }

  const handleBack = () => {
    if (messages.some((m) => m.type === "plugin" && !m.isDeployed)) {
      setShowSavePrompt(true)
    } else {
      onClose()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setExpandedCode(null)
    setEditingPlugin(null)
    setDetailRequests([])
    setActiveFileTab({})
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
                ) : message.type === "details" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-3">{message.content}</p>
                    {detailRequests
                      .find((dr) => dr.messageId === message.id)
                      ?.details.map((detail, index) => (
                        <div key={index} className="mb-3">
                          <label className="block text-xs text-gray-400 mb-1">{detail}</label>
                          <input
                            type="text"
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                            placeholder={`Enter ${detail}`}
                            onChange={(e) => {
                              const dr = detailRequests.find((dr) => dr.messageId === message.id)
                              if (dr) {
                                dr.responses[detail] = e.target.value
                                setDetailRequests([...detailRequests])
                              }
                            }}
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
                ) : message.type === "suggestion" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed mb-3">{message.content}</p>
                    <Button
                      onClick={handleNewChat}
                      className="bg-white text-black hover:bg-gray-200 text-sm px-3 py-1.5 rounded-lg flex items-center space-x-2"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New Chat</span>
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
                          <h3 className="font-medium">{message.pluginName || "Generated Plugin"}</h3>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-400">AI Generated Discord Bot Plugin</p>
                            {message.type === "complex" && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs text-red-400">Complex Task</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm mb-4">{message.content}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedCode(expandedCode === message.id ? null : message.id)}
                            className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {message.isDeployed !== undefined && (
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

                        {message.isDeployed === undefined ? (
                          <Button
                            onClick={() => handleDeployPlugin(message.id)}
                            className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-lg font-medium"
                          >
                            Deploy
                          </Button>
                        ) : message.isDeployed === true ? (
                          <div className="flex items-center space-x-2 text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm">Deployed</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {expandedCode === message.id && (message.code || message.files) && (
                      <div className="border-t border-white/10 bg-black/40">
                        {message.files ? (
                          <div>
                            <div className="flex border-b border-white/10">
                              {Object.keys(message.files).map((filename) => (
                                <button
                                  key={filename}
                                  onClick={() => setActiveFileTab((prev) => ({ ...prev, [message.id]: filename }))}
                                  className={`px-4 py-2 text-xs border-r border-white/10 ${
                                    activeFileTab[message.id] === filename
                                      ? "bg-white/10 text-white"
                                      : "text-gray-400 hover:text-white"
                                  }`}
                                >
                                  {filename}
                                </button>
                              ))}
                            </div>
                            <div className="p-4">
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                {message.files[activeFileTab[message.id] || Object.keys(message.files)[0]]}
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
                You have undeployed plugins. Do you want to deploy them before leaving?
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
                  Don't Deploy
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
