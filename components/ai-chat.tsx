"use client"
import { useState, useEffect, useRef } from "react"
import { Send, ArrowLeft, Plus, Eye, Save } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
  id: string
  role: "user" | "ai" | "system"
  content: string
  isCode?: boolean
  showCode?: boolean
}

interface CodeVersion {
  id: string
  code: string
  version: number
}

interface ChatSession {
  id: string
  messages: ChatMessage[]
  codeVersions: CodeVersion[]
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
  const [isSaving, setIsSaving] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [aiPrompt])

  useEffect(() => {
    if (currentAIFunction && isOpen) {
      if (currentAIFunction.chatSessions?.length > 0) {
        const session = currentAIFunction.chatSessions[0]
        setMessages(session.messages || [])
        setGeneratedCode(session.codeVersions?.[0]?.code || "")
      } else {
        setGeneratedCode(currentAIFunction.code || "")
      }
    }
  }, [currentAIFunction, isOpen])

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: aiPrompt
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: "I've generated the code for your plugin. You can review it below.",
        isCode: true,
        showCode: false
      }

      setMessages(prev => [...prev, userMessage, aiMessage])
      setAiPrompt("")
    } catch (error) {
      console.error("Error generating AI response:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedCode.trim()) return

    setIsSaving(true)
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000))
      onClose()
    } catch (error) {
      console.error("Error saving function:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleCodeVisibility = (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, showCode: !msg.showCode } : msg
    ))
  }

  const createNewChat = () => {
    setMessages([])
    setGeneratedCode("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-2xl flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-gray-200" />
          </button>
          <div className="w-8 h-8 relative">
            <Image 
              src="/s1-logo.png" 
              alt="S1 AI Lab" 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </div>
          <h1 className="text-gray-100 text-xl font-bold">S1 AI Lab</h1>
        </div>
        
        <button 
          onClick={createNewChat}
          className="p-2 rounded-lg hover:bg-gray-700/50 transition-all"
        >
          <Plus className="h-5 w-5 text-gray-200" />
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="mb-6 w-20 h-20 relative opacity-80">
              <Image 
                src="/s1-logo.png" 
                alt="S1" 
                width={80} 
                height={80} 
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Welcome to S1 AI Lab</h2>
            <p className="text-gray-400 max-w-md">
              Describe what you want to create and I'll generate Discord bot code for you.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 backdrop-blur-sm ${
                message.role === "user"
                  ? "bg-blue-600/30 text-gray-100 border border-blue-500/30"
                  : "bg-gray-800/60 text-gray-100 border border-gray-700"
              }`}>
                {message.isCode ? (
                  <div className="space-y-3">
                    <ReactMarkdown className="text-gray-100">
                      {message.content}
                    </ReactMarkdown>
                    
                    <div className="mt-3 bg-gray-900/40 rounded-xl border border-gray-700 overflow-hidden">
                      <div className="flex justify-between p-3">
                        <button
                          onClick={() => toggleCodeVisibility(message.id)}
                          className="px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg flex items-center text-sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {message.showCode ? "Hide Code" : "Show Code"}
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-blue-600/50 border border-blue-500/50 rounded-lg flex items-center text-sm disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {isSaving ? "Saving..." : "Save Plugin"}
                        </button>
                      </div>
                      
                      {message.showCode && (
                        <div className="p-3 bg-gray-900/80 max-h-60 overflow-auto border-t border-gray-700">
                          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                            {generatedCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-100">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 p-4 bg-gray-800/80 backdrop-blur-lg border-t border-gray-700">
        <div className="flex space-x-3">
          <textarea
            ref={textareaRef}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
            className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-400 resize-none min-h-[56px] max-h-40 p-3 text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            style={{ fontSize: "16px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleGenerateAI()
              }
            }}
          />
          <button
            onClick={handleGenerateAI}
            disabled={!aiPrompt.trim() || isGenerating}
            className="h-14 w-14 flex-shrink-0 bg-blue-600/50 border border-blue-500/50 rounded-xl flex items-center justify-center shadow-sm disabled:opacity-50 hover:bg-blue-600/70 transition-colors"
          >
            <Send className="h-5 w-5 text-gray-100" />
          </button>
        </div>
      </div>
    </div>
  )
}