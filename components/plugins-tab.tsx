"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Download, Check, Code } from "lucide-react"
import Image from "next/image"
import type { Plugin, UserPlugin, UserAIFunction } from "@/lib/types"
import AIChat from "./ai-chat"

interface PluginsTabProps {
  serverId?: string
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

export default function PluginsTab() {
  const { data: session } = useSession()

  // Plugin state
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [userAIFunctions, setUserAIFunctions] = useState<UserAIFunction[]>([])
  const [loading, setLoading] = useState(false)

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Create plugin form
  const [newPluginName, setNewPluginName] = useState("")
  const [newPluginDescription, setNewPluginDescription] = useState("")
  const [newPluginIconUrl, setNewPluginIconUrl] = useState("")
  const [newPluginThumbnailUrl, setNewPluginThumbnailUrl] = useState("")

  // Edit plugin form
  const [editPluginId, setEditPluginId] = useState("")
  const [editPluginName, setEditPluginName] = useState("")
  const [editPluginDescription, setEditPluginDescription] = useState("")
  const [editPluginIconUrl, setEditPluginIconUrl] = useState("")
  const [editPluginThumbnailUrl, setEditPluginThumbnailUrl] = useState("")

  // AI Chat state
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false)
  const [currentAIFunction, setCurrentAIFunction] = useState<UserAIFunction | null>(null)

  useEffect(() => {
    fetchPlugins()
    fetchUserPlugins()
    fetchUserAIFunctions()
  }, [])

  const fetchPlugins = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/plugins")
      if (response.ok) {
        const data = await response.json()
        setPlugins(data.plugins)
      }
    } catch (error) {
      console.error("Error fetching plugins:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPlugins = async () => {
    try {
      const response = await fetch("/api/user-plugins")
      if (response.ok) {
        const data = await response.json()
        setUserPlugins(data.userPlugins)
      }
    } catch (error) {
      console.error("Error fetching user plugins:", error)
    }
  }

  const fetchUserAIFunctions = async () => {
    try {
      const response = await fetch("/api/user-ai-functions")
      if (response.ok) {
        const data = await response.json()
        setUserAIFunctions(data.functions)
      }
    } catch (error) {
      console.error("Error fetching user AI functions:", error)
    }
  }

  const handleCreatePlugin = async () => {
    try {
      const response = await fetch("/api/plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPluginName,
          description: newPluginDescription,
          iconUrl: newPluginIconUrl,
          thumbnailUrl: newPluginThumbnailUrl,
        }),
      })
      if (response.ok) {
        setNewPluginName("")
        setNewPluginDescription("")
        setNewPluginIconUrl("")
        setNewPluginThumbnailUrl("")
        setIsCreateDialogOpen(false)
        fetchPlugins()
      }
    } catch (error) {
      console.error("Error creating plugin:", error)
    }
  }

  const handleEditAIFunction = async (aiFunction: UserAIFunction) => {
    setCurrentAIFunction(aiFunction)
    setIsAICreatorOpen(true)
  }

  const handleStartNewChat = () => {
    setCurrentAIFunction(null)
    setIsAICreatorOpen(true)
  }

  const handleCloseAICreator = () => {
    setIsAICreatorOpen(false)
    setCurrentAIFunction(null)
  }

  const handleInstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId }),
      })
      if (response.ok) {
        fetchUserPlugins()
      }
    } catch (error) {
      console.error("Error installing plugin:", error)
    }
  }

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId }),
      })
      if (response.ok) {
        fetchUserPlugins()
      }
    } catch (error) {
      console.error("Error uninstalling plugin:", error)
    }
  }

  const handleDeleteAIFunction = async (functionId: string) => {
    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ functionId }),
      })
      if (response.ok) {
        fetchUserAIFunctions()
      }
    } catch (error) {
      console.error("Error deleting AI function:", error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800/50">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Plugin Manager</h1>
          <p className="text-gray-400 text-sm sm:text-base">Discover, install, and manage your Discord bot plugins</p>
        </div>
        <Button
          onClick={handleStartNewChat}
          className="bg-white hover:bg-gray-100 text-black font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          <Image src="/s1-logo.png" alt="S1" width={20} height={20} className="rounded" />
          S1 AI Lab
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="store" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 sm:px-6 pt-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/60 backdrop-blur-sm rounded-xl h-12">
            <TabsTrigger
              value="store"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black py-3 text-sm sm:text-base font-medium rounded-lg transition-all"
            >
              <Package className="h-4 w-4 mr-2" />
              Plugin Store
            </TabsTrigger>
            <TabsTrigger
              value="created"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black py-3 text-sm sm:text-base font-medium rounded-lg transition-all"
            >
              <Code className="h-4 w-4 mr-2" />
              Created
            </TabsTrigger>
            <TabsTrigger
              value="installed"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black py-3 text-sm sm:text-base font-medium rounded-lg transition-all"
            >
              <Check className="h-4 w-4 mr-2" />
              Installed
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Plugin Store Tab */}
        <TabsContent value="store" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {plugins.map((plugin) => (
              <Card key={plugin._id} className="glass-card flex flex-col h-full min-h-[280px] sm:min-h-[320px]">
                {/* ... existing plugin card content ... */}
                <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5">
                  <CardDescription className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-3 leading-relaxed">
                    {plugin.description}
                  </CardDescription>
                  <Button
                    onClick={() => handleInstallPlugin(plugin._id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-3 rounded-lg transition-all duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Install Plugin
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Created Tab */}
        <TabsContent value="created" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
          {userAIFunctions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
              <Code className="h-16 w-16 mb-6 opacity-50" />
              <p className="text-center text-base sm:text-lg font-medium mb-2">No AI functions created yet.</p>
              <p className="text-center text-sm sm:text-base opacity-75 mb-6">
                Use S1 AI Lab to create your first Discord bot!
              </p>
              <Button
                onClick={handleStartNewChat}
                className="bg-white hover:bg-gray-100 text-black font-medium px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Image src="/s1-logo.png" alt="S1" width={20} height={20} className="rounded" />
                Start Creating
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {userAIFunctions.map((aiFunction) => (
                <Card key={aiFunction._id} className="glass-card flex flex-col h-full min-h-[280px] sm:min-h-[320px]">
                  {/* ... existing AI function card content ... */}
                  <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5">
                    <CardDescription className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-3 leading-relaxed">
                      {aiFunction.description}
                    </CardDescription>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAIFunction(aiFunction)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAIFunction(aiFunction._id?.toString() || "")}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Installed Tab */}
        <TabsContent value="installed" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
          {/* ... existing installed plugins content ... */}
        </TabsContent>
      </Tabs>

      {/* AI Chat Component */}
      <AIChat
        isOpen={isAICreatorOpen}
        onClose={handleCloseAICreator}
        currentAIFunction={currentAIFunction}
        onSave={fetchUserAIFunctions}
      />

      {/* ... existing dialogs ... */}
    </div>
  )
}
