"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Download,
  Star,
  Search,
  Filter,
  Settings,
  Users,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Plus,
} from "lucide-react"

interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: string
  rating: number
  downloads: number
  price: number
  featured: boolean
  verified: boolean
  installed?: boolean
  enabled?: boolean
}

interface UserPlugin {
  pluginId: string
  enabled: boolean
  installedAt: string
  settings?: Record<string, any>
}

export default function PluginsTab() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState("store")

  const categories = [
    { id: "all", name: "All Categories" },
    { id: "moderation", name: "Moderation" },
    { id: "utility", name: "Utility" },
    { id: "fun", name: "Fun & Games" },
    { id: "music", name: "Music" },
    { id: "economy", name: "Economy" },
    { id: "analytics", name: "Analytics" },
  ]

  useEffect(() => {
    fetchPlugins()
    fetchUserPlugins()
  }, [])

  const fetchPlugins = async () => {
    try {
      const response = await fetch("/api/plugins")
      if (response.ok) {
        const data = await response.json()
        setPlugins(data.plugins || [])
      } else {
        console.error("Failed to fetch plugins")
      }
    } catch (error) {
      console.error("Error fetching plugins:", error)
    }
  }

  const fetchUserPlugins = async () => {
    try {
      const response = await fetch("/api/user-plugins")
      if (response.ok) {
        const data = await response.json()
        setUserPlugins(data.plugins || [])
      } else {
        console.error("Failed to fetch user plugins")
      }
    } catch (error) {
      console.error("Error fetching user plugins:", error)
    } finally {
      setLoading(false)
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
        await fetchUserPlugins()
      } else {
        console.error("Failed to install plugin")
      }
    } catch (error) {
      console.error("Error installing plugin:", error)
    }
  }

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId, action: "uninstall" }),
      })

      if (response.ok) {
        await fetchUserPlugins()
      } else {
        console.error("Failed to uninstall plugin")
      }
    } catch (error) {
      console.error("Error uninstalling plugin:", error)
    }
  }

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId, action: "toggle", enabled }),
      })

      if (response.ok) {
        await fetchUserPlugins()
      } else {
        console.error("Failed to toggle plugin")
      }
    } catch (error) {
      console.error("Error toggling plugin:", error)
    }
  }

  const isPluginInstalled = (pluginId: string) => {
    return userPlugins.some((up) => up.pluginId === pluginId)
  }

  const isPluginEnabled = (pluginId: string) => {
    const userPlugin = userPlugins.find((up) => up.pluginId === pluginId)
    return userPlugin?.enabled || false
  }

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || plugin.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const installedPlugins = plugins.filter((plugin) => isPluginInstalled(plugin.id))

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "moderation":
        return <Shield className="h-4 w-4" />
      case "utility":
        return <Settings className="h-4 w-4" />
      case "fun":
        return <Zap className="h-4 w-4" />
      case "analytics":
        return <Users className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <Package className="h-6 w-6 mr-3" />
            Plugin Store
          </CardTitle>
          <CardDescription className="text-gray-400">
            Extend your server's functionality with community plugins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="store">Plugin Store</TabsTrigger>
              <TabsTrigger value="installed">Installed ({installedPlugins.length})</TabsTrigger>
            </TabsList>

            {/* Plugin Store Tab */}
            <TabsContent value="store" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search plugins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/60 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-black/60 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Featured Plugins */}
              {selectedCategory === "all" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Featured Plugins</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPlugins
                      .filter((p) => p.featured)
                      .slice(0, 4)
                      .map((plugin) => (
                        <Card key={plugin.id} className="glass-card border-yellow-500/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                {getCategoryIcon(plugin.category)}
                                <h4 className="font-semibold text-white">{plugin.name}</h4>
                                {plugin.verified && <CheckCircle className="h-4 w-4 text-green-400" />}
                              </div>
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Featured</Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{plugin.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <span>by {plugin.author}</span>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  <span>{plugin.rating}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Download className="h-3 w-3" />
                                  <span>{plugin.downloads.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">
                                {plugin.price === 0 ? "Free" : `$${plugin.price}`}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleInstallPlugin(plugin.id)}
                                disabled={isPluginInstalled(plugin.id)}
                                className="bg-white text-black hover:bg-gray-200"
                              >
                                {isPluginInstalled(plugin.id) ? "Installed" : "Install"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* All Plugins */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedCategory === "all" ? "All Plugins" : categories.find((c) => c.id === selectedCategory)?.name}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {filteredPlugins.map((plugin) => (
                    <Card key={plugin.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getCategoryIcon(plugin.category)}
                              <h4 className="font-semibold text-white">{plugin.name}</h4>
                              {plugin.verified && <CheckCircle className="h-4 w-4 text-green-400" />}
                              {plugin.featured && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{plugin.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                by {plugin.author} • v{plugin.version}
                              </span>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  <span>{plugin.rating}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Download className="h-3 w-3" />
                                  <span>{plugin.downloads.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            <span className="text-sm font-medium text-white">
                              {plugin.price === 0 ? "Free" : `$${plugin.price}`}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleInstallPlugin(plugin.id)}
                              disabled={isPluginInstalled(plugin.id)}
                              className="bg-white text-black hover:bg-gray-200"
                            >
                              {isPluginInstalled(plugin.id) ? "Installed" : "Install"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {filteredPlugins.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No plugins found</h3>
                  <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </TabsContent>

            {/* Installed Plugins Tab */}
            <TabsContent value="installed" className="space-y-6">
              {installedPlugins.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No plugins installed</h3>
                  <p className="text-gray-400 mb-4">Browse the plugin store to add functionality to your server.</p>
                  <Button onClick={() => setActiveTab("store")} className="bg-white text-black hover:bg-gray-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Plugins
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {installedPlugins.map((plugin) => {
                    const userPlugin = userPlugins.find((up) => up.pluginId === plugin.id)
                    return (
                      <Card key={plugin.id} className="glass-card">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {getCategoryIcon(plugin.category)}
                                <h4 className="font-semibold text-white">{plugin.name}</h4>
                                {plugin.verified && <CheckCircle className="h-4 w-4 text-green-400" />}
                                <Badge
                                  className={
                                    isPluginEnabled(plugin.id)
                                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                  }
                                >
                                  {isPluginEnabled(plugin.id) ? "Enabled" : "Disabled"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">{plugin.description}</p>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>Installed {new Date(userPlugin?.installedAt || "").toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Switch
                                checked={isPluginEnabled(plugin.id)}
                                onCheckedChange={(enabled) => handleTogglePlugin(plugin.id, enabled)}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUninstallPlugin(plugin.id)}
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Plugin Development Alert */}
      <Alert className="border-blue-500/30 bg-blue-500/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-blue-400">
          Plugin system is in beta. Some features may not work as expected. Report issues to our support team.
        </AlertDescription>
      </Alert>
    </div>
  )
}
