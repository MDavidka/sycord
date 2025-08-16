"use client"
import { useState, useEffect, useRef } from "react"
import { Send, ArrowLeft, Plus, Eye, Copy, Save } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  isCode?: boolean
  showCode?: boolean
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: { isOpen: boolean, onClose: () => void, currentAIFunction?: UserAIFunction | null }) {
  const [input, setInput] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return

    setIsGenerating(true)
    const userMessage: ChatMessage = { 
      id: Date.now().toString(),
      role: "user",
      content: input 
    }
    setMessages(prev => [...prev, userMessage])
    setInput("")

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Here's the generated code for your plugin:",
        isCode: true,
        showCode: false
      }
      
      setGeneratedCode(`# Generated Discord Plugin\n# ${input}\n\ndef plugin_main():\n    return "${input}"`)
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCode = (id: string) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, showCode: !msg.showCode } : msg
    ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 bg-gray-800/90 backdrop-blur-md border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-300" />
          </button>
          <div className="w-7 h-7 relative">
            <Image 
              src="/s1-logo.png" 
              alt="AI" 
              width={28} 
              height={28} 
              className="object-contain"
            />
          </div>
          <h1 className="text-gray-200 font-medium">AI Plugin Builder</h1>
        </div>
        
        <button 
          onClick={() => setMessages([])}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="h-5 w-5 text-gray-300" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="mb-5 w-16 h-16 relative opacity-80">
              <Image 
                src="/s1-logo.png" 
                alt="AI" 
                width={64} 
                height={64} 
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-medium text-gray-300 mb-2">AI Plugin Builder</h2>
            <p className="text-gray-400 max-w-md">
              Describe the Discord plugin you want to create
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-xl p-4 ${
                message.role === "user"
                  ? "bg-gray-700 text-gray-100"
                  : "bg-gray-800/80 text-gray-200 border border-gray-700"
              }`}>
                {message.isCode ? (
                  <div className="space-y-4">
                    <ReactMarkdown className="text-gray-300">
                      {message.content}
                    </ReactMarkdown>
                    
                    <div className="mt-3 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                      <div className="flex justify-between items-center p-3 bg-gray-800/50">
                        <span className="text-sm text-gray-400">Generated Plugin</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleCode(message.id)}
                            className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            {message.showCode ? "Hide" : "Show Code"}
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(generatedCode)}
                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {message.showCode && (
                        <div className="p-3 max-h-60 overflow-auto">
                          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                            {generatedCode}
                          </pre>
                        </div>
                      )}
                      
                      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                        <button
                          onClick={() => console.log("Save plugin")}
                          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center justify-center transition-colors"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Plugin
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-200">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 p-4 bg-gray-800/90 backdrop-blur-md border-t border-gray-700">
        <div className="flex space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your plugin..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-400 p-3 min-h-[56px] max-h-40 resize-none focus:outline-none focus:ring-1 focus:ring-gray-500"
            style={{ fontSize: "16px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            className="h-14 w-14 flex-shrink-0 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-gray-700"
          >
            <Send className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Generating Indicator */}
      {isGenerating && (
        <div className="sticky bottom-16 left-0 right-0 flex justify-center">
          <div className="bg-gray-800 text-gray-300 text-sm px-4 py-2 rounded-full border border-gray-700 shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <span>Generating...</span>
          </div>
        </div>
      )}
    </div>
  )
}