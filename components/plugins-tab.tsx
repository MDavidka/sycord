"use client"

import { useState } from "react"
import type { UserAIFunction } from "@/lib/types"
import PluginManager from "./plugin-manager"
import AIChat from "./ai-chat"

interface PluginsTabProps {
  serverId?: string
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

export default function PluginsTab({ serverId, activeTab, setActiveTab }: PluginsTabProps) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [currentAIFunction, setCurrentAIFunction] = useState<UserAIFunction | null>(null)

  const handleStartNewChat = () => {
    setCurrentAIFunction(null)
    setIsAIChatOpen(true)
  }

  const handleEditAIFunction = (aiFunction: UserAIFunction) => {
    setCurrentAIFunction(aiFunction)
    setIsAIChatOpen(true)
  }

  const handleCloseAIChat = () => {
    setIsAIChatOpen(false)
    setCurrentAIFunction(null)
  }

  return (
    <>
      <PluginManager onStartAIChat={handleStartNewChat} onEditAIFunction={handleEditAIFunction} />

      <AIChat isOpen={isAIChatOpen} onClose={handleCloseAIChat} currentAIFunction={currentAIFunction} />
    </>
  )
}
