"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, MessageSquare, Package, LinkIcon, Plus, Trash2, Shield, AlertTriangle, Settings } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  discordId: string
  joined_since: string
  servers: any[]
  is_tester?: boolean
}

interface Plugin {
  _id: string
  name: string
  description: string
  version: string
  author: string
  enabled: boolean
  category: string
}

interface Integration {
  _id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  config: any
}

interface Announcement {
  _id: string
  title: string
  message: string
  type: "info" | "warning" | "success"
  active: boolean
  createdAt: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState<User[]>([])
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success",
  })
  const [newPlugin, setNewPlugin] = useState({
    name: "",
    description: "",
    version: "1.0.0",
    author: "",
    category: "utility",
  })
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    description: "",
    icon: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load users
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

      // Load plugins
      const pluginsResponse = await fetch("/api/admin/plugins")
      if (pluginsResponse.ok) {
        const pluginsData = await pluginsResponse.json()
        setPlugins(pluginsData.plugins || [])
      }

      // Load integrations
      const integrationsResponse = await fetch("/api/admin/integrations")
      if (integrationsResponse.ok) {
        const integrationsData = await integrationsResponse.json()
        setIntegrations(integrationsData.integrations || [])
      }

      // Load announcements
      const announcementsResponse = await fetch("/api/admin/announcements")
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        setAnnouncements(announcementsData.announcements || [])
      }

      // Load maintenance status
      const maintenanceResponse = await fetch("/api/admin/maintenance")
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json()
        setMaintenanceMode(maintenanceData.enabled || false)
      }
    } catch (error) {
      console.error("Error loading admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createAnnouncement = async () => {
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement),
      })
      if (response.ok) {
        setNewAnnouncement({ title: "", message: "", type: "info" })
        loadData()
      }
    } catch (error) {
      console.error("Error creating announcement:", error)
    }
  }

  const createPlugin = async () => {
    try {
      const response = await fetch("/api/admin/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPlugin, enabled: true }),
      })
      if (response.ok) {
        setNewPlugin({ name: "", description: "", version: "1.0.0", author: "", category: "utility" })
        loadData()
      }
    } catch (error) {
      console.error("Error creating plugin:", error)
    }
  }

  const createIntegration = async () => {
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newIntegration, enabled: true, config: {} }),
      })
      if (response.ok) {
        setNewIntegration({ name: "", description: "", icon: "" })
        loadData()
      }
    } catch (error) {
      console.error("Error creating integration:", error)
    }
  }

  const toggleMaintenance = async () => {
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      })
      if (response.ok) {
        setMaintenanceMode(!maintenanceMode)
      }
    } catch (error) {
      console.error("Error toggling maintenance:", error)
    }
  }

  const toggleUserTester = async (userId: string, isTester: boolean) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, is_tester: isTester }),
      })
      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const deletePlugin = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/plugins?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error("Error deleting plugin:", error)
    }
  }

  const deleteIntegration = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/integrations?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error("Error deleting integration:", error)
    }
  }

  const toggleAnnouncementStatus = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/admin/announcements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      })
      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error("Error updating announcement:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 dark:bg-gray-900/80 dark:border-blue-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage Dash Bot system</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={maintenanceMode ? "destructive" : "secondary"}>
                {maintenanceMode ? "Maintenance Mode" : "Live"}
              </Badge>
              <Button
                onClick={toggleMaintenance}
                variant={maintenanceMode ? "destructive" : "outline"}
                className={maintenanceMode ? "" : "border-blue-200 hover:bg-blue-50 dark:border-blue-800"}
              >
                {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Maintenance Mode Alert */}
      {maintenanceMode && (
        <Alert className="mx-4 mt-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Maintenance Mode Active:</strong> The site is currently locked for all users except administrators.
          </AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-blue-100 dark:border-blue-900 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "announcements"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Announcements
            </button>
            <button
              onClick={() => setActiveTab("plugins")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "plugins"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Plugins
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "integrations"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Integrations
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "system"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              System
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">All Users</CardTitle>
                <CardDescription>Manage registered users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-white/50 dark:bg-gray-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.servers.length} servers • Joined {new Date(user.joined_since).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.is_tester || false}
                            onCheckedChange={(checked) => toggleUserTester(user._id, checked)}
                          />
                          <Label className="text-sm">Beta Tester</Label>
                        </div>
                        <Badge
                          variant={user.is_tester ? "default" : "secondary"}
                          className={
                            user.is_tester
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          }
                        >
                          {user.is_tester ? "Beta Tester" : "Regular User"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Create Announcement</CardTitle>
                <CardDescription>Send announcements to all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground">Title</Label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="Announcement title"
                    className="border-blue-200 dark:border-blue-800"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Message</Label>
                  <Textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    placeholder="Announcement message"
                    className="border-blue-200 dark:border-blue-800"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Type</Label>
                  <Select
                    value={newAnnouncement.type}
                    onValueChange={(value: "info" | "warning" | "success") =>
                      setNewAnnouncement({ ...newAnnouncement, type: value })
                    }
                  >
                    <SelectTrigger className="border-blue-200 dark:border-blue-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={createAnnouncement}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Active Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement._id}
                      className="p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-white/50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-foreground">{announcement.title}</h3>
                            <Badge
                              variant={
                                announcement.type === "info"
                                  ? "secondary"
                                  : announcement.type === "warning"
                                    ? "destructive"
                                    : "default"
                              }
                            >
                              {announcement.type}
                            </Badge>
                            <Badge variant={announcement.active ? "default" : "secondary"}>
                              {announcement.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{announcement.message}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => toggleAnnouncementStatus(announcement._id, !announcement.active)}
                          variant="outline"
                          size="sm"
                          className="border-blue-200 hover:bg-blue-50 dark:border-blue-800"
                        >
                          {announcement.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plugins Tab */}
        {activeTab === "plugins" && (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Create Plugin</CardTitle>
                <CardDescription>Add new plugins to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Name</Label>
                    <Input
                      value={newPlugin.name}
                      onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                      placeholder="Plugin name"
                      className="border-blue-200 dark:border-blue-800"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Version</Label>
                    <Input
                      value={newPlugin.version}
                      onChange={(e) => setNewPlugin({ ...newPlugin, version: e.target.value })}
                      placeholder="1.0.0"
                      className="border-blue-200 dark:border-blue-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Author</Label>
                    <Input
                      value={newPlugin.author}
                      onChange={(e) => setNewPlugin({ ...newPlugin, author: e.target.value })}
                      placeholder="Author name"
                      className="border-blue-200 dark:border-blue-800"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Category</Label>
                    <Select
                      value={newPlugin.category}
                      onValueChange={(value) => setNewPlugin({ ...newPlugin, category: value })}
                    >
                      <SelectTrigger className="border-blue-200 dark:border-blue-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="moderation">Moderation</SelectItem>
                        <SelectItem value="fun">Fun</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    value={newPlugin.description}
                    onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                    placeholder="Plugin description"
                    className="border-blue-200 dark:border-blue-800"
                  />
                </div>
                <Button
                  onClick={createPlugin}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plugin
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Available Plugins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plugins.map((plugin) => (
                    <div
                      key={plugin._id}
                      className="p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-white/50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-foreground">{plugin.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            v{plugin.version} by {plugin.author}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                          >
                            {plugin.category}
                          </Badge>
                          <Button
                            onClick={() => deletePlugin(plugin._id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{plugin.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Add Integration</CardTitle>
                <CardDescription>Add new third-party integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground">Name</Label>
                  <Input
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    placeholder="Integration name"
                    className="border-blue-200 dark:border-blue-800"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    value={newIntegration.description}
                    onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
                    placeholder="Integration description"
                    className="border-blue-200 dark:border-blue-800"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Icon URL</Label>
                  <Input
                    value={newIntegration.icon}
                    onChange={(e) => setNewIntegration({ ...newIntegration, icon: e.target.value })}
                    placeholder="https://example.com/icon.png"
                    className="border-blue-200 dark:border-blue-800"
                  />
                </div>
                <Button
                  onClick={createIntegration}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Available Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration._id}
                      className="p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-white/50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {integration.icon && (
                            <img
                              src={integration.icon || "/placeholder.svg"}
                              alt={integration.name}
                              className="w-8 h-8 rounded"
                            />
                          )}
                          <div>
                            <h3 className="font-medium text-foreground">{integration.name}</h3>
                            <Badge variant={integration.enabled ? "default" : "secondary"}>
                              {integration.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => deleteIntegration(integration._id)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Tab */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100 dark:bg-gray-800/80 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">System Status</CardTitle>
                <CardDescription>Monitor system health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Online</h3>
                    <p className="text-muted-foreground text-sm">System Status</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">{users.length}</h3>
                    <p className="text-muted-foreground text-sm">Total Users</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">{plugins.length}</h3>
                    <p className="text-muted-foreground text-sm">Active Plugins</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-red-100 dark:bg-gray-800/80 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Maintenance Mode</CardTitle>
                <CardDescription>Lock the site for maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <h3 className="font-medium text-red-800 dark:text-red-200">Site Maintenance</h3>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {maintenanceMode ? "Site is currently locked for maintenance" : "Site is accessible to all users"}
                    </p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
                </div>
                {maintenanceMode && (
                  <Alert className="mt-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Maintenance mode is active. Only administrators can access the site.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
