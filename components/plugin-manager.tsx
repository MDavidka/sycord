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
import { Package, Plus, Download, Check, X, Edit, Trash2, ImageIcon, Code, Beaker } from "lucide-react"
import Image from "next/image"
import type { Plugin, UserPlugin, UserAIFunction } from "@/lib/types"

interface PluginManagerProps {
  onStartAIChat: () => void
  onEditAIFunction: (aiFunction: UserAIFunction) => void
}

export default function PluginManager({ onStartAIChat, onEditAIFunction }: PluginManagerProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.email === "dmarton336@gmail.com"

  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [userAIFunctions, setUserAIFunctions] = useState<UserAIFunction[]>([])
  const [loading, setLoading] = useState(true)
  const [newPluginName, setNewPluginName] = useState("")
  const [newPluginDescription, setNewPluginDescription] = useState("")
  const [newPluginIconUrl, setNewPluginIconUrl] = useState("")
  const [newPluginThumbnailUrl, setNewPluginThumbnailUrl] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [editPluginId, setEditPluginId] = useState<string | null>(null)
  const [editPluginName, setEditPluginName] = useState("")
  const [editPluginDescription, setEditPluginDescription] = useState("")
  const [editPluginActive, setEditPluginActive] = useState(false)
  const [editPluginIconUrl, setEditPluginIconUrl] = useState("")
  const [editPluginThumbnailUrl, setEditPluginThumbnailUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

  const handleDeletePlugin = async (pluginId: string) => {
    try {
      const response = await fetch(`/api/plugins/${pluginId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchPlugins()
      }
    } catch (error) {
      console.error("Error deleting plugin:", error)
    }
  }

  const handleUpdatePlugin = async () => {
    if (!editPluginId) return
    try {
      const response = await fetch(`/api/plugins/${editPluginId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editPluginName,
          description: editPluginDescription,
          active: editPluginActive,
          iconUrl: editPluginIconUrl,
          thumbnailUrl: editPluginThumbnailUrl,
        }),
      })
      if (response.ok) {
        setIsEditDialogOpen(false)
        setEditPluginId(null)
        fetchPlugins()
      }
    } catch (error) {
      console.error("Error updating plugin:", error)
    }
  }

  const handleDeleteAIFunction = async (functionId: string) => {
    try {
      const response = await fetch(`/api/user-ai-functions/${functionId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchUserAIFunctions()
      }
    } catch (error) {
      console.error("Error deleting AI function:", error)
    }
  }

  const isPluginInstalled = (pluginId: string) => userPlugins.some((p) => p.pluginId === pluginId)

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p>Loading plugins...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-black text-white">
        <div className="p-4 sm:p-6 border-b border-white/20 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
            <Package className="h-6 w-6 sm:h-7 sm:w-7 mr-3" />
            <span className="hidden sm:inline">Plugin Management</span>
            <span className="sm:hidden">Plugins</span>
          </h1>
          <div className="flex space-x-3">
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black hover:bg-gray-200 h-11 px-4 sm:px-6 text-sm sm:text-base font-medium">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Plugin</span>
                    <span className="sm:hidden ml-1">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[500px] bg-black border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white text-lg">Create New Plugin</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Fill in the details for your new plugin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                      <Label htmlFor="name" className="sm:text-right text-white font-medium">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newPluginName}
                        onChange={(e) => setNewPluginName(e.target.value)}
                        className="sm:col-span-3 bg-black/60 border-white/20 text-white h-10 sm:h-11"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-3 sm:gap-4">
                      <Label htmlFor="description" className="sm:text-right text-white font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newPluginDescription}
                        onChange={(e) => setNewPluginDescription(e.target.value)}
                        className="sm:col-span-3 bg-black/60 border-white/20 text-white min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreatePlugin}
                      className="bg-white text-black hover:bg-gray-200 w-full sm:w-auto h-11 px-6 font-medium"
                    >
                      Create Plugin
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              onClick={onStartAIChat}
              className="w-full bg-white text-black hover:bg-gray-100 transition-all duration-200 h-12 font-medium shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 relative">
                  <Image src="/s1-logo.png" alt="S1" width={20} height={20} className="object-contain" />
                </div>
                <span>S1 AI Lab</span>
              </div>
            </Button>
          </div>
        </div>

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

          <TabsContent value="store" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {plugins.map((plugin) => (
                <Card key={plugin._id} className="glass-card flex flex-col h-full min-h-[280px] sm:min-h-[320px]">
                  {plugin.thumbnailUrl ? (
                    <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden">
                      <Image
                        src={plugin.thumbnailUrl || "/placeholder.svg"}
                        alt={`${plugin.name} thumbnail`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    </div>
                  )}
                  <CardHeader className="flex-row items-center space-x-3 pb-3 p-4 sm:p-5">
                    {plugin.iconUrl ? (
                      <Image
                        src={plugin.iconUrl || "/placeholder.svg"}
                        alt={`${plugin.name} icon`}
                        width={36}
                        height={36}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-white text-base sm:text-lg truncate font-semibold">
                        {plugin.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm truncate">
                        By {plugin.author || "Unknown"}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4 px-4 sm:px-5 flex-1 flex flex-col">
                    <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-3 flex-1 leading-relaxed">
                      {plugin.description}
                    </p>
                    <div className="flex justify-between items-center">
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditPluginId(plugin._id)
                              setEditPluginName(plugin.name)
                              setEditPluginDescription(plugin.description)
                              setEditPluginActive(plugin.active)
                              setEditPluginIconUrl(plugin.iconUrl || "")
                              setEditPluginThumbnailUrl(plugin.thumbnailUrl || "")
                              setIsEditDialogOpen(true)
                            }}
                            className="h-10 w-10 p-0 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePlugin(plugin._id)}
                            className="h-10 w-10 p-0 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleInstallPlugin(plugin._id)}
                        disabled={isPluginInstalled(plugin._id)}
                        className={`h-10 px-4 text-sm font-medium transition-all ${
                          isPluginInstalled(plugin._id)
                            ? "bg-green-600 text-white cursor-not-allowed"
                            : "bg-white text-black hover:bg-gray-200"
                        }`}
                      >
                        {isPluginInstalled(plugin._id) ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Installed
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Install
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="created" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
            {userAIFunctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                <Code className="h-16 w-16 mb-6 opacity-50" />
                <p className="text-center text-base sm:text-lg font-medium mb-2">No AI functions created yet.</p>
                <p className="text-center text-sm sm:text-base opacity-75">
                  Use S1 AI Lab to create your first function!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {userAIFunctions.map((aiFunction) => (
                  <div key={aiFunction._id} className="glass-card p-4 sm:p-6 rounded-xl">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {aiFunction.thumbnailUrl ? (
                          <Image
                            src={aiFunction.thumbnailUrl || "/placeholder.svg"}
                            alt={aiFunction.name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <Beaker className="h-5 w-5 text-black" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-white font-semibold text-base sm:text-lg">{aiFunction.name}</h3>
                          <p className="text-gray-400 text-sm">
                            Created {new Date(aiFunction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{aiFunction.description}</p>
                    <div className="flex justify-between space-x-2">
                      <button
                        onClick={() => onEditAIFunction(aiFunction)}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex-1"
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
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="installed" className="flex-1 overflow-auto p-4 sm:p-6 mt-2">
            {userPlugins.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                <Package className="h-16 w-16 mb-6 opacity-50" />
                <p className="text-center text-base sm:text-lg font-medium mb-2">No plugins installed yet.</p>
                <p className="text-center text-sm sm:text-base opacity-75">Browse the Plugin Store to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {userPlugins.map((plugin) => (
                  <Card
                    key={plugin.pluginId}
                    className="glass-card flex flex-col h-full min-h-[280px] sm:min-h-[320px]"
                  >
                    {plugin.thumbnailUrl ? (
                      <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden">
                        <Image
                          src={plugin.thumbnailUrl || "/placeholder.svg"}
                          alt={`${plugin.name} thumbnail`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-t-lg"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-32 sm:h-36 rounded-t-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                    <CardHeader className="flex-row items-center space-x-3 pb-3 p-4 sm:p-5">
                      {plugin.iconUrl ? (
                        <Image
                          src={plugin.iconUrl || "/placeholder.svg"}
                          alt={`${plugin.name} icon`}
                          width={36}
                          height={36}
                          className="rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                          <Beaker className="h-5 w-5 text-black" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-white text-base sm:text-lg truncate font-semibold">
                          {plugin.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-sm truncate">
                          Installed {new Date(plugin.installed_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 px-4 sm:px-5 flex-1 flex flex-col">
                      <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-3 flex-1 leading-relaxed">
                        {plugin.description}
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditPluginId(plugin.pluginId)
                            onStartAIChat()
                          }}
                          className="h-10 w-10 p-0 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
                        >
                          <Beaker className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUninstallPlugin(plugin.pluginId)}
                          className="h-10 px-4 text-sm font-medium transition-all"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[500px] bg-black border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">Edit Plugin</DialogTitle>
              <DialogDescription className="text-gray-400">Update plugin details and settings.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                <Label htmlFor="edit-name" className="sm:text-right text-white font-medium">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editPluginName}
                  onChange={(e) => setEditPluginName(e.target.value)}
                  className="sm:col-span-3 bg-black/60 border-white/20 text-white h-11"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-3 sm:gap-4">
                <Label htmlFor="edit-description" className="sm:text-right text-white font-medium">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editPluginDescription}
                  onChange={(e) => setEditPluginDescription(e.target.value)}
                  className="sm:col-span-3 bg-black/60 border-white/20 text-white min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                <Label htmlFor="edit-active" className="sm:text-right text-white font-medium">
                  Active Status
                </Label>
                <div className="sm:col-span-3">
                  <Switch id="edit-active" checked={editPluginActive} onCheckedChange={setEditPluginActive} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpdatePlugin}
                className="bg-white text-black hover:bg-gray-200 w-full sm:w-auto h-11 px-6 font-medium"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
