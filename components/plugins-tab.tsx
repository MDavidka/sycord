"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Package, Search, Download, Trash2, Users, Plus, UserCheck, Crown, AlertCircle } from "lucide-react"
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

interface User {
  _id: string
  name: string
  email: string
  is_tester: boolean
  joined_since: string
}

export default function PluginsTab() {
  const { data: session } = useSession()
  const [allPlugins, setAllPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeView, setActiveView] = useState<"store" | "installed" | "admin">("store")
  const [showCreatePlugin, setShowCreatePlugin] = useState(false)
  const [newPlugin, setNewPlugin] = useState({ name: "", description: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Hardcoded admin email for demonstration purposes
  const isAdmin = session?.user?.email === "dmarton336@gmail.com"

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError("")
      setSuccess("") // Clear success message on new fetch
      const [pluginsResponse, userPluginsResponse] = await Promise.all([
        fetch("/api/plugins"),
        fetch("/api/user-plugins"),
      ])

      if (pluginsResponse.ok) {
        const pluginsData = await pluginsResponse.json()
        setAllPlugins(pluginsData.plugins || [])
      } else {
        const errorData = await pluginsResponse.json()
        console.error("Failed to fetch all plugins:", errorData.error || pluginsResponse.statusText)
        setError(errorData.error || "Failed to load plugins from store.")
      }

      if (userPluginsResponse.ok) {
        const userPluginsData = await userPluginsResponse.json()
        setUserPlugins(userPluginsData.plugins || [])
      } else {
        const errorData = await userPluginsResponse.json()
        console.error("Failed to fetch user plugins:", errorData.error || userPluginsResponse.statusText)
        setError(errorData.error || "Failed to load installed plugins.")
      }

      // Fetch all users if admin
      if (isAdmin) {
        const usersResponse = await fetch("/api/admin/users")
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setAllUsers(usersData.users || [])
        } else {
          const errorData = await usersResponse.json()
          console.error("Failed to fetch users for admin:", errorData.error || usersResponse.statusText)
          setError(errorData.error || "Failed to load user data for admin panel.")
        }
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message || "Failed to load data. Please try again.")
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
      setError(error.message || `Failed to ${action} plugin`)
    }
  }

  const handleCreatePlugin = async () => {
    if (!newPlugin.name.trim() || !newPlugin.description.trim()) {
      setError("Please fill in all fields")
      return
    }

    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlugin),
      })

      if (response.ok) {
        setNewPlugin({ name: "", description: "" })
        setShowCreatePlugin(false)
        setSuccess("Plugin created successfully!")
        setTimeout(() => setSuccess(""), 3000)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create plugin")
      }
    } catch (error: any) {
      console.error("Error creating plugin:", error)
      setError(error.message || "Failed to create plugin")
    }
  }

  const handleDeletePlugin = async (pluginId: string) => {
    if (!confirm("Are you sure you want to delete this plugin? This action cannot be undone.")) {
      return
    }

    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/plugins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId }),
      })

      if (response.ok) {
        setSuccess("Plugin deleted successfully!")
        setTimeout(() => setSuccess(""), 3000)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete plugin")
      }
    } catch (error: any) {
      console.error("Error deleting plugin:", error)
      setError(error.message || "Failed to delete plugin")
    }
  }

  const handleToggleTester = async (userId: string, isTester: boolean) => {
    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, is_tester: !isTester }),
      })

      if (response.ok) {
        setSuccess(`User ${!isTester ? "granted" : "removed"} tester role!`)
        setTimeout(() => setSuccess(""), 3000)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update user")
      }
    } catch (error: any) {
      console.error("Error updating user:", error)
      setError(error.message || "Failed to update user")
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

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const isPluginInstalled = (pluginId: string) => {
    return userPlugins.some((p) => p.pluginId === pluginId)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-white">Loading plugins...</p>
      </div>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <CardTitle className="text-white flex items-center text-xl">
              <Package className="h-6 w-6 mr-3" />
              Plugin Store
            </CardTitle>
            <CardDescription className="text-gray-400">
              Extend your bot's functionality with community plugins
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={activeView === "store" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("store")}
              className={
                activeView === "store" ? "bg-white text-black" : "border-white/20 text-white hover:bg-white/10"
              }
            >
              Store
            </Button>
            <Button
              variant={activeView === "installed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("installed")}
              className={
                activeView === "installed" ? "bg-white text-black" : "border-white/20 text-white hover:bg-white/10"
              }
            >
              Installed ({userPlugins.length})
            </Button>
            {isAdmin && (
              <Button
                variant={activeView === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveView("admin")}
                className={
                  activeView === "admin" ? "bg-white text-black" : "border-white/20 text-white hover:bg-white/10"
                }
              >
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error and Success Messages */}
        {error && (
          <Alert key="error-alert" className="mb-4 border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert key="success-alert" className="mb-4 border-green-500/30 bg-green-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={activeView === "admin" ? "Search users..." : "Search plugins..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/60 border-white/20 text-white placeholder-gray-400"
          />
        </div>

        {activeView === "store" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlugins.map((plugin) => (
              <Card key={plugin._id} className="bg-black/20 border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{plugin.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center text-xs text-gray-400">
                            <Users className="h-3 w-3 mr-1" />
                            {plugin.installs}
                          </div>
                          {isPluginInstalled(plugin._id) && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Installed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{plugin.description}</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handlePluginAction(plugin._id, isPluginInstalled(plugin._id) ? "uninstall" : "install")
                      }
                      className={
                        isPluginInstalled(plugin._id)
                          ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                          : "bg-white text-black hover:bg-gray-200"
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
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePlugin(plugin._id)}
                        className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeView === "installed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUserPlugins.map((plugin) => (
              <Card key={plugin.pluginId} className="bg-black/20 border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{plugin.name}</CardTitle>
                        <p className="text-xs text-gray-400">
                          Installed {new Date(plugin.installed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{plugin.description}</p>
                  <Button
                    size="sm"
                    onClick={() => handlePluginAction(plugin.pluginId, "uninstall")}
                    className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
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

        {activeView === "admin" && isAdmin && (
          <div className="space-y-6">
            {/* Create Plugin Section */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Plugin Management</h3>
              <Button
                onClick={() => setShowCreatePlugin(!showCreatePlugin)}
                className="bg-white text-black hover:bg-gray-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Plugin
              </Button>
            </div>

            {showCreatePlugin && (
              <Card className="bg-black/20 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base">Create New Plugin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white text-sm mb-2 block">Plugin Name</Label>
                    <Input
                      placeholder="Enter plugin name"
                      value={newPlugin.name}
                      onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm mb-2 block">Description</Label>
                    <Textarea
                      placeholder="Enter plugin description"
                      value={newPlugin.description}
                      onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                      className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleCreatePlugin} className="bg-white text-black hover:bg-gray-200">
                      Create Plugin
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreatePlugin(false)
                        setNewPlugin({ name: "", description: "" })
                        setError("")
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Management Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map((user) => (
                  <Card key={user._id} className="bg-black/20 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{user.name}</h4>
                            <p className="text-xs text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-400">
                              Joined {new Date(user.joined_since).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.is_tester && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Tester</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleTester(user._id, user.is_tester)}
                            className={
                              user.is_tester
                                ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
                            }
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {user.is_tester ? "Remove Tester" : "Make Tester"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {((activeView === "store" && filteredPlugins.length === 0) ||
          (activeView === "installed" && filteredUserPlugins.length === 0) ||
          (activeView === "admin" && filteredUsers.length === 0)) && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {activeView === "store"
                ? "No plugins found"
                : activeView === "installed"
                  ? "No plugins installed"
                  : "No users found"}
            </h3>
            <p className="text-gray-400">
              {activeView === "store"
                ? "Try adjusting your search terms."
                : activeView === "installed"
                  ? "Install plugins from the store to extend your bot's functionality."
                  : "Try adjusting your search terms."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
