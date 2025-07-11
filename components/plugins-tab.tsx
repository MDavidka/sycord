"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Puzzle, Download, Star, Users, Plus, Trash2, Settings, Crown, UserPlus, UserMinus } from "lucide-react"

interface Plugin {
  _id: string
  name: string
  description: string
  version: string
  author: string
  category: string
  downloads: number
  rating: number
  price: number
  features: string[]
  is_premium: boolean
  created_at: string
}

interface UserPlugin {
  plugin_id: string
  enabled: boolean
  installed_at: string
}

interface User {
  _id: string
  discordId: string
  name: string
  email: string
  is_tester?: boolean
}

interface PluginsTabProps {
  serverId: string
}

export function PluginsTab({ serverId }: PluginsTabProps) {
  const { data: session } = useSession()
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState("store")

  // Plugin creation state
  const [newPlugin, setNewPlugin] = useState({
    name: "",
    description: "",
    version: "1.0.0",
    author: "",
    category: "utility",
    features: "",
    is_premium: false,
    price: 0,
  })

  useEffect(() => {
    fetchPlugins()
    fetchUserPlugins()
    checkAdminStatus()
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchPlugins = async () => {
    try {
      const response = await fetch("/api/plugins")
      if (response.ok) {
        const data = await response.json()
        setPlugins(data.plugins || [])
      } else {
        console.error("Failed to fetch plugins:", response.statusText)
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
        console.error("Failed to fetch user plugins:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching user plugins:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error("Failed to fetch users:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const checkAdminStatus = async () => {
    if (!session?.user?.email) return

    const adminEmails = ["admin@dash-bot.com", "owner@dash-bot.com"]
    setIsAdmin(adminEmails.includes(session.user.email))
  }

  const installPlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plugin_id: pluginId,
          action: "install",
        }),
      })

      if (response.ok) {
        fetchUserPlugins()
      } else {
        console.error("Failed to install plugin:", response.statusText)
      }
    } catch (error) {
      console.error("Error installing plugin:", error)
    }
  }

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plugin_id: pluginId,
          action: "toggle",
          enabled: enabled,
        }),
      })

      if (response.ok) {
        fetchUserPlugins()
      } else {
        console.error("Failed to toggle plugin:", response.statusText)
      }
    } catch (error) {
      console.error("Error toggling plugin:", error)
    }
  }

  const createPlugin = async () => {
    try {
      const response = await fetch("/api/plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newPlugin,
          features: newPlugin.features.split(",").map((f) => f.trim()),
          author: session?.user?.name || "Unknown",
        }),
      })

      if (response.ok) {
        fetchPlugins()
        setNewPlugin({
          name: "",
          description: "",
          version: "1.0.0",
          author: "",
          category: "utility",
          features: "",
          is_premium: false,
          price: 0,
        })
      } else {
        console.error("Failed to create plugin:", response.statusText)
      }
    } catch (error) {
      console.error("Error creating plugin:", error)
    }
  }

  const deletePlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/plugins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plugin_id: pluginId }),
      })

      if (response.ok) {
        fetchPlugins()
      } else {
        console.error("Failed to delete plugin:", response.statusText)
      }
    } catch (error) {
      console.error("Error deleting plugin:", error)
    }
  }

  const toggleTesterRole = async (userId: string, isTester: boolean) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          is_tester: !isTester,
        }),
      })

      if (response.ok) {
        fetchUsers()
      } else {
        console.error("Failed to toggle tester role:", response.statusText)
      }
    } catch (error) {
      console.error("Error toggling tester role:", error)
    }
  }

  const isPluginInstalled = (pluginId: string) => {
    return userPlugins.some((up) => up.plugin_id === pluginId)
  }

  const isPluginEnabled = (pluginId: string) => {
    const userPlugin = userPlugins.find((up) => up.plugin_id === pluginId)
    return userPlugin?.enabled || false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plugin Store</h2>
          <p className="text-gray-600">Extend your server's functionality with plugins</p>
        </div>
        {isAdmin && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Crown className="w-3 h-3" />
            <span>Admin</span>
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="store">Plugin Store</TabsTrigger>
          <TabsTrigger value="installed">My Plugins ({userPlugins.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
        </TabsList>

        {/* Plugin Store */}
        <TabsContent value="store" className="space-y-4">
          {plugins.length === 0 ? (
            <Alert key="no-plugins-alert">
              <Puzzle className="h-4 w-4" />
              <AlertDescription>No plugins available in the store yet. Check back later!</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plugins.map((plugin) => (
                <Card key={plugin._id} className="relative">
                  {plugin.is_premium && <Badge className="absolute top-2 right-2 bg-yellow-500">Premium</Badge>}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plugin.name}</CardTitle>
                      <Badge variant="outline">{plugin.category}</Badge>
                    </div>
                    <CardDescription>{plugin.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>v{plugin.version}</span>
                      <span>by {plugin.author}</span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>{plugin.downloads}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{plugin.rating}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Features:</Label>
                      <div className="flex flex-wrap gap-1">
                        {plugin.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">{plugin.price > 0 ? `$${plugin.price}` : "Free"}</div>
                      {isPluginInstalled(plugin._id) ? (
                        <Badge variant="default">Installed</Badge>
                      ) : (
                        <Button onClick={() => installPlugin(plugin._id)} size="sm">
                          Install
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Installed Plugins */}
        <TabsContent value="installed" className="space-y-4">
          {userPlugins.length === 0 ? (
            <Alert key="no-installed-plugins-alert">
              <Puzzle className="h-4 w-4" />
              <AlertDescription>
                You haven't installed any plugins yet. Browse the store to get started!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userPlugins.map((userPlugin) => {
                const plugin = plugins.find((p) => p._id === userPlugin.plugin_id)
                if (!plugin) return null

                return (
                  <Card key={userPlugin.plugin_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                        <Switch
                          checked={userPlugin.enabled}
                          onCheckedChange={(checked) => togglePlugin(userPlugin.plugin_id, checked)}
                        />
                      </div>
                      <CardDescription>{plugin.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Installed: {new Date(userPlugin.installed_at).toLocaleDateString()}</span>
                        <Badge variant={userPlugin.enabled ? "default" : "secondary"}>
                          {userPlugin.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Admin Panel */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Plugin Management</span>
                </CardTitle>
                <CardDescription>Create and manage plugins in the store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Plugin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Plugin</DialogTitle>
                      <DialogDescription>Add a new plugin to the store for users to install.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Plugin Name</Label>
                          <Input
                            id="name"
                            value={newPlugin.name}
                            onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                            placeholder="My Awesome Plugin"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="version">Version</Label>
                          <Input
                            id="version"
                            value={newPlugin.version}
                            onChange={(e) => setNewPlugin({ ...newPlugin, version: e.target.value })}
                            placeholder="1.0.0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newPlugin.description}
                          onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                          placeholder="Describe what your plugin does..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newPlugin.category}
                            onValueChange={(value) => setNewPlugin({ ...newPlugin, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="utility">Utility</SelectItem>
                              <SelectItem value="moderation">Moderation</SelectItem>
                              <SelectItem value="fun">Fun</SelectItem>
                              <SelectItem value="music">Music</SelectItem>
                              <SelectItem value="economy">Economy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price">Price ($)</Label>
                          <Input
                            id="price"
                            type="number"
                            value={newPlugin.price}
                            onChange={(e) =>
                              setNewPlugin({ ...newPlugin, price: Number.parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="features">Features (comma-separated)</Label>
                        <Input
                          id="features"
                          value={newPlugin.features}
                          onChange={(e) => setNewPlugin({ ...newPlugin, features: e.target.value })}
                          placeholder="Auto-moderation, Custom commands, Analytics"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="premium"
                          checked={newPlugin.is_premium}
                          onCheckedChange={(checked) => setNewPlugin({ ...newPlugin, is_premium: checked })}
                        />
                        <Label htmlFor="premium">Premium Plugin</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={createPlugin}>Create Plugin</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Existing Plugins</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {plugins.map((plugin) => (
                      <div key={plugin._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{plugin.name}</div>
                          <div className="text-sm text-gray-600">
                            v{plugin.version} • {plugin.downloads} downloads
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => deletePlugin(plugin._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* User Management */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Total Users: {users.length}</Label>
                    <Badge variant="outline">Testers: {users.filter((u) => u.is_tester).length}</Badge>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                          {user.is_tester && (
                            <Badge variant="secondary" className="text-xs">
                              Tester
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant={user.is_tester ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleTesterRole(user._id, user.is_tester || false)}
                        >
                          {user.is_tester ? (
                            <>
                              <UserMinus className="w-4 h-4 mr-1" />
                              Remove Tester
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Make Tester
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
