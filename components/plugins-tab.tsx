"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Package, Search, Download, Trash2, Users, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Plugin {
  _id: string
  name: string
  description: string
  created_by: string
  created_at: string
  installs: number
  active: boolean
}

interface UserPlugin {
  pluginId: string
  name: string
  description: string
  installed_at: string
}

export default function PluginsTab() {
  const { data: session } = useSession()
  const [allPlugins, setAllPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeView, setActiveView] = useState<"store" | "installed">("store")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError("")
      setSuccess("")

      const [pluginsResponse, userPluginsResponse] = await Promise.all([
        fetch("/api/plugins").catch(() => ({
          ok: false,
          json: () => Promise.resolve({ error: "Failed to fetch plugins" }),
        })),
        fetch("/api/user-plugins").catch(() => ({
          ok: false,
          json: () => Promise.resolve({ error: "Failed to fetch user plugins" }),
        })),
      ])

      if (pluginsResponse.ok) {
        const pluginsData = await pluginsResponse.json()
        setAllPlugins(pluginsData.plugins || [])
      } else {
        const errorData = await pluginsResponse.json()
        console.error("Failed to fetch all plugins:", errorData.error)
      }

      if (userPluginsResponse.ok) {
        const userPluginsData = await userPluginsResponse.json()
        setUserPlugins(userPluginsData.plugins || [])
      } else {
        const errorData = await userPluginsResponse.json()
        console.error("Failed to fetch user plugins:", errorData.error)
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError("Failed to load plugins. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePluginAction = async (pluginId: string, action: "install" | "uninstall") => {
    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId, action }),
      })

      if (response.ok) {
        setSuccess(`Plugin ${action === "install" ? "installed" : "uninstalled"} successfully!`)
        setTimeout(() => setSuccess(""), 3000)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to ${action} plugin`)
      }
    } catch (error: any) {
      console.error("Error managing plugin:", error)
      setError(`Failed to ${action} plugin`)
    }
  }

  const filteredPlugins = allPlugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredUserPlugins = userPlugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const isPluginInstalled = (pluginId: string) => {
    return userPlugins.some((p) => p.pluginId === pluginId)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading plugins...</p>
      </div>
    )
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <CardTitle className="text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Plugin Store
            </CardTitle>
            <CardDescription className="text-gray-600">
              Extend your bot's functionality with community plugins
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={activeView === "store" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("store")}
              className={
                activeView === "store" ? "bg-gray-900 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }
            >
              Store
            </Button>
            <Button
              variant={activeView === "installed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("installed")}
              className={
                activeView === "installed" ? "bg-gray-900 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }
            >
              Installed ({userPlugins.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error and Success Messages */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300"
          />
        </div>

        {activeView === "store" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlugins.map((plugin) => (
              <Card key={plugin._id} className="border-gray-200 bg-gray-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-900 text-base">{plugin.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="h-3 w-3 mr-1" />
                            {plugin.installs}
                          </div>
                          {isPluginInstalled(plugin._id) && (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Installed</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{plugin.description}</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handlePluginAction(plugin._id, isPluginInstalled(plugin._id) ? "uninstall" : "install")
                      }
                      className={
                        isPluginInstalled(plugin._id)
                          ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }
                      variant={isPluginInstalled(plugin._id) ? "outline" : "default"}
                    >
                      {isPluginInstalled(plugin._id) ? (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Uninstall
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Install
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeView === "installed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUserPlugins.map((plugin) => (
              <Card key={plugin.pluginId} className="border-gray-200 bg-gray-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-900 text-base">{plugin.name}</CardTitle>
                        <p className="text-xs text-gray-500">
                          Installed {new Date(plugin.installed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{plugin.description}</p>
                  <Button
                    size="sm"
                    onClick={() => handlePluginAction(plugin.pluginId, "uninstall")}
                    className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                    variant="outline"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Uninstall
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {((activeView === "store" && filteredPlugins.length === 0) ||
          (activeView === "installed" && filteredUserPlugins.length === 0)) && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeView === "store" ? "No plugins found" : "No plugins installed"}
            </h3>
            <p className="text-gray-600">
              {activeView === "store"
                ? "Try adjusting your search terms."
                : "Install plugins from the store to extend your bot's functionality."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
