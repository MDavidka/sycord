"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Send, Eye, Save, Copy, Download, X, Trash2, MessageSquare } from "lucide-react"

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

interface UserAIFunction {
  _id: string
  name: string
  description: string
  code: string
  usageInstructions: string
  profileUrl?: string
  thumbnailUrl?: string
  chatSessions?: ChatSession[]
  created_at: string
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction: UserAIFunction | null
  onSaveFunction: (functionData: any) => void
  onUpdateFunction: (functionData: any) => void
}

export default function AIChat({ isOpen, onClose, currentAIFunction, onSaveFunction, onUpdateFunction }: AIChatProps) {
  const { data: session } = useSession()
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([])
  const [currentCodeVersion, setCurrentCodeVersion] = useState<CodeVersion | null>(null)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedCode, setGeneratedCode] = useState("")
  const [usageInstructions, setUsageInstructions] = useState("")
  const [showCodeViewer, setShowCodeViewer] = useState(false)
  const [pluginName, setPluginName] = useState("")
  const [pluginDescription, setPluginDescription] = useState("")
  const [pluginThumbnailUrl, setPluginThumbnailUrl] = useState("")
  const [pluginProfileUrl, setPluginProfileUrl] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (currentAIFunction) {
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
      } else {
        handleStartNewChat()
      }
    }
  }, [currentAIFunction])

  const handleStartNewChat = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      name: `Chat ${chatSessions.length + 1}`,
      messages: [],
      codeVersions: [],
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }

    setChatSessions((prev) => [...prev, newSession])
    setCurrentChatSession(newSession)
    setMessages([])
    setCodeVersions([])
    setCurrentCodeVersion(null)
    setGeneratedCode("")
    setUsageInstructions("")
  }

  const handleGeneratePlugin = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    setGenerationProgress(0)

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 15, 90))
    }, 200)

    try {
      let contextPrompt = aiPrompt
      if (currentCodeVersion && currentChatSession) {
        const previousVersions = codeVersions.slice(-3)
        const contextInfo = previousVersions
          .map((v) => `Version ${v.version}: ${v.code.substring(0, 500)}...`)
          .join("\n\n")

        contextPrompt = `Previous code context:\n${contextInfo}\n\nUser request: ${aiPrompt}`
      }

      const response = await fetch("/api/ai/generate-plugin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate plugin")
      }

      const data = await response.json()
      clearInterval(progressInterval)
      setGenerationProgress(100)

      const fullResponse = data.code
      const parts = fullResponse.split(/2\.\s*/)

      let codeSection = ""
      let usageSection = ""

      if (parts.length >= 2) {
        codeSection = parts[0].trim()
        usageSection = parts[1].trim()
      } else {
        codeSection = fullResponse
        usageSection = "No usage instructions provided."
      }

      setGeneratedCode(codeSection)
      setUsageInstructions(usageSection)

      const newCodeVersion: CodeVersion = {
        id: `version_${Date.now()}`,
        code: codeSection,
        usageInstructions: usageSection,
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

      setAiPrompt("")
    } catch (error) {
      console.error("Error generating plugin:", error)
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleSaveFunction = async () => {
    if (!currentCodeVersion || !pluginName.trim()) return

    const functionData = {
      name: pluginName,
      description: pluginDescription,
      code: currentCodeVersion.code,
      usageInstructions: currentCodeVersion.usageInstructions,
      profileUrl: pluginProfileUrl,
      thumbnailUrl: pluginThumbnailUrl,
      chatSessions: [
        {
          ...currentChatSession,
          messages,
          codeVersions,
        },
      ],
    }

    if (currentAIFunction) {
      onUpdateFunction({ ...functionData, _id: currentAIFunction._id })
    } else {
      onSaveFunction(functionData)
    }

    setPluginName("")
    setPluginDescription("")
    setPluginThumbnailUrl("")
    setPluginProfileUrl("")
  }

  const handleCopyCode = () => {
    if (currentCodeVersion) {
      navigator.clipboard.writeText(currentCodeVersion.code)
    }
  }

  const handleDownloadCode = () => {
    if (currentCodeVersion) {
      const blob = new Blob([currentCodeVersion.code], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${pluginName || "discord-bot"}.py`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleClearChat = () => {
    const lastCodeMessage = messages.filter((msg) => msg.isCode).pop()
    if (lastCodeMessage) {
      setMessages([lastCodeMessage])
    } else {
      setMessages([])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-full h-full p-0 gap-0 md:max-w-4xl md:max-h-[90vh] md:h-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="flex-row items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <img src="/s1-logo.png" alt="S1" className="w-6 h-6" />
                <span className="font-medium text-gray-900">S1</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartNewChat}
                className="text-gray-600 hover:text-gray-900"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                New Chat
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="text-gray-600 hover:text-gray-900">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user" ? "bg-blue-500 text-white" : "bg-white text-gray-900 shadow-sm border"
                  }`}
                >
                  <div className="text-sm leading-relaxed">{message.content}</div>
                  {message.timestamp && (
                    <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Generation Card */}
            {(isGenerating || currentCodeVersion) && (
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    {isGenerating ? "Generating Discord Bot..." : "Discord Bot Ready"}
                  </h3>
                  {isGenerating && <div className="text-sm text-gray-500">{Math.round(generationProgress)}%</div>}
                </div>

                {isGenerating && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                )}

                {usageInstructions && !isGenerating && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">How to use:</h4>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">{usageInstructions}</div>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Action Buttons */}
          {currentCodeVersion && !isGenerating && (
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2 mb-4">
                <Button onClick={() => setShowCodeViewer(true)} variant="outline" className="flex-1 h-10">
                  <Eye className="h-4 w-4 mr-2" />
                  Show Code
                </Button>
                <Button
                  onClick={handleSaveFunction}
                  className="flex-1 h-10 bg-gray-900 hover:bg-gray-800"
                  disabled={!pluginName.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>

              {/* Save Form */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={pluginName}
                    onChange={(e) => setPluginName(e.target.value)}
                    placeholder="Bot name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={pluginDescription}
                    onChange={(e) => setPluginDescription(e.target.value)}
                    placeholder="Bot description"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the Discord bot you want to create..."
                className="flex-1 min-h-[44px] max-h-32 resize-none text-base"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleGeneratePlugin()
                  }
                }}
              />
              <Button
                onClick={handleGeneratePlugin}
                disabled={!aiPrompt.trim() || isGenerating}
                className="h-11 px-4 bg-gray-900 hover:bg-gray-800"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Code Viewer Modal */}
        <Dialog open={showCodeViewer} onOpenChange={setShowCodeViewer}>
          <DialogContent className="max-w-4xl max-h-[80vh] p-0">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle>Generated Code</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadCode}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowCodeViewer(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="p-4 overflow-auto">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto">
                <code>{currentCodeVersion?.code}</code>
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
