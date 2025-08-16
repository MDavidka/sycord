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
import { Package, Plus, Download, Trash2, Settings, Eye, EyeOff, Edit, Beaker } from "lucide-react"
import AIChat from "./ai-chat"

interface Plugin {
  _id: string
  name: string
  description: string
  iconUrl?: string
  thumbnailUrl?: string
  isActive: boolean
  created_at: string
}

interface UserPlugin {
  _id: string
  pluginId: string
  plugin: Plugin
  isActive: boolean
  installed_at: string
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
  updated_at: string
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

  const handleStartNewChat = () => {
    setCurrentAIFunction(null)
    setIsAICreatorOpen(true)
  }

  const handleEditAIFunction = (aiFunction: UserAIFunction) => {
    setCurrentAIFunction(aiFunction)
    setIsAICreatorOpen(true)
  }

  const handleSaveFunction = async (functionData: Partial<UserAIFunction>) => {
    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(functionData),
      })

      if (response.ok) {
        fetchUserAIFunctions()
      }
    } catch (error) {
      console.error("Error saving function:", error)
    }
  }

  const handleUpdateFunction = async (functionId: string, updates: Partial<UserAIFunction>) => {
    try {
      const response = await fetch("/api/user-ai-functions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ functionId, ...updates, action: "update" }),
      })

      if (response.ok) {
        fetchUserAIFunctions()
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

  const handleTogglePlugin = async (pluginId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId, isActive }),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ functionId }),
      })

      if (response.ok) {
        fetchUserAIFunctions()
      }
    } catch (error) {
      console.error("Error deleting function:", error)
    }
  }

  const isAdmin = session?.user?.email === "dmarton336@gmail.com"

  const [editPluginId, setEditPluginId] = useState<string | null>(null)
  const [editPluginName, setEditPluginName] = useState("")
  const [editPluginDescription, setEditPluginDescription] = useState("")
  const [editPluginActive, setEditPluginActive] = useState(false)
  const [editPluginIconUrl, setEditPluginIconUrl] = useState("")
  const [editPluginThumbnailUrl, setEditPluginThumbnailUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please sign in to access plugins.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plugins</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleStartNewChat}
            variant="outline"
            className="bg-white border-2 border-gray-200 hover:bg-gray-50"
          >
            <img src="/s1-logo.png" alt="S1" className="w-4 h-4 mr-2" />
            S1 AI Lab
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
                    placeholder="My Awesome Plugin"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPluginDescription}
                    onChange={(e) => setNewPluginDescription(e.target.value)}
                    placeholder="What does your plugin do?"
                  />
                </div>
                <div>
                  <Label htmlFor="iconUrl">Icon URL (optional)</Label>
                  <Input
                    id="iconUrl"
                    value={newPluginIconUrl}
                    onChange={(e) => setNewPluginIconUrl(e.target.value)}
                    placeholder="https://example.com/icon.png"
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
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
            <div className="text-center py-8">
              <p className="text-gray-500">Loading plugins...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map((plugin) => {
                const isInstalled = userPlugins.some((up) => up.pluginId === plugin._id)
                return (
                  <Card key={plugin._id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {plugin.iconUrl ? (
                          <img
                            src={plugin.iconUrl || "/placeholder.svg"}
                            alt={plugin.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{plugin.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {new Date(plugin.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{plugin.description}</p>
                      {plugin.thumbnailUrl && (
                        <img
                          src={plugin.thumbnailUrl || "/placeholder.svg"}
                          alt={plugin.name}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                      )}
                      <Button onClick={() => handleInstallPlugin(plugin._id)} disabled={isInstalled} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        {isInstalled ? "Installed" : "Install"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="created" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userAIFunctions.map((func) => (
              <Card key={func._id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {func.profileUrl ? (
                      <img
                        src={func.profileUrl || "/placeholder.svg"}
                        alt={func.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Beaker className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{func.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {new Date(func.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{func.description}</p>
                  {func.thumbnailUrl && (
                    <img
                      src={func.thumbnailUrl || "/placeholder.svg"}
                      alt={func.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => handleEditAIFunction(func)} variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteAIFunction(func._id)}
                      variant="outline"
                      size="sm"
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
              <Card key={userPlugin._id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {userPlugin.plugin.iconUrl ? (
                      <img
                        src={userPlugin.plugin.iconUrl || "/placeholder.svg"}
                        alt={userPlugin.plugin.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{userPlugin.plugin.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Installed {new Date(userPlugin.installed_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {userPlugin.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{userPlugin.plugin.description}</p>
                  {userPlugin.plugin.thumbnailUrl && (
                    <img
                      src={userPlugin.plugin.thumbnailUrl || "/placeholder.svg"}
                      alt={userPlugin.plugin.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor={`toggle-${userPlugin._id}`} className="text-sm">
                      {userPlugin.isActive ? "Active" : "Inactive"}
                    </Label>
                    <Switch
                      id={`toggle-${userPlugin._id}`}
                      checked={userPlugin.isActive}
                      onCheckedChange={(checked) => handleTogglePlugin(userPlugin.pluginId, checked)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      onClick={() => handleUninstallPlugin(userPlugin.pluginId)}
                      variant="outline"
                      size="sm"
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
        onClose={() => setIsAICreatorOpen(false)}
        currentAIFunction={currentAIFunction}
        onSaveFunction={handleSaveFunction}
        onUpdateFunction={handleUpdateFunction}
      />
    </div>
  )
}
