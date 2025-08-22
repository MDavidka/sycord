"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Send, Bot, User, Code, HelpCircle, AlertTriangle, CheckCircle, X } from "lucide-react"
import type { AIPluginSession, AIPluginMessage, PipelineStep } from "@/lib/types"

export default function AIPluginChatPage() {
  const { data: session } = useSession()
  const [currentSession, setCurrentSession] = useState<AIPluginSession | null>(null)
  const [messages, setMessages] = useState<AIPluginMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pipeline, setPipeline] = useState<PipelineStep[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const createNewSession = async () => {
    if (!session?.user?.email) return

    try {
      const response = await fetch("/api/ai-plugin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSession",
          name: "New Discord Plugin",
          description: "AI-generated Discord Python cog",
        }),
      })

      const data = await response.json()
      if (data.session) {
        setCurrentSession(data.session)
        setPipeline(data.session.pipeline)
        setMessages([])

        // Add welcome message
        const welcomeMessage: AIPluginMessage = {
          id: `msg_${Date.now()}`,
          role: "ai",
          content:
            "Welcome to the Discord Plugin Generator! [1] What type of Discord plugin would you like to create today?",
          marks: [
            {
              type: "question",
              markNumber: 1,
              content: "What type of Discord plugin would you like to create today?",
              resolved: false,
            },
          ],
          timestamp: new Date().toISOString(),
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error("Error creating session:", error)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || !currentSession || isLoading) return

    const userMessage: AIPluginMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: inputValue,
      marks: [],
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Add message to session
      await fetch("/api/ai-plugin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addMessage",
          sessionId: currentSession.sessionId,
          message: userMessage,
        }),
      })

      // Generate AI response
      const aiResponse = await fetch("/api/ai-plugin-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: inputValue,
          context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
          step: pipeline[currentSession.currentStep]?.name || "Information",
          sessionId: currentSession.sessionId,
        }),
      })

      const aiData = await aiResponse.json()

      if (aiData.response) {
        const aiMessage: AIPluginMessage = {
          id: `msg_${Date.now() + 1}`,
          role: "ai",
          content: aiData.response,
          marks: aiData.marks || [],
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiMessage])

        // Add AI message to session
        await fetch("/api/ai-plugin-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addMessage",
            sessionId: currentSession.sessionId,
            message: aiMessage,
          }),
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMarkIcon = (type: string) => {
    switch (type) {
      case "question":
        return <HelpCircle className="w-3 h-3" />
      case "code":
        return <Code className="w-3 h-3" />
      case "missing_detail":
        return <AlertTriangle className="w-3 h-3" />
      case "confirmation":
        return <CheckCircle className="w-3 h-3" />
      case "error":
        return <X className="w-3 h-3" />
      default:
        return <HelpCircle className="w-3 h-3" />
    }
  }

  const getMarkClass = (type: string) => {
    switch (type) {
      case "question":
        return "mark-question"
      case "code":
        return "mark-code"
      case "missing_detail":
        return "mark-missing"
      case "confirmation":
        return "mark-confirmation"
      case "error":
        return "mark-error"
      default:
        return "mark-question"
    }
  }

  const renderMessage = (message: AIPluginMessage) => {
    const isUser = message.role === "user"

    return (
      <div
        key={message.id}
        className={`chat-message ${isUser ? "chat-message-user" : "chat-message-ai"} animate-slide-up`}
      >
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            {isUser ? (
              <>
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-[hsl(var(--chat-accent))]/20">
                <Bot className="w-4 h-4 text-[hsl(var(--chat-accent))]" />
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{isUser ? session?.user?.name || "You" : "AI Assistant"}</span>
              <span className="text-xs text-[hsl(var(--chat-muted))]">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>

            {message.marks && message.marks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {message.marks.map((mark, index) => (
                  <div key={index} className={`mark-indicator ${getMarkClass(mark.type)}`}>
                    {getMarkIcon(mark.type)}
                    <span className="ml-1">{mark.markNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="chat-container p-8 text-center">
          <CardContent>
            <p className="text-[hsl(var(--chat-muted))]">Please sign in to use the AI Plugin Generator</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <Card className="chat-container mb-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">AI Discord Plugin Generator</CardTitle>
                <p className="text-sm text-[hsl(var(--chat-muted))] mt-1">
                  Create powerful Discord Python cogs with AI assistance
                </p>
              </div>
              {!currentSession && (
                <Button
                  onClick={createNewSession}
                  className="bg-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/80"
                >
                  Start New Plugin
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Pipeline Status */}
        {currentSession && pipeline.length > 0 && (
          <Card className="chat-container mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Generation Pipeline</h3>
                <Badge variant="outline" className="text-xs">
                  Step {currentSession.currentStep + 1} of {pipeline.length}
                </Badge>
              </div>
              <div className="flex gap-2">
                {pipeline.map((step, index) => (
                  <div key={step.id} className="flex-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        step.status === "completed"
                          ? "bg-green-500"
                          : step.status === "in-progress"
                            ? "bg-[hsl(var(--chat-accent))] animate-pulse-glow"
                            : step.status === "error"
                              ? "bg-red-500"
                              : "bg-gray-700"
                      }`}
                    />
                    <p className="text-xs mt-1 text-center text-[hsl(var(--chat-muted))]">{step.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <Card className="chat-container flex-1 flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !currentSession ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-4">
                  <Bot className="w-16 h-16 mx-auto text-[hsl(var(--chat-accent))]" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Welcome to AI Plugin Generator</h3>
                    <p className="text-[hsl(var(--chat-muted))] mb-4">
                      Create powerful Discord Python cogs with AI assistance.
                      <br />
                      Click "Start New Plugin" to begin your journey.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="chat-message chat-message-ai animate-slide-up">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[hsl(var(--chat-accent))]/20">
                          <Bot className="w-4 h-4 text-[hsl(var(--chat-accent))] animate-pulse" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[hsl(var(--chat-accent))] rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-[hsl(var(--chat-accent))] rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-[hsl(var(--chat-accent))] rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                        <span className="text-sm text-[hsl(var(--chat-muted))]">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          {currentSession && (
            <>
              <Separator className="bg-[hsl(var(--chat-glass-border))]" />
              <div className="chat-input-area p-4">
                <div className="flex gap-3">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe your Discord plugin idea..."
                    className="flex-1 bg-[hsl(var(--chat-input))] border-[hsl(var(--chat-glass-border))] focus:border-[hsl(var(--chat-accent))] focus:ring-[hsl(var(--chat-accent))]/20"
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/80 px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-[hsl(var(--chat-muted))] mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
