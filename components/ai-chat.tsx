"use client"
import { useState, useEffect, useRef } from "react"
import { Send, ArrowLeft, Plus, Eye, Copy, Save } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
  id: string
  role: "user" | "ai" | "system"
  content: string
  isCode?: boolean
  timestamp?: Date
  showCode?: boolean
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
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
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
      setGeneratedCode(currentAIFunction.code || "")
      setMessages([
        {
          id: "init",
          role: "ai",
          content: "Hello! I'm your AI assistant. Describe what you want to create.",
          timestamp: new Date()
        }
      ])
    }
  }, [currentAIFunction, isOpen])

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    setHasError(false)
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: aiPrompt,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setAiPrompt("")

    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate mock response
      const mockCode = `def ${aiPrompt.toLowerCase().replace(/\s+/g, '_')}():\n    """${aiPrompt}"""\n    return "Function created successfully"`
      
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: "Here's the code for your request:",
        isCode: true,
        timestamp: new Date(),
        showCode: false,
      }

      setGeneratedCode(mockCode)
      setMessages(prev => [...prev, aiMessage])
      
    } catch (error) {
      console.error("Error generating AI response:", error)
      setHasError(true)
      setErrorMessage("Failed to generate code. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAIFunction = async () => {
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-2xl flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-all border border-gray-700"
          >
            <ArrowLeft className="h-5 w-5 text-gray-300" />
          </button>
          <div className="w-8 h-8 relative">
            <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-lg w-full h-full flex items-center justify-center">
              <span className="font-bold text-gray-900 text-xs">AI</span>
            </div>
          </div>
          <h1 className="text-gray-200 text-lg font-medium">Code Assistant</h1>
        </div>
        
        <button 
          onClick={() => setMessages([])}
          className="p-2 rounded-lg hover:bg-gray-800 transition-all border border-gray-700"
        >
          <Plus className="h-5 w-5 text-gray-300" />
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="mb-6 w-20 h-20 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-500 rounded-xl rotate-45"></div>
              <div className="absolute inset-0 flex items-center justify-center rotate-[-45deg]">
                <span className="font-bold text-gray-900 text-2xl">AI</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-200 mb-2">AI Code Generator</h2>
            <p className="text-gray-400 max-w-md">
              Describe the functionality you need, and I'll create the code for you.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-xl p-4 backdrop-blur-sm ${
                message.role === "user"
                  ? "bg-gray-800 text-gray-200"
                  : "bg-gray-800/60 text-gray-200 border border-gray-700"
              }`}>
                {message.isCode ? (
                  <div className="space-y-4">
                    <ReactMarkdown className="text-gray-300">
                      {message.content}
                    </ReactMarkdown>
                    
                    <div className="mt-3 bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-gray-800/30">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleCodeVisibility(message.id)}
                            className="text-xs px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center transition-all"
                          >
                            <Eye className="h-4 w-4 mr-1.5 text-gray-300" />
                            {message.showCode ? "Hide Code" : "Show Code"}
                          </button>
                          <button
                            onClick={handleSaveAIFunction}
                            disabled={isSaving}
                            className="text-xs px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center transition-all disabled:opacity-50"
                          >
                            <Save className="h-4 w-4 mr-1.5 text-gray-300" />
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                      
                      {message.showCode && (
                        <div className="p-3 bg-gray-900/80 max-h-60 overflow-auto border-t border-gray-800">
                          <div className="flex justify-end mb-2">
                            <button
                              onClick={copyToClipboard}
                              className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded flex items-center"
                            >
                              <Copy className="h-3.5 w-3.5 mr-1 text-gray-300" />
                              Copy
                            </button>
                          </div>
                          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                            {generatedCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Generating Indicator */}
      {isGenerating && (
        <div className="sticky bottom-0 p-3 bg-gray-900/80 backdrop-blur-lg border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-800/50 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-gray-500 to-gray-300 h-full rounded-full animate-pulse"
                style={{ width: "70%" }}
              />
            </div>
            <span className="text-xs text-gray-400">Generating...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <div className="sticky bottom-0 p-3 bg-red-900/50 backdrop-blur-lg border-t border-red-700">
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-0 p-4 bg-gray-900/80 backdrop-blur-xl border-t border-gray-700">
        <div className="flex space-x-3">
          <textarea
            ref={textareaRef}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe your code request..."
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 resize-none min-h-[56px] max-h-40 p-3 text-base focus:outline-none focus:ring-1 focus:ring-gray-500"
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
            className="h-14 w-14 flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-700 rounded-xl flex items-center justify-center hover:from-gray-600 hover:to-gray-700 transition-all disabled:opacity-40"
          >
            <Send className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  )
}