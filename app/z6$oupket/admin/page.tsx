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
import { Users, MessageSquare, Package, LinkIcon, Plus, Trash2, AlertTriangle, Settings } from "lucide-react"

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage Dash Bot system</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={maintenanceMode ? "destructive" : "secondary"} className="bg-muted text-muted-foreground">
                {maintenanceMode ? "Maintenance Mode" : "Live"}
              </Badge>
              <Button onClick={toggleMaintenance} variant={maintenanceMode ? "destructive" : "outline"} size="sm">
                {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Maintenance Mode Alert */}
      {maintenanceMode && (
        <Alert className="mx-4 mt-4 border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Maintenance Mode Active:</strong> The site is currently locked for all users except administrators.
          </AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-border mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "users"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "announcements"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Announcements
            </button>
            <button
              onClick={() => setActiveTab("plugins")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "plugins"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Plugins
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "integrations"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Integrations
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "system"
                  ? "border-foreground text-foreground"
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
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">All Users</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage registered users and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center">
                            <span className="text-background font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
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
                          <Label className="text-sm text-muted-foreground">Beta Tester</Label>
                        </div>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          Active
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
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Create Announcement</CardTitle>
                <CardDescription className="text-muted-foreground">Send announcements to all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground">Title</Label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="Announcement title"
                    className="border-border bg-background"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Message</Label>
                  <Textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    placeholder="Announcement message"
                    className="border-border bg-background"
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
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createAnnouncement} className="bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Active Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement._id} className="p-4 border border-border rounded-lg bg-muted/30">
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
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Create Plugin</CardTitle>
                <CardDescription className="text-muted-foreground">Add new plugins to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Name</Label>
                    <Input
                      value={newPlugin.name}
                      onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                      placeholder="Plugin name"
                      className="border-border bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Version</Label>
                    <Input
                      value={newPlugin.version}
                      onChange={(e) => setNewPlugin({ ...newPlugin, version: e.target.value })}
                      placeholder="1.0.0"
                      className="border-border bg-background"
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
                      className="border-border bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Category</Label>
                    <Select
                      value={newPlugin.category}
                      onValueChange={(value) => setNewPlugin({ ...newPlugin, category: value })}
                    >
                      <SelectTrigger className="border-border bg-background">
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
                    className="border-border bg-background"
                  />
                </div>
                <Button onClick={createPlugin} className="bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plugin
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Available Plugins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plugins.map((plugin) => (
                    <div key={plugin._id} className="p-4 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-foreground">{plugin.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            v{plugin.version} by {plugin.author}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            {plugin.category}
                          </Badge>
                          <Button
                            onClick={() => deletePlugin(plugin._id)}
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive hover:bg-destructive/10"
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
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Add Integration</CardTitle>
                <CardDescription className="text-muted-foreground">Add new third-party integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground">Name</Label>
                  <Input
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    placeholder="Integration name"
                    className="border-border bg-background"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    value={newIntegration.description}
                    onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
                    placeholder="Integration description"
                    className="border-border bg-background"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Icon URL</Label>
                  <Input
                    value={newIntegration.icon}
                    onChange={(e) => setNewIntegration({ ...newIntegration, icon: e.target.value })}
                    placeholder="https://example.com/icon.png"
                    className="border-border bg-background"
                  />
                </div>
                <Button onClick={createIntegration} className="bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Available Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrations.map((integration) => (
                    <div key={integration._id} className="p-4 border border-border rounded-lg bg-muted/30">
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
                          className="border-destructive text-destructive hover:bg-destructive/10"
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
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">System Settings</CardTitle>
                <CardDescription className="text-muted-foreground">Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div>
                    <h3 className="font-medium text-foreground">Maintenance Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      When enabled, only administrators can access the site
                    </p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
                </div>

                <div className="p-4 border border-border rounded-lg bg-muted/30">
                  <h3 className="font-medium text-foreground mb-2">System Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{users.length}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{plugins.length}</div>
                      <div className="text-sm text-muted-foreground">Plugins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{integrations.length}</div>
                      <div className="text-sm text-muted-foreground">Integrations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {announcements.filter((a) => a.active).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Announcements</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
