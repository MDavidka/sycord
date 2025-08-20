"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MessageSquare, Send, Eye, Save, Edit3, Loader2 } from "lucide-react"
import Image from "next/image"
import GenerationPipeline from "./generation-pipeline"
import type { UserAIFunction } from "@/lib/types"

// New interfaces for structured AI responses
interface PluginFile {
  fileName: string
  code: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  timestamp: Date
  type:
    | "user"
    | "ai_question" // [1] and general questions
    | "ai_plugin" // A container for the plugin card
    | "ai_missing_details" // [3]
    | "ai_out_of_scope" // [5]
    | "ai_usage_instructions" // [6]
    | "ai_follow_up_warning"
    | "ai_error"
  // For simple text content (e.g., user messages, questions, usage instructions)
  content: string
  // Optional structured data for plugins or missing details
  pluginName?: string
  pluginFiles?: PluginFile[]
  missingDetails?: string[]
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  currentAIFunction?: UserAIFunction | null
}

const parseAIResponse = (rawResponse: string): ChatMessage[] => {
  const messages: ChatMessage[] = []
  const timestamp = new Date()

  // Handle simple, exclusive responses first
  if (rawResponse.startsWith("[1]")) {
    messages.push({
      id: `msg_${Date.now()}`,
      role: "assistant",
      type: "ai_question",
      content: rawResponse.replace("[1]", "").trim(),
      timestamp,
    });
    return messages
  }

  if (rawResponse.startsWith("[W]")) {
    messages.push({
      id: `msg_${Date.now()}`,
      role: "assistant",
      type: "ai_follow_up_warning",
      content: rawResponse.replace("[W]", "").trim(),
      timestamp,
    });
    return messages
  }

  if (rawResponse.startsWith("[5]")) {
    messages.push({
      id: `msg_${Date.now()}`,
      role: "assistant",
      type: "ai_out_of_scope",
      content: rawResponse.replace("[5]", "").trim(),
      timestamp,
    })
    return messages
  }

  // Handle missing details request [3]
  const missingDetailsMatch = rawResponse.match(/\[3\](.*?)\[3\]/g)
  if (missingDetailsMatch) {
    const details = missingDetailsMatch.map((d) => d.replace(/\[3\]/g, ""))
    messages.push({
      id: `msg_${Date.now()}`,
      role: "assistant",
      type: "ai_missing_details",
      content: "I need a bit more information to create your plugin. Please provide the following details:",
      missingDetails: details,
      timestamp,
    })
    return messages
  }

  // Handle complex responses (plugin with optional usage instructions)
  const pluginNameMatch = rawResponse.match(/\[1\.1\](.*?)\[1\.1\]/s)
  const usageMatch = rawResponse.match(/\[6\](.*?)\[6\]/s)
  const singleCodeMatch = rawResponse.match(/\[2\]([\s\S]*?)\[2\]/s)
  const multiCodeMatches = Array.from(rawResponse.matchAll(/\[4\.(\d+)\]\s*(.*?)\n([\s\S]*?)(?=\n\[4\.|\s*$)/g))

  // A valid plugin response MUST have a name.
  if (pluginNameMatch) {
    const pluginName = pluginNameMatch[1].trim()

    if (usageMatch) {
      messages.push({
        id: `msg_${Date.now()}_usage`,
        role: "assistant",
        type: "ai_usage_instructions",
        content: usageMatch[1].trim(),
        timestamp,
      })
    }

    const pluginFiles: PluginFile[] = []
    if (singleCodeMatch) {
      const fileName = `${pluginName}.py`
      pluginFiles.push({ fileName: fileName, code: singleCodeMatch[1].trim() })
    } else if (multiCodeMatches.length > 0) {
      for (const match of multiCodeMatches) {
        pluginFiles.push({ fileName: match[2].trim(), code: match[3].trim() })
      }
    }

    if (pluginFiles.length > 0) {
      messages.push({
        id: `msg_${Date.now()}_plugin`,
        role: "assistant",
        type: "ai_plugin",
        content: `Plugin generated: ${pluginName}`,
        pluginName: pluginName,
        pluginFiles: pluginFiles,
        timestamp,
      })
    }
  }

  // If after all that, we have no messages, it might be a general question.
  if (messages.length === 0 && rawResponse.length > 0) {
    messages.push({
      id: `msg_${Date.now()}_question`,
      role: "assistant",
      type: "ai_question",
      content: rawResponse,
      timestamp,
    })
  } else if (messages.length === 0) {
    messages.push({
      id: `msg_${Date.now()}_error`,
      role: "assistant",
      type: "ai_error",
      content: "Sorry, I received an empty response. Please try again.",
      timestamp,
    })
  }

  return messages
}

export default function AIChat({ isOpen, onClose, currentAIFunction }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({})
  const [missingDetailsInput, setMissingDetailsInput] = useState<Record<string, Record<string, string>>>({})
  const [submittedDetails, setSubmittedDetails] = useState<string[]>([])

  // New state for the real pipeline
  const [pipelineState, setPipelineState] = useState({ active: false, step: 0 })
   const [pipelineArtifacts, setPipelineArtifacts] = useState({
    plan: "",
    rawCodeResponse: "",
    error: null as string | null,
  })
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Effect to manage the pipeline timer
  useEffect(() => {
    if (pipelineState.active) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsedTime(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [pipelineState.active])

  // --- Start of New Pipeline Logic ---

  const generatePlan = async (initialPrompt: string, history: ChatMessage[]) => {
    const response = await fetch("/api/ai/generate-plugin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: initialPrompt, mode: "plan", history, provider: "google" }),
    })
    if (!response.ok) throw new Error("Failed to generate plan")
    const plan = ((await response.json()).response) || ""
    if (!plan) throw new Error("AI failed to generate a plan.")
    return plan
  }

  const generateCode = async (plan: string, initialPrompt: string, history: ChatMessage[]) => {
    const message = `Based on the following plan, please generate the plugin code.\n\n**Plan:**\n${plan}\n\n**Original Request:**\n${initialPrompt}`
    const response = await fetch("/api/ai/generate-plugin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode: "code", history, provider: "google" }),
    })
    if (!response.ok) throw new Error("Failed to generate code")
    const rawCodeResponse = ((await response.json()).response) || ""
    if (!rawCodeResponse) throw new Error("AI failed to generate code.")
    return rawCodeResponse
  }

  const reviewCode = async (codeToReview: string, pluginName: string, history: ChatMessage[]) => {
    const message = `Plugin Name: ${pluginName}\n\nPlease review the following Python code:\n${codeToReview}`
    const response = await fetch("/api/ai/generate-plugin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode: "review", history, provider: "google" }),
    })
    if (!response.ok) throw new Error("Failed to review code")
    const rawReviewedResponse = ((await response.json()).response) || ""
    if (!rawReviewedResponse) throw new Error("AI failed to provide a review.")

    const reviewedCodeMatch = rawReviewedResponse.match(/\[2\]([\s\S]*?)\[2\]/s)
    const reviewedCode = reviewedCodeMatch ? reviewedCodeMatch[1].trim() : ""
    if (!reviewedCode) throw new Error("Review AI failed to return valid code.")

    return reviewedCode
  }

  const runGenerationPipeline = async (initialPrompt: string, history: ChatMessage[]) => {
    setPipelineState({ active: true, step: 1 })
    setIsGenerating(true)
    setPipelineArtifacts({ plan: "", rawCodeResponse: "", error: null })

    try {
      // Step 1: Generate Plan
      const plan = await generatePlan(initialPrompt, history)
      setPipelineArtifacts(prev => ({ ...prev, plan }))
      setPipelineState({ active: true, step: 2 })

      // Step 2: Generate Code
      const rawCodeResponse = await generateCode(plan, initialPrompt, history)
      setPipelineArtifacts(prev => ({ ...prev, rawCodeResponse }))
      const codeMessages = parseAIResponse(rawCodeResponse)

      const pluginMessage = codeMessages.find(m => m.type === 'ai_plugin')
      if (!pluginMessage) {
        // If the AI didn't return a plugin, just show what it did return and stop.
        setMessages(prev => [...prev, ...codeMessages])
        throw new Error("AI did not generate a plugin from the plan.")
      }

      setMessages(prev => [...prev, ...codeMessages])
      setPipelineState({ active: true, step: 3 })

      // Step 3: Review Code
      const codeToReview = pluginMessage?.pluginFiles?.[0]?.code
      const pluginName = pluginMessage?.pluginName
      if (!codeToReview || !pluginName) {
        throw new Error("Could not extract plugin details for review.")
      }

      const reviewedCode = await reviewCode(codeToReview, pluginName, history)
      setPipelineState({ active: true, step: 4 })

      // Update UI with reviewed code
      setMessages(prev => {
        const newMessages = [...prev]
        const pluginMsgIndex = newMessages.findIndex(m => m.id === pluginMessage.id)
        if (pluginMsgIndex !== -1) {
          const newPluginFile = { fileName: newMessages[pluginMsgIndex].pluginFiles[0].fileName, code: reviewedCode };
          newMessages[pluginMsgIndex].pluginFiles = [newPluginFile];
        }
        return newMessages
      })

    } catch (error) {
      console.error("Pipeline Error:", error)
      setPipelineArtifacts(prev => ({ ...prev, error: error.message }))
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}_error`,
          role: "assistant",
          type: "ai_error",
          content: `Sorry, an error occurred during generation: ${error.message}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setPipelineState({ active: true, step: 5 })
      await new Promise(resolve => setTimeout(resolve, 1500))
      setPipelineState({ active: false, step: 0 })
      setIsGenerating(false)
    }
  }

  // --- End of New Pipeline Logic ---

  const handleSendClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue
    if (!content.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      type: "user",
      content: content,
      timestamp: new Date(),
    }

    const currentHistory = messages.map(m => ({role: m.role, content: m.content}))

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    const isPluginRequest = ["make", "create", "build", "generate", "bot", "plugin"].some(keyword => content.toLowerCase().includes(keyword))

    if (isPluginRequest) {
      runGenerationPipeline(content, currentHistory)
    } else {
      setIsGenerating(true)
      try {
        const response = await fetch("/api/ai/generate-plugin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history: currentHistory, provider: "google" }),
        })
        if (!response.ok) throw new Error("API request failed")
        const data = await response.json()
        const newAiMessages = parseAIResponse(data.response || "")
        setMessages((prev) => [...prev, ...newAiMessages])
      } catch (error) {
        setMessages((prev) => [...prev, {
          id: `msg_${Date.now()}_error`, role: "assistant", type: "ai_error",
          content: "Sorry, I encountered an error.", timestamp: new Date()
        }])
      } finally {
        setIsGenerating(false)
      }
    }
  }

  const handleProvideDetails = (messageId: string) => {
    const details = missingDetailsInput[messageId]
    if (!details || Object.values(details).some((v) => !v)) {
      return
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.type === "user")?.content
    if (!lastUserMessage) return

    const detailsString = Object.entries(details)
      .map(([key, value]) => `${key}:${value}`)
      .join(", ")

    const followUpMessage = `I requested this feature before "${lastUserMessage}", but missed these details: ${detailsString}.`

    handleSendMessage(followUpMessage)
    setSubmittedDetails((prev) => [...prev, messageId])
  }

  const handleSavePlugin = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (message?.type !== "ai_plugin" || !message.pluginFiles || message.pluginFiles.length === 0) {
      return
    }

    const codeToSave = message.pluginFiles[0].code
    const usageInstructions = messages.find(
      (m) => m.type === "ai_usage_instructions" && m.timestamp < message.timestamp
    )?.content

    try {
      await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: message.pluginName || "Untitled Plugin",
          description: "AI Generated Plugin",
          code: codeToSave,
          usageInstructions: usageInstructions || "",
        }),
      })
    } catch (error) {
      console.error("Error saving plugin:", error)
    }
  }

  const handleBack = () => {
    if (messages.some((m) => m.type === "ai_plugin")) {
      setShowSavePrompt(true)
    } else {
      onClose()
    }
  }

  const handleNewChat = () => {
    setMessages([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="h-full w-full bg-[#101010]/95 backdrop-blur-xl text-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#101010]/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center justify-center">
            <div className="w-8 h-8 relative">
              <Image src="/s1-logo.png" alt="S1" width={32} height={32} className="object-contain" />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full bg-white/5"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-16 h-16 relative mb-4 opacity-50">
                <Image src="/s1-logo.png" alt="S1" width={64} height={64} className="object-contain" />
              </div>
              <p className="text-center text-lg font-medium mb-2">Welcome to S1 AI Lab</p>
              <p className="text-center opacity-75 max-w-md">
                Ask questions about Discord bots or request plugin creation
              </p>
            </div>
          ) : (
            messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[80%] bg-white/90 backdrop-blur-sm text-gray-900 rounded-2xl px-4 py-3 shadow-lg">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                )
              }

              // AI Messages
              switch (message.type) {
                case "ai_usage_instructions":
                case "ai_question":
                case "ai_out_of_scope":
                case "ai_error":
                case "ai_follow_up_warning":
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-[80%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  )

                case "ai_missing_details":
                  return (
                    <div
                      key={message.id}
                      className="flex justify-start w-full max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-col gap-3"
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.missingDetails?.map((detail) => (
                        <div key={detail}>
                          <label className="text-xs text-gray-400 mb-1 block">{detail}</label>
                          <Input
                            type="text"
                            disabled={submittedDetails.includes(message.id)}
                            value={missingDetailsInput[message.id]?.[detail] || ""}
                            onChange={(e) => {
                              setMissingDetailsInput((prev) => ({
                                ...prev,
                                [message.id]: {
                                  ...prev[message.id],
                                  [detail]: e.target.value,
                                },
                              }))
                            }}
                            className="bg-black/20 border-white/20"
                          />
                        </div>
                      ))}
                      <Button
                        onClick={() => handleProvideDetails(message.id)}
                        disabled={submittedDetails.includes(message.id)}
                        className="mt-2"
                      >
                        {submittedDetails.includes(message.id) ? "Details Submitted" : "Provide Details"}
                      </Button>
                    </div>
                  )

                case "ai_plugin":
                  const files = message.pluginFiles || []
                  const activeFile = activeTabs[message.id] || files[0]?.fileName
                  const code = files.find((f) => f.fileName === activeFile)?.code || ""

                  return (
                    <div
                      key={message.id}
                      className="max-w-[90%] bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg"
                    >
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🤖</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{message.pluginName}</h3>
                            <p className="text-xs text-gray-400">Complex Task</p>
                          </div>
                        </div>
                        <p className="text-sm mb-4 text-gray-300">{message.content}</p>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSavePlugin(message.id)}
                            className="text-white hover:bg-white/10 bg-white/5 h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {files.length > 0 && (
                        <div className="border-t border-white/10 bg-black/40">
                          {files.length > 1 && (
                            <div className="flex border-b border-white/10 px-2">
                              {files.map((file) => (
                                <button
                                  key={file.fileName}
                                  onClick={() => setActiveTabs((prev) => ({ ...prev, [message.id]: file.fileName }))}
                                  className={`px-3 py-2 text-xs ${
                                    activeFile === file.fileName
                                      ? "text-white border-b-2 border-white"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {file.fileName}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="p-4 max-h-96 overflow-y-auto">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{code}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                default:
                  return null
              }
            })
          )}

          {pipelineState.active ? (
            <div className="flex justify-start">
              <GenerationPipeline currentStep={pipelineState.step - 1} elapsedTime={elapsedTime} />
            </div>
          ) : isGenerating ? (
            <div className="flex justify-start">
              <div className="bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating response...</span>
                </div>
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <div className="relative z-20 border-t border-white/10 p-4 bg-[#101010]/40 backdrop-blur-sm">
          <div className="flex items-end space-x-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question or request a plugin..."
              className="flex-1 bg-[#101010]/60 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 text-white placeholder-gray-400 resize-none min-h-[40px] max-h-32 text-base focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ fontSize: "16px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button
              onClick={handleSendClick}
              onTouchEnd={handleSendClick}
              disabled={!inputValue.trim() || isGenerating}
              className="bg-white text-black hover:bg-gray-200 h-10 w-10 p-0 rounded-full flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showSavePrompt && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#101010]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Save Changes?</h3>
              <p className="text-gray-400 text-sm mb-4">
                You have unsaved plugins. Do you want to save them before leaving?
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowSavePrompt(false)
                    onClose()
                  }}
                  variant="ghost"
                  className="flex-1 text-white hover:bg-white/10"
                >
                  Don't Save
                </Button>
                <Button
                  onClick={() => setShowSavePrompt(false)}
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
