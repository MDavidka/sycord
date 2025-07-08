"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Download, Star, AlertCircle, CheckCircle } from "lucide-react"

interface Plugin {
  _id: string
  name: string
  description: string
  version: string
  author: string
  category: string
  enabled: boolean
  downloads?: number
  rating?: number
}

export default function PluginsTab() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      setError(null)

      // Load available plugins
      const pluginsResponse = await fetch("/api/plugins")
      if (pluginsResponse.ok) {
        const pluginsData = await pluginsResponse.json()
        setPlugins(pluginsData.plugins || [])
      } else {
        throw new Error("Failed to load plugins")
      }

      // Load user's installed plugins
      const userPluginsResponse = await fetch("/api/user-plugins")
      if (userPluginsResponse.ok) {
        const userPluginsData = await userPluginsResponse.json()
        setUserPlugins(userPluginsData.plugins || [])
      }
    } catch (error) {
      console.error("Error loading plugins:", error)
      setError("Failed to load plugins. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pluginId, enabled }),
      })

      if (response.ok) {
        if (enabled) {
          setUserPlugins([...userPlugins, pluginId])
        } else {
          setUserPlugins(userPlugins.filter((id) => id !== pluginId))
        }
      } else {
        throw new Error("Failed to update plugin")
      }
    } catch (error) {
      console.error("Error toggling plugin:", error)
      setError("Failed to update plugin. Please try again.")
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "moderation":
        return "bg-red-100 text-red-800 border-red-200"
      case "utility":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "fun":
        return "bg-green-100 text-green-800 border-green-200"
      case "music":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plugins...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          {error}
          <Button
            onClick={loadPlugins}
            variant="outline"
            size="sm"
            className="ml-4 border-red-300 text-red-600 hover:bg-red-100 bg-transparent"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Available Plugins
          </CardTitle>
          <CardDescription className="text-gray-600">
            Extend your bot's functionality with community plugins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plugins.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No plugins available</h3>
              <p className="text-gray-600">Check back later for new plugins!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plugins.map((plugin) => {
                const isInstalled = userPlugins.includes(plugin._id)

                return (
                  <div
                    key={plugin._id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{plugin.name}</h3>
                          <Badge className={getCategoryColor(plugin.category)}>{plugin.category}</Badge>
                          {isInstalled && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Installed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{plugin.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>v{plugin.version}</span>
                          <span>by {plugin.author}</span>
                          {plugin.downloads && (
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              {plugin.downloads.toLocaleString()}
                            </span>
                          )}
                          {plugin.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {plugin.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Switch
                          checked={isInstalled}
                          onCheckedChange={(checked) => togglePlugin(plugin._id, checked)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {userPlugins.length > 0 && (
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Installed Plugins
            </CardTitle>
            <CardDescription className="text-gray-600">
              {userPlugins.length} plugin{userPlugins.length !== 1 ? "s" : ""} currently active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plugins
                .filter((plugin) => userPlugins.includes(plugin._id))
                .map((plugin) => (
                  <div key={plugin._id} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{plugin.name}</h3>
                          <Badge className={getCategoryColor(plugin.category)}>{plugin.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{plugin.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>v{plugin.version}</span>
                          <span>by {plugin.author}</span>
                        </div>
                      </div>
                      <Switch checked={true} onCheckedChange={(checked) => togglePlugin(plugin._id, checked)} />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
