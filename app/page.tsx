"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, Edit, AlertCircle } from "lucide-react"
import { ChatMessage } from "@/components/chat-message"
import { PluginCard } from "@/components/plugin-card"
import { GenerationPipeline } from "@/components/generation-pipeline"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  marks?: {
    type: "question" | "plugin-name" | "code" | "missing-details" | "complex-task" | "out-of-scope" | "usage"
    content: string
    pluginName?: string
    missingDetails?: string[]
    files?: { name: string; content: string }[]
  }
}

interface Plugin {
  id: string
  name: string
  code: string
  deployed: boolean
  lastModified: Date
  usageInstructions?: string
}

export default function DiscordBotMaker() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Welcome to the Discord Bot Plugin Maker! I can help you create custom Discord bot plugins. What kind of bot functionality would you like to build?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPlugin, setCurrentPlugin] = useState<Plugin | null>(null)
  const [missingDetails, setMissingDetails] = useState<string[]>([])
  const [detailInputs, setDetailInputs] = useState<Record<string, string>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsGenerating(true)

    setTimeout(() => {
      const aiResponse = simulateAIResponse(inputValue)
      setMessages((prev) => [...prev, aiResponse])
      setIsGenerating(false)

      // Handle different mark types
      if (aiResponse.marks) {
        switch (aiResponse.marks.type) {
          case "plugin-name":
            // Start plugin creation
            const newPlugin: Plugin = {
              id: Date.now().toString(),
              name: aiResponse.marks.pluginName || "new-plugin",
              code: "",
              deployed: false,
              lastModified: new Date(),
            }
            setCurrentPlugin(newPlugin)
            break
          case "missing-details":
            setMissingDetails(aiResponse.marks.missingDetails || [])
            break
          case "code":
            if (currentPlugin) {
              const updatedPlugin = {
                ...currentPlugin,
                code: aiResponse.marks.content,
                lastModified: new Date(),
              }
              setCurrentPlugin(updatedPlugin)
            }
            break
        }
      }
    }, 1500)
  }

  const simulateAIResponse = (userInput: string): Message => {
    const lowerInput = userInput.toLowerCase()

    if (
      lowerInput.includes("question") ||
      lowerInput.includes("what") ||
      lowerInput.includes("how") ||
      lowerInput.includes("why")
    ) {
      if (!lowerInput.includes("bot") && !lowerInput.includes("plugin") && !lowerInput.includes("discord")) {
        return {
          id: Date.now().toString(),
          type: "ai",
          content: "This AI is only for plugin making.",
          timestamp: new Date(),
          marks: { type: "question", content: "This AI is only for plugin making." },
        }
      }
    }

    if (lowerInput.includes("ban") || lowerInput.includes("moderation")) {
      return {
        id: Date.now().toString(),
        type: "ai",
        content: "I'll create a bad word ban bot for you.",
        timestamp: new Date(),
        marks: {
          type: "plugin-name",
          content: "bad-word-ban-bot",
          pluginName: "bad-word-ban-bot",
        },
      }
    }

    return {
      id: Date.now().toString(),
      type: "ai",
      content:
        "I understand you want to create a Discord bot plugin. Could you provide more specific details about what functionality you need?",
      timestamp: new Date(),
      marks: {
        type: "missing-details",
        content: "Need more details",
        missingDetails: ["functionality-type", "commands-needed"],
      },
    }
  }

  const handleDetailSubmit = (detail: string, value: string) => {
    setDetailInputs((prev) => ({ ...prev, [detail]: value }))
  }

  const handleDeployPlugin = (plugin: Plugin) => {
    const deployedPlugin = { ...plugin, deployed: true }
    setPlugins((prev) => [...prev, deployedPlugin])
    setCurrentPlugin(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Discord Bot Plugin Maker</h1>
            </div>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              AI Powered
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Bot className="w-4 h-4 animate-pulse" />
                      <span>AI is thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {missingDetails.length > 0 && (
                  <div className="mb-4 p-4 bg-muted/20 rounded-lg border border-border">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Please provide these details:
                    </h4>
                    <div className="space-y-3">
                      {missingDetails.map((detail) => (
                        <div key={detail}>
                          <label className="text-sm font-medium capitalize">{detail.replace("-", " ")}</label>
                          <Input
                            placeholder={`Enter ${detail.replace("-", " ")}`}
                            value={detailInputs[detail] || ""}
                            onChange={(e) => handleDetailSubmit(detail, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe the Discord bot plugin you want to create..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isGenerating}
                  />
                  <Button onClick={handleSendMessage} disabled={isGenerating || !inputValue.trim()} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Current Plugin Card */}
            {currentPlugin && (
              <PluginCard plugin={currentPlugin} onDeploy={handleDeployPlugin} isGenerating={isGenerating} />
            )}

            {/* Generation Pipeline */}
            {isGenerating && <GenerationPipeline />}

            {/* Deployed Plugins */}
            {plugins.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Created Plugins</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plugins.map((plugin) => (
                    <div key={plugin.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <h4 className="font-medium">{plugin.name}</h4>
                        <p className="text-sm text-muted-foreground">{plugin.lastModified.toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
