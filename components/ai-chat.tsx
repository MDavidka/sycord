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
  type: "question" | "plugin" | "normal" | "details" | "complex" | "newchat" | "usage"
  code?: string
  pluginName?: string
  files?: { name: string; code: string }[]
  detailsRequested?: string[]
  timestamp: Date
  deployed?: boolean
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
  const [detailInputs, setDetailInputs] = useState<Record<string, string>>({})
  const [activeFileTab, setActiveFileTab] = useState<Record<string, string>>({})
  const [lastUserMessage, setLastUserMessage] = useState("")
  const [currentPluginCode, setCurrentPluginCode] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const parseAIResponse = (content: string) => {
    const cleanContent = content.trim()

    // Check for [3] details request
    if (cleanContent.startsWith("[3]")) {
      const detailsMatch = cleanContent.match(/\[3\]([^[]+)/g)
      const detailsRequested = detailsMatch?.map((match) => match.replace("[3]", "").trim()) || []
      return {
        type: "details" as const,
        content: "Please provide the following details:",
        detailsRequested,
      }
    }

    // Check for [4] complex task
    if (cleanContent.startsWith("[4]")) {
      const files: { name: string; code: string }[] = []
      const fileMatches = cleanContent.match(/\[4\.\d+\]\s*([^\n]+)\n([\s\S]*?)(?=\[4\.\d+\]|$)/g)

      if (fileMatches) {
        fileMatches.forEach((match) => {
          const [, fileName, code] = match.match(/\[4\.\d+\]\s*([^\n]+)\n([\s\S]*)/) || []
          if (fileName && code) {
            files.push({ name: fileName.trim(), code: code.trim() })
          }
        })
      }

      return {
        type: "complex" as const,
        content: "Complex multi-file plugin generated",
        files,
      }
    }

    // Check for [5] new chat suggestion
    if (cleanContent.startsWith("[5]")) {
      return {
        type: "newchat" as const,
        content: cleanContent.replace(/^\[5\]\s*/, ""),
      }
    }

    // Check for [6] usage instructions
    if (cleanContent.startsWith("[6]")) {
      return {
        type: "usage" as const,
        content: cleanContent.replace(/^\[6\]\s*/, ""),
      }
    }

    // Check for [1.1] plugin name
    const nameMatch = cleanContent.match(/\[1\.1\]([^[]+)\[1\.1\]/)
    if (nameMatch) {
      return {
        type: "plugin" as const,
        content: "Plugin generated successfully!",
        pluginName: nameMatch[1].trim().substring(0, 20),
      }
    }

    // Check for [2] plugin code
    if (cleanContent.includes("import discord") || cleanContent.includes("@bot.command")) {
      return {
        type: "plugin" as const,
        content: "Plugin generated successfully!",
        code: cleanContent,
      }
    }

    // Check for [1] question response
    if (cleanContent.startsWith("[1]")) {
      return {
        type: "question" as const,
        content: cleanContent.replace(/^\[1\]\s*/, ""),
      }
    }

    // Default to question type
    return {
      type: "question" as const,
      content: cleanContent,
    }
  }

  const handleSendMessage = async (isDetailSubmission = false) => {
    if (!inputValue.trim() || isGenerating) return

    let messageToSend = inputValue

    if (isDetailSubmission && lastUserMessage && Object.keys(detailInputs).length > 0) {
      const detailsText = Object.entries(detailInputs)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")

      messageToSend = `I requested this feature before: "${lastUserMessage}", but missed these details: ${detailsText}. ${currentPluginCode ? `This is the current state of the code: ${currentPluginCode}` : ""}`

      // Hide the complex message from user view
      setInputValue("")
    } else {
      setLastUserMessage(inputValue)

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: inputValue,
        type: "normal",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])
      setInputValue("")
    }

    setIsGenerating(true)
    setDetailInputs({})

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
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
        content: parsed.content,
        type: parsed.type,
        code: parsed.code || (parsed.type === "plugin" ? content : undefined),
        pluginName: parsed.pluginName,
        files: parsed.files,
        detailsRequested: parsed.detailsRequested,
        timestamp: new Date(),
        deployed: false,
      }

      if (parsed.code) {
        setCurrentPluginCode(parsed.code)
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
    if (!message?.code && !message?.files) return

    try {
      const pluginData = {
        name: message.pluginName || "Untitled Plugin",
        description: "AI Generated Plugin",
        code: message.code,
        files: message.files,
        serverId,
      }

      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pluginData),
      })

      if (response.ok) {
        // Show checkmark animation
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deployed: true } : m)))

        // Hide checkmark after 1 second
        setTimeout(() => {
          setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deployed: "completed" as any } : m)))
        }, 1000)
      }
    } catch (error) {
      console.error("Error deploying plugin:", error)
    }
  }

  const handleBack = () => {
    if (messages.some((m) => m.type === "plugin" && !m.deployed)) {
      setShowSavePrompt(true)
    } else {
      onClose()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setExpandedCode(null)
    setEditingPlugin(null)
    setCurrentPluginCode("")
    setLastUserMessage("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-[#101010]/95 backdrop-blur-xl text-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]/90 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/10"
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
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/10"
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
                ) : message.type === "usage" ? (
                  <div className="max-w-[80%] bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed text-blue-100">{message.content}</p>
                  </div>
                ) : message.type === "newchat" ? (
                  <div className="max-w-[80%] bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed text-orange-100">{message.content}</p>
                    <Button
                      onClick={handleNewChat}
                      className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 h-auto"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      New Chat
                    </Button>
                  </div>
                ) : message.type === "details" ? (
                  <div className="max-w-[90%] bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm mb-3 text-yellow-100">{message.content}</p>
                    <div className="space-y-2">
                      {message.detailsRequested?.map((detail, index) => (
                        <div key={index}>
                          <label className="text-xs text-yellow-200 block mb-1">{detail}</label>
                          <input
                            type="text"
                            value={detailInputs[detail] || ""}
                            onChange={(e) => setDetailInputs((prev) => ({ ...prev, [detail]: e.target.value }))}
                            className="w-full bg-black/30 border border-yellow-500/30 rounded px-2 py-1 text-sm text-white"
                            placeholder={`Enter ${detail}`}
                          />
                        </div>
                      ))}
                      <Button
                        onClick={() => handleSendMessage(true)}
                        disabled={!Object.values(detailInputs).every((v) => v.trim())}
                        className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-3 py-1 h-auto"
                      >
                        Submit Details
                      </Button>
                    </div>
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
                          <div className="flex items-center space-x-1 text-red-400">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs">Complex Task</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm mb-4">{message.content}</p>

                      <div className="flex items-center space-x-2">
                        {message.deployed === true ? (
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : message.deployed === "completed" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingPlugin(editingPlugin === message.id ? null : message.id)}
                            className="text-white hover:bg-white/10 bg-white/10 h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedCode(expandedCode === message.id ? null : message.id)}
                              className="text-white hover:bg-white/10 bg-white/10 h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeployPlugin(message.id)}
                              className="flex-1 bg-white text-black hover:bg-gray-200 h-8 text-xs"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Deploy
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {expandedCode === message.id && (message.code || message.files) && (
                      <div className="border-t border-white/10 bg-black/40">
                        {message.files && message.files.length > 1 ? (
                          <>
                            <div className="flex border-b border-white/10">
                              {message.files.map((file, index) => (
                                <button
                                  key={index}
                                  onClick={() => setActiveFileTab((prev) => ({ ...prev, [message.id]: file.name }))}
                                  className={`px-3 py-2 text-xs border-r border-white/10 ${
                                    (activeFileTab[message.id] || message.files![0].name) === file.name
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
                                {
                                  message.files.find(
                                    (f) => f.name === (activeFileTab[message.id] || message.files![0].name),
                                  )?.code
                                }
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
              className="flex-1 bg-[#101010]/60 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 text-white placeholder-gray-400 resize-none min-h-[36px] max-h-32 text-base focus:outline-none focus:ring-2 focus:ring-white/20"
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
              className="bg-white text-black hover:bg-gray-200 h-9 w-9 p-0 rounded-full flex-shrink-0"
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
                  className="flex-1 text-white hover:bg-white/10 bg-white/5"
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
