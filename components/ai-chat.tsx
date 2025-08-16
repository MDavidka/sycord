"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  updated_at: string
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction: UserAIFunction | null
  onSaveFunction: (functionData: Partial<UserAIFunction>) => Promise<void>
  onUpdateFunction: (functionId: string, updates: Partial<UserAIFunction>) => Promise<void>
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
  const chatContainerRef = useRef<HTMLDivElement>(null)
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
    if (isOpen && currentAIFunction) {
      handleEditAIFunction(currentAIFunction)
    } else if (isOpen && !currentAIFunction) {
      handleStartNewChat()
    }
  }, [isOpen, currentAIFunction])

  const handleEditAIFunction = async (aiFunction: UserAIFunction) => {
    const sessions = aiFunction.chatSessions || []
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
      const newSession: ChatSession = {
        id: `session_${Date.now()}`,
        name: `Chat for ${aiFunction.name}`,
        messages: [],
        codeVersions: [],
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }

      setCurrentChatSession(newSession)
      setChatSessions([newSession])
      setMessages([])
      setCodeVersions([])
      setCurrentCodeVersion(null)
    }

    setPluginName(aiFunction.name)
    setPluginDescription(aiFunction.description)
    setPluginThumbnailUrl(aiFunction.thumbnailUrl || "")
    setPluginProfileUrl(aiFunction.profileUrl || "")
  }

  const handleStartNewChat = () => {
    setChatSessions([])
    setMessages([])
    setCodeVersions([])
    setCurrentCodeVersion(null)
    setGeneratedCode("")
    setUsageInstructions("")
    setPluginName("")
    setPluginDescription("")
    setPluginThumbnailUrl("")
    setPluginProfileUrl("")
    setCurrentChatSession(null)
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
      clearInterval(progressInterval)
      setGenerationProgress(0)
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 2000)
    }
  }

  const handleSavePlugin = async () => {
    if (!currentCodeVersion || !pluginName.trim()) return

    try {
      if (currentAIFunction) {
        await onUpdateFunction(currentAIFunction._id, {
          name: pluginName,
          description: pluginDescription,
          code: currentCodeVersion.code,
          usageInstructions: currentCodeVersion.usageInstructions,
          profileUrl: pluginProfileUrl,
          thumbnailUrl: pluginThumbnailUrl,
          chatSessions: chatSessions,
        })
      } else {
        const newSession: ChatSession = {
          id: `session_${Date.now()}`,
          name: `Chat for ${pluginName}`,
          messages,
          codeVersions,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        }

        await onSaveFunction({
          name: pluginName,
          description: pluginDescription,
          code: currentCodeVersion.code,
          usageInstructions: currentCodeVersion.usageInstructions,
          profileUrl: pluginProfileUrl,
          thumbnailUrl: pluginThumbnailUrl,
          chatSessions: [newSession],
        })
      }

      onClose()
    } catch (error) {
      console.error("Error saving plugin:", error)
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadCode = () => {
    if (!currentCodeVersion) return

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-full h-full p-0 gap-0 md:max-w-4xl md:max-h-[90vh] md:h-auto md:rounded-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="flex-row items-center justify-between p-4 border-b bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <img src="/s1-logo.png" alt="S1" className="w-6 h-6" />
                <span className="font-medium text-sm">S1 AI Lab</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-8 px-2 text-xs">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </DialogHeader>

          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Start a conversation</p>
                <p className="text-sm">Ask me to create or modify a Discord bot for you.</p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-2xl px-4 py-2 max-w-[80%] text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                )}

                {message.role === "ai" && message.isCode && currentCodeVersion && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-2xl p-4 max-w-[90%] shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Discord Bot Generated</h4>
                          <span className="text-xs text-gray-500">v{currentCodeVersion.version}</span>
                        </div>

                        {usageInstructions && (
                          <div className="prose prose-sm max-w-none">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {usageInstructions}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Generation Card */}
            {(isGenerating || currentCodeVersion) && (
              <div className="sticky bottom-20 mx-auto max-w-md">
                <div className="bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-2xl p-4 shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {isGenerating ? "Generating..." : "Bot Ready"}
                      </span>
                      {isGenerating && <span className="text-xs text-gray-500">{Math.round(generationProgress)}%</span>}
                    </div>

                    {isGenerating && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    )}

                    {!isGenerating && currentCodeVersion && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowCodeViewer(true)}
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Show Code
                        </Button>
                        <Button
                          onClick={handleSavePlugin}
                          size="sm"
                          className="flex-1 h-8 text-xs bg-gray-900 hover:bg-gray-800"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-white/80 backdrop-blur-sm p-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the Discord bot you want to create..."
                  className="min-h-[44px] max-h-32 resize-none text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleGeneratePlugin()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleGeneratePlugin}
                disabled={isGenerating || !aiPrompt.trim()}
                size="sm"
                className="h-11 px-4 bg-blue-500 hover:bg-blue-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Code Viewer Modal */}
        {showCodeViewer && currentCodeVersion && (
          <Dialog open={showCodeViewer} onOpenChange={setShowCodeViewer}>
            <DialogContent className="max-w-4xl max-h-[80vh] p-0">
              <DialogHeader className="p-4 border-b bg-gray-900 text-white">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-sm font-medium">
                    Discord Bot Code - v{currentCodeVersion.version}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyToClipboard(currentCodeVersion.code)}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-white hover:bg-gray-800"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      onClick={downloadCode}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-white hover:bg-gray-800"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      onClick={() => setShowCodeViewer(false)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-0 max-h-[60vh] overflow-y-auto">
                <pre className="bg-gray-900 text-gray-100 p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                  {currentCodeVersion.code}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Save Dialog */}
        {!currentAIFunction && currentCodeVersion && (
          <Dialog open={false}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Save Discord Bot</DialogTitle>
                <DialogDescription>Give your bot a name and description to save it.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plugin-name">Bot Name</Label>
                  <Input
                    id="plugin-name"
                    value={pluginName}
                    onChange={(e) => setPluginName(e.target.value)}
                    placeholder="My Discord Bot"
                  />
                </div>
                <div>
                  <Label htmlFor="plugin-description">Description</Label>
                  <Textarea
                    id="plugin-description"
                    value={pluginDescription}
                    onChange={(e) => setPluginDescription(e.target.value)}
                    placeholder="What does this bot do?"
                  />
                </div>
                <div>
                  <Label htmlFor="plugin-thumbnail">Thumbnail URL (optional)</Label>
                  <Input
                    id="plugin-thumbnail"
                    value={pluginThumbnailUrl}
                    onChange={(e) => setPluginThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
