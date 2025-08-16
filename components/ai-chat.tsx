"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, ArrowLeft, Code, Save, Copy, Download, RotateCcw } from "lucide-react"
import Image from "next/image"
import type { UserAIFunction } from "@/lib/types"
import ReactMarkdown from "react-markdown"

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
  onSave: () => void
}

export default function AIChat({ isOpen, onClose, currentAIFunction, onSave }: AIChatProps) {
  const { data: session } = useSession()

  // Chat state
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([])
  const [currentCodeVersion, setCurrentCodeVersion] = useState<CodeVersion | null>(null)

  // Generation state
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedCode, setGeneratedCode] = useState("")
  const [usageInstructions, setUsageInstructions] = useState("")
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Save state
  const [pluginName, setPluginName] = useState("")
  const [pluginDescription, setPluginDescription] = useState("")
  const [pluginThumbnailUrl, setPluginThumbnailUrl] = useState("")
  const [pluginProfileUrl, setPluginProfileUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // UI state
  const [showCodeViewer, setShowCodeViewer] = useState(false)

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
      const sessions = currentAIFunction.chatSessions || []
      setChatSessions(sessions)

      if (sessions.length > 0) {
        const latestSession = sessions[sessions.length - 1]
        setCurrentChatSession(latestSession)
        setMessages(latestSession.messages || [])
        setCodeVersions(latestSession.codeVersions || [])

        if (latestSession.codeVersions && latestSession.codeVersions.length > 0) {
          const latestVersion = latestSession.codeVersions[latestSession.codeVersions.length - 1]
          setCurrentCodeVersion(latestVersion)
          setGeneratedCode(latestVersion.code)
          setUsageInstructions(latestVersion.usageInstructions)
        }
      }

      setPluginName(currentAIFunction.name || "")
      setPluginDescription(currentAIFunction.description || "")
      setPluginThumbnailUrl(currentAIFunction.thumbnailUrl || "")
      setPluginProfileUrl(currentAIFunction.profileUrl || "")
    }
  }, [currentAIFunction, isOpen])

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() || isGenerating) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setHasError(false)
    setErrorMessage("")

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 15, 95))
    }, 200)

    try {
      // Build context from previous code versions
      const contextMessages = []
      if (codeVersions.length > 0) {
        const latestVersion = codeVersions[codeVersions.length - 1]
        contextMessages.push({
          role: "system",
          content: `Previous bot code version ${latestVersion.version}:\n\n${latestVersion.code}\n\nUsage instructions: ${latestVersion.usageInstructions}`,
        })
      }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: contextMessages,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate plugin")

      const data = await response.json()
      clearInterval(progressInterval)
      setGenerationProgress(100)

      // Parse AI response
      const parts = data.code.split(/\d+\.\s*/)
      const codeSection = parts[1] || data.code
      const usageSection = parts[2] || ""

      setGeneratedCode(codeSection.trim())
      setUsageInstructions(usageSection.trim())

      // Create new code version
      const newCodeVersion: CodeVersion = {
        id: `version_${Date.now()}`,
        code: codeSection.trim(),
        usageInstructions: usageSection.trim(),
        version: (currentCodeVersion?.version || 0) + 1,
        created_at: new Date().toISOString(),
        prompt: aiPrompt,
      }

      setCurrentCodeVersion(newCodeVersion)
      setCodeVersions((prev) => [...prev, newCodeVersion])

      const newMessages: ChatMessage[] = [
        ...messages,
        {
          id: `msg_${Date.now()}_user`,
          role: "user",
          content: aiPrompt,
          timestamp: new Date(),
        },
        {
          id: `msg_${Date.now()}_ai`,
          role: "ai",
          content: "Discord bot generated successfully!",
          isCode: true,
          timestamp: new Date(),
          codeVersionId: newCodeVersion.id,
        },
      ]

      setMessages(newMessages)

      // Update chat session if editing existing function
      if (currentAIFunction && currentChatSession) {
        await fetch("/api/user-ai-functions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            functionId: currentAIFunction._id,
            chatSessionId: currentChatSession.id,
            messages: newMessages,
            action: "updateChat",
          }),
        })

        await fetch("/api/user-ai-functions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            functionId: currentAIFunction._id,
            chatSessionId: currentChatSession.id,
            newCodeVersion,
            action: "addCodeVersion",
          }),
        })
      }
    } catch (error) {
      console.error("Error generating plugin:", error)
      clearInterval(progressInterval)
      setGenerationProgress(0)
      setIsGenerating(false)
      setHasError(true)
      setErrorMessage("Sorry, there was an error generating the bot. Please try again.")
    } finally {
      setIsGenerating(false)
      setAiPrompt("")
    }
  }

  const handleSaveAIFunction = async () => {
    if (!generatedCode || !pluginName.trim()) return
    setIsSaving(true)

    try {
      if (currentAIFunction) {
        // Update existing function
        await fetch("/api/user-ai-functions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            functionId: currentAIFunction._id,
            chatSessionId: currentChatSession?.id,
            messages,
            action: "updateChat",
          }),
        })
      } else {
        // Create new function
        await fetch("/api/user-ai-functions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pluginName,
            description: pluginDescription,
            code: generatedCode,
            usageInstructions: usageInstructions,
            thumbnailUrl: pluginThumbnailUrl,
            profileUrl: pluginProfileUrl,
            chatSessions: [
              {
                id: `session_${Date.now()}`,
                name: "Main Chat",
                messages,
                codeVersions,
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
              },
            ],
          }),
        })
      }

      onSave()
      onClose()
    } catch (error) {
      console.error("Error saving AI function:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${pluginName.replace(/\s+/g, "_").toLowerCase()}.py`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
  }

  const handleClearConversation = () => {
    setMessages([])
    setGeneratedCode("")
    setUsageInstructions("")
    setGenerationProgress(0)
    setHasError(false)
    setErrorMessage("")
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleGenerateAI()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-full h-full md:max-w-4xl md:max-h-[90vh] md:w-auto md:h-auto p-0 bg-gray-900 border-gray-800">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="flex-row items-center justify-between p-4 border-b border-gray-800 space-y-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Image src="/s1-logo.png" alt="S1" width={24} height={24} className="rounded" />
                <span className="text-white font-medium">S1</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                className="text-gray-400 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"
                  }`}
                >
                  {message.isCode ? (
                    <div className="space-y-3">
                      <p className="text-sm">Discord bot generated successfully!</p>
                      {usageInstructions && (
                        <div className="bg-gray-900/50 rounded-lg p-3 text-sm">
                          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                            {usageInstructions}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  {message.timestamp && <p className="text-xs opacity-60 mt-2">{formatTimestamp(message.timestamp)}</p>}
                </div>
              </div>
            ))}

            {/* Generation Card */}
            {(isGenerating || generatedCode) && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Discord Bot Generator</h3>
                  {generationProgress > 0 && generationProgress < 100 && (
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{Math.round(generationProgress)}%</span>
                    </div>
                  )}
                </div>

                {generatedCode && !isGenerating && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCodeViewer(true)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Show Code
                    </Button>
                    <Button
                      onClick={handleSaveAIFunction}
                      disabled={isSaving || !pluginName.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Save Form */}
          {generatedCode && !currentAIFunction && (
            <div className="border-t border-gray-800 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pluginName" className="text-white text-sm">
                    Name
                  </Label>
                  <Input
                    id="pluginName"
                    value={pluginName}
                    onChange={(e) => setPluginName(e.target.value)}
                    placeholder="Bot name"
                    className="bg-gray-800 border-gray-700 text-white text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="pluginDescription" className="text-white text-sm">
                    Description
                  </Label>
                  <Input
                    id="pluginDescription"
                    value={pluginDescription}
                    onChange={(e) => setPluginDescription(e.target.value)}
                    placeholder="Bot description"
                    className="bg-gray-800 border-gray-700 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the Discord bot you want to create..."
                className="flex-1 bg-gray-800 border-gray-700 text-white resize-none min-h-[44px] max-h-32 text-base"
                style={{ fontSize: "16px" }}
              />
              <Button
                onClick={handleGenerateAI}
                disabled={!aiPrompt.trim() || isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-11"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Code Viewer Modal */}
        <Dialog open={showCodeViewer} onOpenChange={setShowCodeViewer}>
          <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                Discord Bot Code
              </DialogTitle>
            </DialogHeader>
            <div className="bg-gray-950 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{generatedCode}</pre>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCopyCode} variant="outline" className="text-white border-gray-700 bg-transparent">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                onClick={handleDownloadCode}
                variant="outline"
                className="text-white border-gray-700 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
