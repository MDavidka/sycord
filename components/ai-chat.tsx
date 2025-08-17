"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Send, ArrowLeft, Plus, Eye, EyeOff, Save, Edit3, Code } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  type: "question" | "plugin" | "normal"
  code?: string
  timestamp: Date
  showCode?: boolean
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Plugin editing state
  const [editingPlugin, setEditingPlugin] = useState<{
    name: string
    description: string
    thumbnailUrl: string
    profileUrl: string
    code: string
  } | null>(null)

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
  }, [inputMessage])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: inputMessage,
      type: "normal",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsGenerating(true)
    setGenerationStatus("Processing request...")

    try {
      let contextMessage = inputMessage
      const lastPluginMessage = messages.filter((m) => m.type === "plugin").pop()

      if (lastPluginMessage && lastPluginMessage.code) {
        contextMessage = `This is the current state of the code: ${lastPluginMessage.code}\n\nThe user wants: ${inputMessage}\n\nCreate this, but maintain the old functionality.`
      }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Determine if this is a question about Discord bots/Python (respond with [1] and answer) or a plugin creation request (respond with [2] and generate code). If it's neither, respond with [1] and say "This AI should only be used to create plugins for Discord".\n\nUser request: ${contextMessage}`,
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      const aiResponse = data.code || ""

      const isQuestion = aiResponse.startsWith("[1]")
      const isPlugin = aiResponse.startsWith("[2]")

      let cleanContent = aiResponse
      let extractedCode = ""

      if (isQuestion) {
        cleanContent = aiResponse.replace(/^\[1\]\s*/, "")
      } else if (isPlugin) {
        cleanContent = aiResponse.replace(/^\[2\]\s*/, "")
        extractedCode = cleanContent
        cleanContent = "Plugin generated successfully!"
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: cleanContent,
        type: isPlugin ? "plugin" : "question",
        code: extractedCode,
        timestamp: new Date(),
        showCode: false,
      }

      setMessages((prev) => [...prev, aiMessage])

      if (isPlugin) {
        setHasUnsavedChanges(true)
      }
    } catch (error) {
      console.error("Error generating response:", error)
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
      setGenerationStatus("")
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowSaveDialog(true)
    } else {
      onClose()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setHasUnsavedChanges(false)
  }

  const toggleCodeVisibility = (messageId: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, showCode: !msg.showCode } : msg)))
  }

  const handleEditPlugin = (message: ChatMessage) => {
    setEditingPlugin({
      name: "Unknown",
      description: "",
      thumbnailUrl: "",
      profileUrl: "",
      code: message.code || "",
    })
  }

  const handleSavePlugin = async () => {
    if (!editingPlugin) return

    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingPlugin.name,
          description: editingPlugin.description,
          code: editingPlugin.code,
          thumbnailUrl: editingPlugin.thumbnailUrl,
          profileUrl: editingPlugin.profileUrl,
        }),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        setEditingPlugin(null)
        onClose()
      }
    } catch (error) {
      console.error("Error saving plugin:", error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="w-full h-full max-w-none bg-gray-900/95 backdrop-blur-xl border-0 text-white overflow-hidden p-0 sm:rounded-none">
          <div className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-9 w-9 p-0 text-gray-300 hover:text-white hover:bg-gray-700/50"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 relative">
                    <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="text-xl font-semibold text-white">S1 AI Lab</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="h-9 w-9 p-0 text-gray-300 hover:text-white hover:bg-gray-700/50"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-16 h-16 relative mb-4 opacity-50">
                  <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
                </div>
                <p className="text-center text-lg font-medium mb-2">Welcome to S1 AI Lab</p>
                <p className="text-center text-base opacity-75 max-w-md">
                  Ask questions about Discord bots or request plugin creation.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "user" ? (
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white text-gray-900">
                      <p className="text-base leading-relaxed">{message.content}</p>
                    </div>
                  ) : message.type === "question" ? (
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-800/70 backdrop-blur-sm text-white border border-gray-700/50">
                      <p className="text-base leading-relaxed">{message.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[90%] bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <Code className="h-6 w-6 text-gray-300" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium">Unknown</h3>
                            <p className="text-gray-400 text-sm">No description</p>
                            <p className="text-gray-300 text-sm mt-2">{message.content}</p>
                          </div>
                        </div>

                        {message.code && (
                          <div className="mt-4 bg-gray-900/50 rounded-lg border border-gray-700/30 overflow-hidden">
                            <div className="flex items-center justify-between p-3 border-b border-gray-700/30">
                              <span className="text-sm font-medium text-gray-300">Generated Code</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleCodeVisibility(message.id)}
                                className="h-8 px-3 text-gray-300 hover:text-white hover:bg-gray-700/50 bg-white text-gray-900"
                              >
                                {message.showCode ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide Code
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Show Code
                                  </>
                                )}
                              </Button>
                            </div>

                            {message.showCode && (
                              <div className="p-3 bg-gray-950/50">
                                <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                  {message.code}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/30">
                          <Button
                            size="sm"
                            onClick={() => handleEditPlugin(message)}
                            className="bg-white text-gray-900 hover:bg-gray-100"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleCodeVisibility(message.id)}
                              className="text-gray-300 hover:text-white hover:bg-gray-700/50 bg-white text-gray-900"
                            >
                              Check Code
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditPlugin(message)}
                              className="text-gray-300 hover:text-white hover:bg-gray-700/50 bg-white text-gray-900"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {isGenerating && (
            <div className="border-t border-gray-700/50 p-4 bg-gray-800/60 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 relative animate-spin">
                  <Image src="/s1-logo.png" alt="S1" width={24} height={24} className="object-contain" />
                </div>
                <span className="text-sm text-gray-300">{generationStatus}</span>
              </div>
            </div>
          )}

          <div className="border-t border-gray-700/50 p-4 bg-gray-800/80 backdrop-blur-md">
            <div className="flex space-x-3">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a question or request a plugin..."
                className="flex-1 bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 resize-none min-h-[44px] max-h-32"
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
                disabled={!inputMessage.trim() || isGenerating}
                className="bg-white text-gray-900 hover:bg-gray-100 h-11 w-11 p-0 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 text-white">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Unsaved Changes</h3>
            <p className="text-gray-300 mb-6">You have unsaved plugin changes. Do you want to save before leaving?</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSaveDialog(false)
                  setHasUnsavedChanges(false)
                  onClose()
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-700/50"
              >
                Don't Save
              </Button>
              <Button
                onClick={() => {
                  setShowSaveDialog(false)
                  // Handle save logic here
                }}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPlugin} onOpenChange={() => setEditingPlugin(null)}>
        <DialogContent className="bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 text-white max-w-md">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Plugin Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editingPlugin?.name || ""}
                  onChange={(e) => setEditingPlugin((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-md text-white"
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={editingPlugin?.description || ""}
                  onChange={(e) => setEditingPlugin((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-md text-white resize-none"
                  rows={3}
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  value={editingPlugin?.thumbnailUrl || ""}
                  onChange={(e) =>
                    setEditingPlugin((prev) => (prev ? { ...prev, thumbnailUrl: e.target.value } : null))
                  }
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-md text-white"
                  style={{ fontSize: "16px" }}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setEditingPlugin(null)}
                className="text-gray-300 hover:text-white hover:bg-gray-700/50"
              >
                Cancel
              </Button>
              <Button onClick={handleSavePlugin} className="bg-white text-gray-900 hover:bg-gray-100">
                Save Plugin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
