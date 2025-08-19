"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, Code, MessageSquare } from "lucide-react"
import { PluginCard } from "@/components/plugin-card"
import { MissingDetailsForm } from "@/components/missing-details-form"
import { GenerationPipeline } from "@/components/generation-pipeline"
import { AIMarksParser, type ParsedAIResponse } from "@/lib/ai-marks-parser"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  parsedResponse?: ParsedAIResponse
}

interface GenerationStep {
  id: string
  icon: React.ComponentType<any>
  label: string
  status: "pending" | "active" | "completed"
}

interface PluginFile {
  name: string
  content: string
}

interface PluginCardData {
  id: string
  name: string
  code: string
  files?: PluginFile[]
  isDeployed: boolean
  isComplex?: boolean
  generationSteps?: GenerationStep[]
  usageInstructions?: string
}

export default function DiscordPluginCreator() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Welcome to the Discord Plugin Creator! I can help you build custom Discord bot plugins. What would you like to create?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [plugins, setPlugins] = useState<PluginCardData[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showMissingDetails, setShowMissingDetails] = useState<ParsedAIResponse | null>(null)
  const [showGenerationPipeline, setShowGenerationPipeline] = useState<{
    pluginName: string
    isComplex: boolean
  } | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const simulateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    // Simulate different response types based on input
    if (input.includes("what") || input.includes("how") || input.includes("?")) {
      if (input.includes("plugin") || input.includes("bot") || input.includes("discord")) {
        return AIMarksParser.generateSampleResponse("simple")
      } else {
        return "[1]This AI is only for plugin making."
      }
    }

    if (input.includes("complex") || input.includes("advanced") || input.includes("multi")) {
      return AIMarksParser.generateSampleResponse("complex")
    }

    if (input.includes("welcome") || input.includes("greeting")) {
      return AIMarksParser.generateSampleResponse("missing-details")
    }

    if (input.includes("unrelated") || input.includes("different")) {
      return "[5]If you want a whole new function, start a new chat."
    }

    return AIMarksParser.generateSampleResponse("simple")
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLastUserMessage(inputValue)
    const currentInput = inputValue
    setInputValue("")
    setIsGenerating(true)

    // Simulate AI processing
    setTimeout(() => {
      const aiResponseText = simulateAIResponse(currentInput)
      const parsedResponse = AIMarksParser.parseResponse(aiResponseText)

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponseText,
        timestamp: new Date(),
        parsedResponse,
      }

      setMessages((prev) => [...prev, aiMessage])

      // Handle different response types
      handleParsedResponse(parsedResponse)
      setIsGenerating(false)
    }, 1500)
  }

  const handleParsedResponse = (parsed: ParsedAIResponse) => {
    switch (parsed.type) {
      case "missing-details":
        setShowMissingDetails(parsed)
        break

      case "plugin":
      case "complex-task":
        if (parsed.pluginName) {
          setShowGenerationPipeline({
            pluginName: parsed.pluginName,
            isComplex: parsed.type === "complex-task",
          })
        }
        break

      case "question":
      case "out-of-scope":
        // These are handled as regular chat messages
        break
    }
  }

  const handleGenerationComplete = (code: string, files?: { name: string; content: string }[]) => {
    if (!showGenerationPipeline) return

    const newPlugin: PluginCardData = {
      id: Date.now().toString(),
      name: showGenerationPipeline.pluginName,
      code,
      files: files || [],
      isDeployed: false,
      isComplex: showGenerationPipeline.isComplex,
      usageInstructions: `Use the commands provided by ${showGenerationPipeline.pluginName} to interact with your Discord server.`,
    }

    setPlugins((prev) => [...prev, newPlugin])
    setShowGenerationPipeline(null)
  }

  const handleMissingDetailsSubmit = (details: { [key: string]: string }) => {
    const detailsText = Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")

    const followUpMessage = AIMarksParser.formatMissingDetailsRequest(Object.keys(details), lastUserMessage)

    // Add user's details as a message
    const detailsMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: `${followUpMessage} Details: ${detailsText}`,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, detailsMessage])
    setShowMissingDetails(null)

    // Generate plugin with the provided details
    setTimeout(() => {
      const responseText = AIMarksParser.generateSampleResponse("simple")
      const parsed = AIMarksParser.parseResponse(responseText)

      const aiMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: "ai",
        content: responseText,
        timestamp: new Date(),
        parsedResponse: parsed,
      }

      setMessages((prev) => [...prev, aiMessage])
      handleParsedResponse(parsed)
    }, 1000)
  }

  const handleMissingDetailsCancel = () => {
    setShowMissingDetails(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeploy = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((plugin) =>
        plugin.id === pluginId ? { ...plugin, isDeployed: true, generationSteps: undefined } : plugin,
      ),
    )
  }

  const handleEdit = (pluginId: string) => {
    console.log("Editing plugin:", pluginId)
    // In a real implementation, this would open an editor
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">Discord Plugin Creator</h1>
            <Badge variant="secondary" className="ml-auto">
              AI Powered
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Chat Interface */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {/* Regular chat message */}
                      <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} mb-2`}>
                        <div
                          className={`chat-bubble ${message.type === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}
                        >
                          {message.parsedResponse?.message ||
                            (message.parsedResponse?.type === "plugin" ||
                            message.parsedResponse?.type === "complex-task"
                              ? `Creating ${message.parsedResponse.pluginName} plugin...`
                              : message.content)}
                        </div>
                      </div>

                      {/* Usage instructions */}
                      {message.parsedResponse?.usageInstructions && (
                        <div className="flex justify-start mb-2">
                          <div className="chat-bubble chat-bubble-ai bg-blue-50 border border-blue-200">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-blue-800">{message.parsedResponse.usageInstructions}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="chat-bubble chat-bubble-ai">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                          Generating plugin...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Details Form */}
                  {showMissingDetails && (
                    <div className="mb-4">
                      <MissingDetailsForm
                        details={showMissingDetails.missingDetails || []}
                        pluginName={showMissingDetails.pluginName}
                        onSubmit={handleMissingDetailsSubmit}
                        onCancel={handleMissingDetailsCancel}
                      />
                    </div>
                  )}

                  {showGenerationPipeline && (
                    <div className="mb-4">
                      <GenerationPipeline
                        pluginName={showGenerationPipeline.pluginName}
                        isComplex={showGenerationPipeline.isComplex}
                        onComplete={handleGenerationComplete}
                      />
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe the Discord plugin you want to create..."
                    className="flex-1"
                    disabled={!!showMissingDetails || !!showGenerationPipeline}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isGenerating || !!showMissingDetails || !!showGenerationPipeline}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plugin Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Generated Plugins</h2>
            {plugins.length === 0 ? (
              <Card className="plugin-card">
                <CardContent className="text-center py-8">
                  <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No plugins created yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start a conversation to generate your first Discord bot plugin
                  </p>
                </CardContent>
              </Card>
            ) : (
              plugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  id={plugin.id}
                  name={plugin.name}
                  code={plugin.code}
                  files={plugin.files}
                  isDeployed={plugin.isDeployed}
                  isComplex={plugin.isComplex}
                  generationSteps={plugin.generationSteps}
                  usageInstructions={plugin.usageInstructions}
                  onDeploy={handleDeploy}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
