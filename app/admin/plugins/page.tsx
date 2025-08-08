"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Package, Users, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Plugin {
  _id: string
  name: string
  description: string
  created_by: string
  created_at: string
  installs: number
  active: boolean
  thumbnail?: string
}

export default function AdminPluginsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlugin, setNewPlugin] = useState({
    name: "",
    description: "",
    thumbnail: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.email !== "dmarton336@gmail.com") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.email === "dmarton336@gmail.com") {
      fetchPlugins()
    }
  }, [session])

  const fetchPlugins = async () => {
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

  const handleCreatePlugin = async () => {
    if (!newPlugin.name || !newPlugin.description) return

    setCreating(true)
    try {
      const response = await fetch("/api/plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlugin),
      })

      if (response.ok) {
        setNewPlugin({ name: "", description: "", thumbnail: "" })
        setShowCreateForm(false)
        await fetchPlugins()
      }
    } catch (error) {
      console.error("Error creating plugin:", error)
    } finally {
      setCreating(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.email !== "dmarton336@gmail.com") {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Plugin Management</h1>
                <p className="text-sm text-gray-400">Manage plugins for the Dash bot platform</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="bg-white text-black hover:bg-gray-200">
              <Plus className="h-4 w-4 mr-2" />
              Create Plugin
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Create Plugin Form */}
        {showCreateForm && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-white">Create New Plugin</CardTitle>
              <CardDescription className="text-gray-400">
                Add a new plugin to the store for users to install
              </CardDescription>
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
                  placeholder="Describe what this plugin does..."
                  value={newPlugin.description}
                  onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                />
              </div>
              <div>
                <Label className="text-white text-sm mb-2 block">Thumbnail URL (Optional)</Label>
                <Input
                  placeholder="https://example.com/thumbnail.png"
                  value={newPlugin.thumbnail}
                  onChange={(e) => setNewPlugin({ ...newPlugin, thumbnail: e.target.value })}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleCreatePlugin}
                  disabled={creating || !newPlugin.name || !newPlugin.description}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {creating ? "Creating..." : "Create Plugin"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plugins List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((plugin) => (
            <Card key={plugin._id} className="glass-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                      {plugin.thumbnail ? (
                        <Image
                          src={plugin.thumbnail || "/placeholder.svg"}
                          alt={plugin.name}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{plugin.name}</CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        {new Date(plugin.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{plugin.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {plugin.installs} installs
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(plugin.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {plugins.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No plugins created yet</h3>
            <p className="text-gray-400 mb-4">Create your first plugin to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
