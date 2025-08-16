"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Send, Copy, Plus, Loader2 } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "prism-react-renderer"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessage {
  id: string
  role: "user" | "ai" | "system"
  content: string
  isCode?: boolean
  timestamp?: Date
  codeVersionId?: string
}

interface CodeVersion {
  id: string
  code: string
  usageInstructions: string
  version: number
  created_at: string
  prompt: string
}

interface ChatSession {
  id: string
  name: string
  messages: ChatMessage[]
  codeVersions: CodeVersion[]
  created_at: string
  last_updated: string
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: AIChatProps) {
  const [aiPrompt, setAiPrompt] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeView, setActiveView] = useState<"chat" | "code">("chat")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([])
  const [currentCodeVersion, setCurrentCodeVersion] = useState<CodeVersion | null>(null)
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<Record<string, boolean>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [aiPrompt])

  useEffect(() => {
    if (currentAIFunction && isOpen) {
      const sessions = currentAIFunction.chatSessions || []
      if (sessions.length > 0) {
        const currentSession = sessions[0]
        setMessages(currentSession.messages || [])
        setCodeVersions(currentSession.codeVersions || [])
        if (currentSession.codeVersions && currentSession.codeVersions.length > 0) {
          const latestVersion = currentSession.codeVersions[currentSession.codeVersions.length - 1]
          setCurrentCodeVersion(latestVersion)
          setGeneratedCode(latestVersion.code)
        }
      }
    }
  }, [currentAIFunction, isOpen])

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: aiPrompt,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setAiPrompt("")

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiPrompt }),
      })

      if (!response.ok) throw new Error("Failed to generate code")

      const data = await response.json()
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: data.response || "Code generated successfully!",
        isCode: true,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      const newCodeVersion: CodeVersion = {
        id: `version_${Date.now()}`,
        code: data.code || "",
        usageInstructions: data.usageInstructions || "",
        version: codeVersions.length + 1,
        created_at: new Date().toISOString(),
        prompt: aiPrompt,
      }

      setCodeVersions((prev) => [...prev, newCodeVersion])
      setCurrentCodeVersion(newCodeVersion)
      setGeneratedCode(data.code || "")
    } catch (error) {
      console.error("Error generating AI response:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const toggleCodeBlock = (id: string) => {
    setExpandedCodeBlocks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:w-[95vw] sm:max-w-4xl sm:h-[95vh] bg-gray-900 text-white overflow-hidden p-0 rounded-lg">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center space-x-2">
            <Image src="/s1-logo.png" alt="S1 AI Lab" width={24} height={24} />
            <span className="font-medium text-sm">S1 AI Lab</span>
          </div>
          <div className="flex space-x-1">
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <span className="sr-only">Close</span>
              <span>×</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 p-2 bg-gray-800/50 border-b border-gray-700">
          <Button
            onClick={() => setActiveView("chat")}
            variant={activeView === "chat" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full px-3 py-1 text-xs font-medium"
          >
            Chat
          </Button>
          <Button
            onClick={() => setActiveView("code")}
            variant={activeView === "code" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full px-3 py-1 text-xs font-medium"
          >
            Code
          </Button>
        </div>

        {/* Chat View */}
        {activeView === "chat" && (
          <div className="flex flex-col flex-1 overflow-hidden bg-gray-800/30">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Image src="/s1-logo.png" alt="S1" width={48} height={48} className="mb-2 opacity-50" />
                  <p className="text-center text-sm font-medium">Welcome to S1 AI Lab</p>
                  <p className="text-center text-xs opacity-70 max-w-xs">
                    Describe what you want to create and I'll generate Discord bot code for you.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <AnimatePresence key={message.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700/80 text-gray-100 border border-gray-600/50"
                        }`}
                      >
                        {message.isCode ? (
                          <div className="space-y-2">
                            <ReactMarkdown className="prose prose-invert text-sm leading-relaxed">
                              {message.content}
                            </ReactMarkdown>
                            {generatedCode && (
                              <div className="bg-gray-700/50 rounded-lg border border-gray-600/50 overflow-hidden">
                                <div className="flex items-center justify-between p-2 border-b border-gray-600/50">
                                  <span className="text-xs text-gray-400 font-mono">Generated Code</span>
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(generatedCode)}
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => toggleCodeBlock(message.id)}
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                    >
                                      <span className="text-xs">{expandedCodeBlocks[message.id] ? "−" : "+"}</span>
                                    </Button>
                                  </div>
                                </div>
                                <div className={`overflow-x-auto ${expandedCodeBlocks[message.id] ? "max-h-96" : "max-h-40"}`}>
                                  <SyntaxHighlighter
                                    language="javascript"
                                    theme={undefined}
                                    customStyle={{ margin: 0, background: "transparent" }}
                                  >
                                    {expandedCodeBlocks[message.id] ? generatedCode : generatedCode.substring(0, 500)}
                                  </SyntaxHighlighter>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-400"}`}>
                          {message.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ))
              )}
              <div ref={messagesEndRef} />
              {isGenerating && (
                <div className="flex items-center space-x-2 p-2 bg-gray-700/50 rounded-lg w-fit">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              )}
            </div>

            {/* Fixed Input Bar */}
            <div className="p-3 border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Textarea
                  ref={textareaRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 resize-none min-h-[44px] max-h-32 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleGenerateAI()
                    }
                  }}
                />
                <Button
                  onClick={handleGenerateAI}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="bg-blue-600 text-white hover:bg-blue-700 h-10 w-10 p-0 flex-shrink-0 rounded-lg"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Code View */}
        {activeView === "code" && (
          <div className="flex flex-col flex-1 overflow-hidden bg-gray-800/30">
            <div className="flex-1 overflow-y-auto p-3">
              <div className="bg-gray-700/50 rounded-lg border border-gray-600/50 overflow-hidden">
                <div className="flex items-center justify-between p-2 border-b border-gray-600/50">
                  <span className="text-xs text-gray-400 font-mono">Generated Code</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedCode)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="overflow-x-auto max-h-[80vh]">
                  <SyntaxHighlighter
                    language="javascript"
                    theme={undefined}
                    customStyle={{ margin: 0, background: "transparent", padding: "1rem" }}
                  >
                    {generatedCode}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
