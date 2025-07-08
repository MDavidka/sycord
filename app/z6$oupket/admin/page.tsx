"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Bell, Package, Users, AlertTriangle, CheckCircle, Trash2, Edit, LinkIcon } from "lucide-react"

interface Plugin {
  _id: string
  name: string
  description: string
  created_by: string
  created_at: string
  installs: number
  active: boolean
}

interface User {
  _id: string
  name: string
  email: string
  is_tester: boolean
  joined_since: string
}

interface Announcement {
  _id: string
  title: string
  message: string
  type: "info" | "warning" | "success"
  created_at: string
  active: boolean
}

interface Integration {
  _id: string
  name: string
  description: string
  webhook_url?: string
  api_key?: string
  active: boolean
}

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("announcements")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Data states
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success",
  })
  const [newPlugin, setNewPlugin] = useState({ name: "", description: "" })
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    description: "",
    webhook_url: "",
    api_key: "",
  })
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.email !== "dmarton336@gmail.com") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.email === "dmarton336@gmail.com") {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      setError("")
      const [pluginsRes, usersRes, announcementsRes, integrationsRes, maintenanceRes] = await Promise.all([
        fetch("/api/plugins"),
        fetch("/api/admin/users"),
        fetch("/api/admin/announcements"),
        fetch("/api/admin/integrations"),
        fetch("/api/admin/maintenance"),
      ])

      if (pluginsRes.ok) {
        const pluginsData = await pluginsRes.json()
        setPlugins(pluginsData.plugins || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json()
        setAnnouncements(announcementsData.announcements || [])
      }

      if (integrationsRes.ok) {
        const integrationsData = await integrationsRes.json()
        setIntegrations(integrationsData.integrations || [])
      }

      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json()
        setMaintenanceMode(maintenanceData.maintenance || false)
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setError("Please fill in all fields")
      return
    }

    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement),
      })

      if (response.ok) {
        setNewAnnouncement({ title: "", message: "", type: "info" })
        setSuccess("Announcement created successfully!")
        setTimeout(() => setSuccess(""), 3000)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create announcement")
      }
    } catch (error: any) {
      setError("Failed to create announcement")
    }
  }

  const handleToggleMaintenance = async () => {
    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance: !maintenanceMode }),
      })

      if (response.ok) {
        setMaintenanceMode(!maintenanceMode)
        setSuccess(`Maintenance mode ${!maintenanceMode ? "enabled" : "disabled"}!`)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to toggle maintenance mode")
      }
    } catch (error: any) {
      setError("Failed to toggle maintenance mode")
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlugin),
      })

      if (response.ok) {
        setNewPlugin({ name: "", description: "" })
        setSuccess("Plugin created successfully!")
        setTimeout(() => setSuccess(""), 3000)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create plugin")
      }
    } catch (error: any) {
      setError("Failed to create plugin")
    }
  }

  const handleUpdatePlugin = async () => {
    if (!editingPlugin) return

    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/plugins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pluginId: editingPlugin._id,
          name: editingPlugin.name,
          description: editingPlugin.description,
        }),
      })

      if (response.ok) {
        setEditingPlugin(null)
        setSuccess("Plugin updated successfully!")
        setTimeout(() => setSuccess(""), 3000)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update plugin")
      }
    } catch (error: any) {
      setError("Failed to update plugin")
    }
  }

  const handleDeletePlugin = async (pluginId: string) => {
    if (!confirm("Are you sure you want to delete this plugin?")) return

    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/plugins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
      setError("Failed to delete plugin")
    }
  }

  const handleCreateIntegration = async () => {
    if (!newIntegration.name.trim() || !newIntegration.description.trim()) {
      setError("Please fill in all fields")
      return
    }

    try {
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIntegration),
      })

      if (response.ok) {
        setNewIntegration({ name: "", description: "", webhook_url: "", api_key: "" })
        setSuccess("Integration created successfully!")
        setTimeout(() => setSuccess(""), 3000)
        await fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create integration")
      }
    } catch (error: any) {
      setError("Failed to create integration")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.email !== "dmarton336@gmail.com") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">System administration and management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={maintenanceMode ? "destructive" : "default"}>
                {maintenanceMode ? "Maintenance Mode" : "System Online"}
              </Badge>
              <Button onClick={handleToggleMaintenance} variant={maintenanceMode ? "default" : "destructive"} size="sm">
                {maintenanceMode ? "Disable" : "Enable"} Maintenance
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Error and Success Messages */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
            <Button
              variant={activeTab === "announcements" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("announcements")}
              className={activeTab === "announcements" ? "bg-gray-900 text-white" : "text-gray-600"}
            >
              <Bell className="h-4 w-4 mr-2" />
              Announcements
            </Button>
            <Button
              variant={activeTab === "plugins" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("plugins")}
              className={activeTab === "plugins" ? "bg-gray-900 text-white" : "text-gray-600"}
            >
              <Package className="h-4 w-4 mr-2" />
              Plugins
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("users")}
              className={activeTab === "users" ? "bg-gray-900 text-white" : "text-gray-600"}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeTab === "integrations" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("integrations")}
              className={activeTab === "integrations" ? "bg-gray-900 text-white" : "text-gray-600"}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Integrations
            </Button>
          </nav>
        </div>

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Create Announcement</CardTitle>
                <CardDescription className="text-gray-600">Send announcements to all dashboard users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-900">Title</Label>
                  <Input
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Message</Label>
                  <Textarea
                    placeholder="Announcement message"
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    className="border-gray-300 min-h-[100px]"
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
                <Button onClick={handleCreateAnnouncement} className="bg-gray-900 text-white hover:bg-gray-800">
                  Create Announcement
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Active Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div key={announcement._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                          <p className="text-gray-700 mt-1">{announcement.message}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge
                              variant="secondary"
                              className={
                                announcement.type === "warning"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : announcement.type === "success"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                              }
                            >
                              {announcement.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
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
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Create Plugin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-900">Name</Label>
                  <Input
                    placeholder="Plugin name"
                    value={newPlugin.name}
                    onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Description</Label>
                  <Textarea
                    placeholder="Plugin description"
                    value={newPlugin.description}
                    onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <Button onClick={handleCreatePlugin} className="bg-gray-900 text-white hover:bg-gray-800">
                  Create Plugin
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Manage Plugins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plugins.map((plugin) => (
                    <div key={plugin._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      {editingPlugin?._id === plugin._id ? (
                        <div className="space-y-3">
                          <Input
                            value={editingPlugin.name}
                            onChange={(e) => setEditingPlugin({ ...editingPlugin, name: e.target.value })}
                            className="border-gray-300"
                          />
                          <Textarea
                            value={editingPlugin.description}
                            onChange={(e) => setEditingPlugin({ ...editingPlugin, description: e.target.value })}
                            className="border-gray-300"
                          />
                          <div className="flex space-x-2">
                            <Button onClick={handleUpdatePlugin} size="sm" className="bg-gray-900 text-white">
                              Save
                            </Button>
                            <Button onClick={() => setEditingPlugin(null)} variant="outline" size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{plugin.name}</h4>
                            <p className="text-gray-700 mt-1">{plugin.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {plugin.installs} installs
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(plugin.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => setEditingPlugin(plugin)}
                              variant="outline"
                              size="sm"
                              className="border-gray-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeletePlugin(plugin._id)}
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(user.joined_since).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.is_tester && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Tester
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Add Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-900">Name</Label>
                  <Input
                    placeholder="Integration name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Description</Label>
                  <Textarea
                    placeholder="Integration description"
                    value={newIntegration.description}
                    onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Webhook URL (Optional)</Label>
                  <Input
                    placeholder="https://api.example.com/webhook"
                    value={newIntegration.webhook_url}
                    onChange={(e) => setNewIntegration({ ...newIntegration, webhook_url: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">API Key (Optional)</Label>
                  <Input
                    placeholder="API key"
                    type="password"
                    value={newIntegration.api_key}
                    onChange={(e) => setNewIntegration({ ...newIntegration, api_key: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <Button onClick={handleCreateIntegration} className="bg-gray-900 text-white hover:bg-gray-800">
                  Add Integration
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Available Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div key={integration._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{integration.name}</h4>
                          <p className="text-gray-700 mt-1">{integration.description}</p>
                          {integration.webhook_url && (
                            <p className="text-xs text-gray-500 mt-1">Webhook: {integration.webhook_url}</p>
                          )}
                        </div>
                        <Badge
                          variant={integration.active ? "default" : "secondary"}
                          className={integration.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {integration.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
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
