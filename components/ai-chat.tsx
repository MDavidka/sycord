"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Send, ArrowLeft, Plus, Eye, Copy, Save, Edit, Pin, Trash2, 
  Moon, Sun, Menu, X, RotateCw, Check, ChevronLeft, ChevronRight 
} from "lucide-react"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/atom-one-dark.css"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  role: "user" | "ai"
  content: string
  timestamp: Date
  isCode?: boolean
  code?: string
  language?: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  lastUpdated: Date
}

export default function ChatInterface() {
  // State management
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeMessageActions, setActiveMessageActions] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Initialize with sample data
  useEffect(() => {
    const sampleConversation: Conversation = {
      id: "1",
      title: "Python Discord Bot",
      messages: [
        {
          id: "1-1",
          role: "ai",
          content: "Hello! I'm your coding assistant. How can I help you today?",
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          id: "1-2",
          role: "user",
          content: "Create a Python function to calculate Fibonacci sequence",
          timestamp: new Date(Date.now() - 1800000)
        },
        {
          id: "1-3",
          role: "ai",
          content: "Here's the Fibonacci function:",
          isCode: true,
          code: `def fibonacci(n):
    """Calculate Fibonacci sequence up to n terms"""
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])
    return sequence`,
          language: "python",
          timestamp: new Date()
        }
      ],
      lastUpdated: new Date()
    }
    
    setConversations([sampleConversation])
    setActiveConversation(sampleConversation)
  }, [])
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [inputValue])
  
  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])
  
  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages, scrollToBottom])
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }
  
  // Create new conversation
  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      lastUpdated: new Date()
    }
    
    setConversations([newConversation, ...conversations])
    setActiveConversation(newConversation)
  }
  
  // Send message
  const sendMessage = () => {
    if (!inputValue.trim() || !activeConversation) return
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date()
    }
    
    const updatedConversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, newMessage],
      lastUpdated: new Date()
    }
    
    setActiveConversation(updatedConversation)
    setConversations(conversations.map(c => 
      c.id === activeConversation.id ? updatedConversation : c
    ))
    setInputValue("")
    
    // Simulate AI response
    setIsGenerating(true)
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: "Here's the solution to your request:",
        timestamp: new Date(),
        isCode: true,
        code: `# Generated solution
def solution():
    """AI-generated code based on your request"""
    print("Hello World!")
    return "Success"`,
        language: "python"
      }
      
      const updatedWithAI = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiResponse],
        lastUpdated: new Date()
      }
      
      setActiveConversation(updatedWithAI)
      setConversations(conversations.map(c => 
        c.id === activeConversation.id ? updatedWithAI : c
      ))
      setIsGenerating(false)
    }, 2000)
  }
  
  // Regenerate last response
  const regenerateResponse = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return
    
    const lastMessage = activeConversation.messages[activeConversation.messages.length - 1]
    if (lastMessage.role !== "ai") return
    
    setIsGenerating(true)
    setTimeout(() => {
      const updatedMessages = [...activeConversation.messages.slice(0, -1)]
      const aiResponse: Message = {
        ...lastMessage,
        id: `ai-${Date.now()}`,
        content: "Here's an improved version:",
        timestamp: new Date(),
        code: `# Improved solution
def improved_solution():
    """Better implementation based on your request"""
    return "Enhanced Success"`
      }
      
      const updatedConversation = {
        ...activeConversation,
        messages: [...updatedMessages, aiResponse],
        lastUpdated: new Date()
      }
      
      setActiveConversation(updatedConversation)
      setConversations(conversations.map(c => 
        c.id === activeConversation.id ? updatedConversation : c
      ))
      setIsGenerating(false)
    }, 2000)
  }
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(convo => 
    convo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    convo.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.2 }}
            className={`w-64 md:w-72 flex flex-col border-r ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <div className="p-4 border-b border-gray-700">
              <button
                onClick={createNewConversation}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                <Plus size={16} />
                <span>New Conversation</span>
              </button>
              
              <div className="mt-4 relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-2 pl-10 pr-4 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-200 text-gray-900 placeholder-gray-500'}`}
                />
                <div className="absolute left-3 top-2.5">
                  <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                <h3 className="px-2 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">Conversations</h3>
                <ul className="space-y-1">
                  {filteredConversations.map(conversation => (
                    <li key={conversation.id}>
                      <button
                        onClick={() => setActiveConversation(conversation)}
                        className={`w-full text-left p-2 rounded-lg flex items-center ${activeConversation?.id === conversation.id 
                          ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-300') 
                          : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200')}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{conversation.title}</p>
                          {conversation.messages.length > 0 && (
                            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {conversation.messages[0].content.substring(0, 50)}
                              {conversation.messages[0].content.length > 50 ? "..." : ""}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {format(conversation.lastUpdated, 'MMM dd')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-3 p-2 rounded-lg w-full hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="p-2 mr-2 rounded-lg hover:bg-gray-700 transition-colors md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="font-bold text-white">AI</span>
              </div>
              <h1 className="ml-3 text-xl font-bold">Code Assistant</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        
        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto p-4 ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-gray-50 to-gray-100'}`}
        >
          {activeConversation?.messages.length ? (
            <div className="max-w-3xl mx-auto space-y-6 pb-24">
              {activeConversation.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`group relative rounded-2xl p-4 max-w-[85%] ${message.role === 'user' ? 'ml-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white' : isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}
                  onMouseEnter={() => setActiveMessageActions(message.id)}
                  onMouseLeave={() => setActiveMessageActions(null)}
                >
                  <div className="prose prose-invert max-w-none">
                    {message.isCode && message.code ? (
                      <div className="mt-3">
                        <ReactMarkdown
                          rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
                          components={{
                            pre: ({ node, ...props }) => (
                              <div className="relative">
                                <pre {...props} className="rounded-lg text-sm" />
                                <button
                                  onClick={() => copyToClipboard(message.code || '')}
                                  className={`absolute top-2 right-2 p-1.5 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                            )
                          }}
                        >
                          {`\`\`\`${message.language || 'python'}\n${message.code}\n\`\`\``}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" />
                          ),
                          code: ({ node, ...props }) => (
                            <code {...props} className="px-1 py-0.5 rounded bg-gray-700 text-pink-400" />
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  
                  <div className={`mt-2 text-xs flex items-center ${message.role === 'user' ? 'text-blue-200' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {format(message.timestamp, 'hh:mm a')}
                  </div>
                  
                  {activeMessageActions === message.id && (
                    <div className={`absolute top-3 right-3 flex gap-1 ${message.role === 'user' ? 'bg-blue-800' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} p-1 rounded-lg`}>
                      <button className="p-1.5 rounded-md hover:bg-gray-600 transition-colors" title="Copy">
                        <Copy size={16} />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-gray-600 transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-gray-600 transition-colors" title="Pin">
                        <Pin size={16} />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-red-500 transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-2xl p-4 max-w-[85%] ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}
                >
                  <div className="flex items-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="ml-2 text-gray-400">Thinking...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="mb-6 w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center">
                <div className="text-4xl font-bold text-white">AI</div>
              </div>
              <h2 className="text-3xl font-bold mb-4">How can I help you today?</h2>
              <p className="text-lg max-w-md mx-auto mb-8">
                Describe what you want to create and I'll generate the code for you.
              </p>
              <button
                onClick={createNewConversation}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Start a Conversation
              </button>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className={`sticky bottom-0 p-4 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="max-w-3xl mx-auto">
            {activeConversation?.messages.length && !isGenerating && (
              <div className="flex justify-center mb-3">
                <button
                  onClick={regenerateResponse}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <RotateCw size={16} />
                  <span>Regenerate Response</span>
                </button>
              </div>
            )}
            
            <div className={`relative rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Message Code Assistant..."
                className={`w-full py-3 pl-4 pr-12 resize-none focus:outline-none ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                rows={1}
                style={{ minHeight: '56px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isGenerating}
                className={`absolute right-3 bottom-3 p-1.5 rounded-lg ${!inputValue.trim() || isGenerating 
                  ? (isDarkMode ? 'text-gray-500' : 'text-gray-400') 
                  : (isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')} transition-colors`}
              >
                <Send size={20} />
              </button>
            </div>
            
            <div className="mt-2 text-center text-sm text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}