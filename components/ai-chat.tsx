"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Send, Eye, Edit3, Loader2, CheckCircle, FileText } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import { useSession } from "next-auth/react"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type:
    | "question"
    | "plugin"
    | "normal"
    | "plugin-name"
    | "details-request"
    | "complex"
    | "new-chat-suggestion"
    | "usage"
  code?: string | { [key: string]: string } // Support for multi-file code
  pluginName?: string
  detailsRequested?: string[]
  isDeployed?: boolean
  timestamp: Date
}

interface DetailInput {
  name: string
  value: string
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
  serverId?: string
}

export default function AIChat({ isOpen, onClose, currentAIFunction, serverId }: AIChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [editingPlugin, setEditingPlugin] = useState<string | null>(null)
  const [detailInputs, setDetailInputs] = useState<DetailInput[]>([])
  const [activeFileTab, setActiveFileTab] = useState<string>("main")
  const [lastUserMessage, setLastUserMessage] = useState("")
  const [currentPluginCode, setCurrentPluginCode] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const parseAIResponse = (content: string) => {
    const markPattern = /^\[(\d+(?:\.\d+)?)\]/
    const match = content.match(markPattern)

    if (!match) return { type: "question", content, cleanContent: content }

    const mark = match[1]
    const cleanContent = content.replace(markPattern, "").trim()

    switch (mark) {
      case "1":
        return { type: "question", content: cleanContent, cleanContent }
      case "1.1":
        return { type: "plugin-name", content: cleanContent, cleanContent, pluginName: cleanContent.substring(0, 20) }
      case "2":
        return { type: "plugin", content: cleanContent, cleanContent }
      case "3":
        const details = cleanContent.split(/\[3\]/).filter((d) => d.trim())
        return { type: "details-request", content: cleanContent, cleanContent, detailsRequested: details }
      case "4":
        return { type: "complex", content: cleanContent, cleanContent }
      case "5":
        return { type: "new-chat-suggestion", content: cleanContent, cleanContent }
      case "6":
        return { type: "usage", content: cleanContent, cleanContent }
      default:
        if (mark.startsWith("4.")) {
          return { type: "complex-file", content: cleanContent, cleanContent, fileNumber: mark }
        }
        return { type: "question", content: cleanContent, cleanContent }
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
    setLastUserMessage(inputValue)
    setInputValue("")
    setIsGenerating(true)

    try {
      let requestMessage = inputValue

      // Handle detail inputs
      if (detailInputs.length > 0) {
        const detailsText = detailInputs.map((d) => `${d.name}: ${d.value}`).join(", ")
        requestMessage = `I requested this feature before: ${lastUserMessage}, but missed these details: ${detailsText}`
        setDetailInputs([])
      }

      // Handle follow-up with current code
      if (currentPluginCode) {
        requestMessage = `This is the current state of the code: <${currentPluginCode}>, please make this change: ${inputValue}`
      }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: requestMessage,
          serverId,
          hasExistingCode: !!currentPluginCode,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()
      const content = data.code || data.response || ""

      const parsed = parseAIResponse(content)

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: parsed.cleanContent,
        type: parsed.type as any,
        timestamp: new Date(),
      }

      // Handle different response types
      if (parsed.type === "plugin-name") {
        aiMessage.pluginName = parsed.pluginName
      } else if (parsed.type === "details-request") {
        aiMessage.detailsRequested = parsed.detailsRequested
        setDetailInputs(parsed.detailsRequested?.map((name) => ({ name, value: "" })) || [])
      } else if (parsed.type === "plugin" || parsed.type === "complex") {
        aiMessage.code = content
        setCurrentPluginCode(content)
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

  const handleDeployPlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.code) return

    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: message.pluginName || "Untitled Plugin",
          description: "AI Generated Plugin",
          code: typeof message.code === "string" ? message.code : JSON.stringify(message.code),
          serverId,
          path: `dash-bot/users/${session?.user?.id}/servers/${serverId}/saved-plugins`,
        }),
      })

      if (response.ok) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeployed: true } : m)))

        setTimeout(() => {
          setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeployed: false } : m)))
        }, 1000)
      }
    } catch (error) {
      console.error("Error deploying plugin:", error)
    }
  }

  const handleDetailSubmit = () => {
    if (detailInputs.some((d) => !d.value.trim())) return
    handleSendMessage()
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
    setDetailInputs([])
    setCurrentPluginCode(null)
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
                ) : message.type === "details-request" ? (
                  <div className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-4">I need some additional details:</p>
                    <div className="space-y-3">
                      {detailInputs.map((detail, index) => (
                        <div key={index}>
                          <label className="block text-xs text-gray-400 mb-1">{detail.name}</label>
                          <input
                            type="text"
                            value={detail.value}
                            onChange={(e) =>
                              setDetailInputs((prev) =>
                                prev.map((d, i) => (i === index ? { ...d, value: e.target.value } : d)),
                              )
                            }
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
                            placeholder={`Enter ${detail.name}`}
                          />
                        </div>
                      ))}
                      <Button
                        onClick={handleDetailSubmit}
                        disabled={detailInputs.some((d) => !d.value.trim())}
                        className="w-full bg-white text-black hover:bg-gray-200 mt-3"
                      >
                        Submit Details
                      </Button>
                    </div>
                  </div>
                ) : message.type === "new-chat-suggestion" ? (
                  <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-3">{message.content}</p>
                    <Button onClick={handleNewChat} className="bg-white text-black hover:bg-gray-200">
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
                          <h3 className="font-medium">{message.pluginName || "Generated Plugin"}</h3>
                          <p className="text-xs text-gray-400">AI Generated Discord Bot Plugin</p>
                        </div>
                        {message.type === "complex" && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-red-400">Complex Task</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm mb-4">{message.content}</p>

                      <div className="flex items-center space-x-2">
                        {!message.isDeployed && !messages.find((m) => m.id === message.id)?.isDeployed ? (
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
                              className="flex-1 bg-white text-black hover:bg-gray-200 h-10"
                            >
                              Deploy Plugin
                            </Button>
                          </>
                        ) : message.isDeployed ? (
                          <div className="flex items-center justify-center w-full">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          </div>
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

                    {expandedCode === message.id && message.code && (
                      <div className="border-t border-white/10 bg-black/40">
                        {typeof message.code === "object" ? (
                          <>
                            <div className="flex border-b border-white/10">
                              {Object.keys(message.code).map((filename) => (
                                <button
                                  key={filename}
                                  onClick={() => setActiveFileTab(filename)}
                                  className={`px-4 py-2 text-xs border-r border-white/10 ${
                                    activeFileTab === filename ? "bg-white/10" : "hover:bg-white/5"
                                  }`}
                                >
                                  <FileText className="h-3 w-3 inline mr-1" />
                                  {filename}
                                </button>
                              ))}
                            </div>
                            <div className="p-4">
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                {message.code[activeFileTab]}
                              </pre>
                            </div>
                          </>
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
