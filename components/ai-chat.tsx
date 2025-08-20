"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MessageSquare, Send, Save, Loader2 } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

// New interfaces for structured AI responses
interface PluginFile {
  fileName: string
  code: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  timestamp: Date
  type:
    | "user"
    | "ai_question"
    | "ai_plugin"
    | "ai_missing_details"
    | "ai_out_of_scope"
    | "ai_usage_instructions"
    | "ai_follow_up_warning"
    | "ai_error"
  content: string
  pluginName?: string
  pluginFiles?: PluginFile[]
  missingDetails?: string[]
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

const parseAIResponse = (rawResponse: string): ChatMessage[] => {
  const messages: ChatMessage[] = []
  const timestamp = new Date()

  if (rawResponse.startsWith("[1]")) {
    messages.push({ id: `msg_${Date.now()}`, role: "assistant", type: "ai_question", content: rawResponse.replace("[1]", "").trim(), timestamp })
    return messages
  }
  if (rawResponse.startsWith("[5]")) {
    messages.push({ id: `msg_${Date.now()}`, role: "assistant", type: "ai_out_of_scope", content: rawResponse.replace("[5]", "").trim(), timestamp })
    return messages
  }

  const pluginNameMatch = rawResponse.match(/\[1\.1\](.*?)\[1\.1\]/s)
  const usageMatch = rawResponse.match(/\[6\](.*?)\[6\]/s)
  const codeMatch = rawResponse.match(/\[2\]([\s\S]*?)\[2\]/s)

  if (pluginNameMatch && codeMatch) {
    const pluginName = pluginNameMatch[1].trim()
    if (usageMatch) {
      messages.push({
        id: `msg_${Date.now()}_usage`,
        role: "assistant",
        type: "ai_usage_instructions",
        content: usageMatch[1].trim(),
        timestamp,
      })
    }
    messages.push({
      id: `msg_${Date.now()}_plugin`,
      role: "assistant",
      type: "ai_plugin",
      content: `Plugin generated: ${pluginName}`,
      pluginName: pluginName,
      pluginFiles: [{ fileName: `${pluginName}.py`, code: codeMatch[1].trim() }],
      timestamp,
    })
  } else {
    messages.push({
      id: `msg_${Date.now()}_error`,
      role: "assistant",
      type: "ai_error",
      content: "The AI returned a response in an unexpected format. Please try again.",
      timestamp,
    })
  }
  return messages
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    const content = inputValue
    if (!content.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      type: "user",
      content: content,
      timestamp: new Date(),
    }

    const currentHistory = messages.map(m => ({role: m.role, content: m.content}))
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history: currentHistory }),
      })
      if (!response.ok) throw new Error("API request failed")
      const data = await response.json()
      const newAiMessages = parseAIResponse(data.response || "")
      setMessages((prev) => [...prev, ...newAiMessages])
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `msg_${Date.now()}_error`, role: "assistant", type: "ai_error",
        content: `Sorry, an error occurred: ${error.message}`, timestamp: new Date()
      }])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (message?.type !== "ai_plugin" || !message.pluginFiles || message.pluginFiles.length === 0) return

    const codeToSave = message.pluginFiles[0].code
    const usageInstructions = messages.find(m => m.type === 'ai_usage_instructions')?.content

    try {
      await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: message.pluginName || "Untitled Plugin",
          description: "AI Generated Plugin",
          code: codeToSave,
          usageInstructions: usageInstructions || "",
        }),
      })
    } catch (error) {
      console.error("Error saving plugin:", error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-[#101010]/95 backdrop-blur-xl text-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]/80 backdrop-blur-sm">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 relative"><Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" /></div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-16 h-16 relative mb-4 opacity-50"><Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" /></div>
              <p className="text-center text-lg font-medium mb-2">Welcome to S1 AI Lab</p>
              <p className="text-center opacity-75 max-w-md">Ask questions about Discord bots or request plugin creation</p>
            </div>
          ) : (
            messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[80%] bg-white/90 backdrop-blur-sm text-gray-900 rounded-2xl px-4 py-3 shadow-lg">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                )
              }

              // AI Messages
              switch (message.type) {
                case "ai_usage_instructions":
                case "ai_question":
                case "ai_error":
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  )
                case "ai_plugin":
                  const files = message.pluginFiles || []
                  const activeFile = activeTabs[message.id] || files[0]?.fileName
                  const code = files.find((f) => f.fileName === activeFile)?.code || ""
                  return (
                    <div key={message.id} className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center"><span className="text-2xl">🤖</span></div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{message.pluginName}</h3>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleSavePlugin(message.id)} className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0">
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {files.length > 0 && (
                        <div className="border-t border-white/10 bg-black/40">
                          {files.length > 1 && (
                            <div className="flex border-b border-white/10 px-2">
                              {files.map((file) => (
                                <button key={file.fileName} onClick={() => setActiveTabs((prev) => ({ ...prev, [message.id]: file.fileName }))}
                                  className={`px-3 py-2 text-xs ${activeFile === file.fileName ? "text-white border-b-2 border-white" : "text-gray-400"}`}>
                                  {file.fileName}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="p-4 max-h-96 overflow-y-auto"><pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{code}</pre></div>
                        </div>
                      )}
                    </div>
                  )
                default: return null
              }
            })
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

        <div className="relative z-20 border-t border-white/10 p-4 bg-[#101010]/40 backdrop-blur-sm">
          <div className="flex items-end space-x-3">
            <textarea ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question or request a plugin..."
              className="flex-1 bg-[#101010]/60 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 text-white placeholder-gray-400 resize-none min-h-[40px] max-h-32 text-base focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ fontSize: "16px" }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isGenerating} className="bg-white text-black hover:bg-gray-200 h-10 w-10 p-0 rounded-full flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
