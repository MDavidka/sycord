"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, Package, LinkIcon, Plus, Trash2 } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  discordId: string
  joined_since: string
  servers: any[]
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage Dash Bot system</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={maintenanceMode ? "destructive" : "secondary"}>
                {maintenanceMode ? "Maintenance Mode" : "Live"}
              </Badge>
              <Button
                onClick={toggleMaintenance}
                variant={maintenanceMode ? "destructive" : "outline"}
                className="border-gray-300"
              >
                {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "announcements"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Announcements
            </button>
            <button
              onClick={() => setActiveTab("plugins")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "plugins"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Plugins
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "integrations"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Integrations
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">All Users</CardTitle>
                <CardDescription className="text-gray-600">Manage registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {user.servers.length} servers • Joined {new Date(user.joined_since).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        Active
                      </Badge>
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
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Create Announcement</CardTitle>
                <CardDescription className="text-gray-600">Send announcements to all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-900">Title</Label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="Announcement title"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Message</Label>
                  <Textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    placeholder="Announcement message"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Type</Label>
                  <Select
                    value={newAnnouncement.type}
                    onValueChange={(value: "info" | "warning" | "success") =>
                      setNewAnnouncement({ ...newAnnouncement, type: value })
                    }
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createAnnouncement} className="bg-gray-900 text-white hover:bg-gray-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Active Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{announcement.title}</h3>
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
                          <p className="text-gray-600 mb-2">{announcement.message}</p>
                          <p className="text-xs text-gray-500">
                            Created {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => toggleAnnouncementStatus(announcement._id, !announcement.active)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
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
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Create Plugin</CardTitle>
                <CardDescription className="text-gray-600">Add new plugins to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900">Name</Label>
                    <Input
                      value={newPlugin.name}
                      onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                      placeholder="Plugin name"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-900">Version</Label>
                    <Input
                      value={newPlugin.version}
                      onChange={(e) => setNewPlugin({ ...newPlugin, version: e.target.value })}
                      placeholder="1.0.0"
                      className="border-gray-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900">Author</Label>
                    <Input
                      value={newPlugin.author}
                      onChange={(e) => setNewPlugin({ ...newPlugin, author: e.target.value })}
                      placeholder="Author name"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-900">Category</Label>
                    <Select
                      value={newPlugin.category}
                      onValueChange={(value) => setNewPlugin({ ...newPlugin, category: value })}
                    >
                      <SelectTrigger className="border-gray-300">
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
                  <Label className="text-gray-900">Description</Label>
                  <Textarea
                    value={newPlugin.description}
                    onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                    placeholder="Plugin description"
                    className="border-gray-300"
                  />
                </div>
                <Button onClick={createPlugin} className="bg-gray-900 text-white hover:bg-gray-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plugin
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Available Plugins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plugins.map((plugin) => (
                    <div key={plugin._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{plugin.name}</h3>
                          <p className="text-sm text-gray-600">
                            v{plugin.version} by {plugin.author}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
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
                      <p className="text-sm text-gray-600">{plugin.description}</p>
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
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Add Integration</CardTitle>
                <CardDescription className="text-gray-600">Add new third-party integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-900">Name</Label>
                  <Input
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    placeholder="Integration name"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Description</Label>
                  <Textarea
                    value={newIntegration.description}
                    onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
                    placeholder="Integration description"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Icon URL</Label>
                  <Input
                    value={newIntegration.icon}
                    onChange={(e) => setNewIntegration({ ...newIntegration, icon: e.target.value })}
                    placeholder="https://example.com/icon.png"
                    className="border-gray-300"
                  />
                </div>
                <Button onClick={createIntegration} className="bg-gray-900 text-white hover:bg-gray-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Available Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrations.map((integration) => (
                    <div key={integration._id} className="p-4 border border-gray-200 rounded-lg">
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
                            <h3 className="font-medium text-gray-900">{integration.name}</h3>
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
                      <p className="text-sm text-gray-600">{integration.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
