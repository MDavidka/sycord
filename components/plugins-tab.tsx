"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Download, Trash2, Settings, ExternalLink, Edit } from "lucide-react"
import AIChat from "./ai-chat"

interface Plugin {
  _id: string
  name: string
  description: string
  iconUrl: string
  thumbnailUrl: string
  downloadCount: number
  isInstalled?: boolean
}

interface UserPlugin {
  _id: string
  pluginId: string
  plugin: Plugin
  isEnabled: boolean
  installedAt: string
}

interface UserAIFunction {
  _id: string
  name: string
  description: string
  code: string
  usageInstructions: string
  profileUrl?: string
  thumbnailUrl?: string
  chatSessions?: any[]
  created_at: string
}

export default function PluginsTab() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("store")
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [userAIFunctions, setUserAIFunctions] = useState<UserAIFunction[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPluginName, setNewPluginName] = useState("")
  const [newPluginDescription, setNewPluginDescription] = useState("")
  const [newPluginIconUrl, setNewPluginIconUrl] = useState("")
  const [newPluginThumbnailUrl, setNewPluginThumbnailUrl] = useState("")
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
        setUserPlugins(data.installedPlugins)
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

  const handleSaveFunction = async (functionData: any) => {
    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(functionData),
      })

      if (response.ok) {
        fetchUserAIFunctions()
        handleCloseAICreator()
      }
    } catch (error) {
      console.error("Error saving function:", error)
    }
  }

  const handleUpdateFunction = async (functionData: any) => {
    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...functionData,
          action: "updateFunction",
        }),
      })

      if (response.ok) {
        fetchUserAIFunctions()
        handleCloseAICreator()
      }
    } catch (error) {
      console.error("Error updating function:", error)
    }
  }

  const handleInstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId, action: "install" }),
      })
      if (response.ok) {
        fetchUserPlugins()
        fetchPlugins()
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
        fetchPlugins()
      }
    } catch (error) {
      console.error("Error uninstalling plugin:", error)
    }
  }

  const handleTogglePlugin = async (userPluginId: string, isEnabled: boolean) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userPluginId, isEnabled }),
      })
      if (response.ok) {
        fetchUserPlugins()
      }
    } catch (error) {
      console.error("Error toggling plugin:", error)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plugins</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleStartNewChat}
            className="bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
          >
            <img src="/s1-logo.png" alt="S1" className="w-4 h-4 mr-2" />
            S1 AI Lab
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Plugin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Plugin</DialogTitle>
                <DialogDescription>Create a new plugin for the community to use.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Plugin Name</Label>
                  <Input
                    id="name"
                    value={newPluginName}
                    onChange={(e) => setNewPluginName(e.target.value)}
                    placeholder="Enter plugin name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPluginDescription}
                    onChange={(e) => setNewPluginDescription(e.target.value)}
                    placeholder="Describe what your plugin does"
                  />
                </div>
                <div>
                  <Label htmlFor="iconUrl">Icon URL</Label>
                  <Input
                    id="iconUrl"
                    value={newPluginIconUrl}
                    onChange={(e) => setNewPluginIconUrl(e.target.value)}
                    placeholder="https://example.com/icon.png"
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    value={newPluginThumbnailUrl}
                    onChange={(e) => setNewPluginThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/thumbnail.png"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePlugin}>Create Plugin</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="store">Plugin Store</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading plugins...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map((plugin) => (
                <Card key={plugin._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={plugin.iconUrl || "/placeholder.svg?height=40&width=40"}
                          alt={plugin.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <CardTitle className="text-lg">{plugin.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{plugin.downloadCount} downloads</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="mb-4">{plugin.description}</CardDescription>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleInstallPlugin(plugin._id)}
                        disabled={plugin.isInstalled}
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {plugin.isInstalled ? "Installed" : "Install"}
                      </Button>
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="created" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userAIFunctions.map((aiFunction) => (
              <Card key={aiFunction._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={aiFunction.profileUrl || "/placeholder.svg?height=40&width=40"}
                        alt={aiFunction.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <CardTitle className="text-lg">{aiFunction.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(aiFunction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">{aiFunction.description}</CardDescription>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEditAIFunction(aiFunction)} variant="outline" className="flex-1">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteAIFunction(aiFunction._id)}
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlugins.map((userPlugin) => (
              <Card key={userPlugin._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={userPlugin.plugin.iconUrl || "/placeholder.svg?height=40&width=40"}
                        alt={userPlugin.plugin.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <CardTitle className="text-lg">{userPlugin.plugin.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Installed {new Date(userPlugin.installedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={userPlugin.isEnabled}
                      onCheckedChange={(checked) => handleTogglePlugin(userPlugin._id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">{userPlugin.plugin.description}</CardDescription>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button
                      onClick={() => handleUninstallPlugin(userPlugin.plugin._id)}
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AIChat
        isOpen={isAICreatorOpen}
        onClose={handleCloseAICreator}
        currentAIFunction={currentAIFunction}
        onSaveFunction={handleSaveFunction}
        onUpdateFunction={handleUpdateFunction}
      />
    </div>
  )
}
