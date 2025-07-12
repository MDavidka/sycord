"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Package,
  Search,
  Star,
  Download,
  Settings,
  ExternalLink,
  Shield,
  Bot,
  MessageSquare,
  Gift,
  BarChart3,
} from "lucide-react"
import Image from "next/image"

interface Plugin {
  id: string
  name: string
  description: string
  category: string
  rating: number
  downloads: number
  price: number
  thumbnail?: string
  author: string
  version: string
  tags: string[]
  isInstalled?: boolean
  isOfficial?: boolean
}

interface PluginsTabProps {
  serverId: string
}

export default function PluginsTab({ serverId }: PluginsTabProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [userPlugins, setUserPlugins] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  const categories = [
    { id: "all", name: "All Plugins", icon: Package },
    { id: "moderation", name: "Moderation", icon: Shield },
    { id: "utility", name: "Utility", icon: Settings },
    { id: "fun", name: "Fun & Games", icon: Gift },
    { id: "music", name: "Music", icon: MessageSquare },
    { id: "analytics", name: "Analytics", icon: BarChart3 },
    { id: "automation", name: "Automation", icon: Bot },
  ]

  useEffect(() => {
    loadPlugins()
    loadUserPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      const response = await fetch("/api/plugins")
      if (response.ok) {
        const data = await response.json()
        setPlugins(data.plugins)
      }
    } catch (error) {
      console.error("Error loading plugins:", error)
    }
  }

  const loadUserPlugins = async () => {
    try {
      const response = await fetch("/api/user-plugins")
      if (response.ok) {
        const data = await response.json()
        setUserPlugins(data.plugins)
      }
    } catch (error) {
      console.error("Error loading user plugins:", error)
    }
  }

  const handleInstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch("/api/user-plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pluginId, serverId }),
      })
      if (response.ok) {
        setUserPlugins([...userPlugins, pluginId])
      }
    } catch (error) {
      console.error("Error installing plugin:", error)
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find((cat) => cat.id === category)
    return categoryData?.icon || Package
  }

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || plugin.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading plugins...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white text-xl">Plugin Store</CardTitle>
          <CardDescription className="text-gray-400">
            Extend your server's functionality with community and official plugins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`${
                selectedCategory === category.id
                  ? "bg-white text-black"
                  : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center mr-2">
                <Icon className="h-4 w-4" />
              </div>
              {category.name}
            </Button>
          )
        })}
      </div>

      {/* Plugin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlugins.map((plugin) => {
          const CategoryIcon = getCategoryIcon(plugin.category)
          const isInstalled = userPlugins.includes(plugin.id)

          return (
            <Card key={plugin.id} className="glass-card hover:bg-white/5 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center flex-shrink-0">
                    {plugin.thumbnail ? (
                      <Image
                        src={plugin.thumbnail || "/placeholder.svg"}
                        alt={plugin.name}
                        width={48}
                        height={48}
                        className="rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = "flex"
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center ${plugin.thumbnail ? "hidden" : ""}`}
                    >
                      <CategoryIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-semibold truncate">{plugin.name}</h3>
                      {plugin.isOfficial && (
                        <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                          Official
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">{plugin.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{plugin.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="h-4 w-4" />
                      <span>{plugin.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-white font-medium">{plugin.price === 0 ? "Free" : `$${plugin.price}`}</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {plugin.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-white/20 text-gray-400">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex space-x-2">
                  {isInstalled ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10 bg-transparent"
                      disabled
                    >
                      Installed
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleInstallPlugin(plugin.id)}
                      className="flex-1 bg-white text-black hover:bg-gray-100"
                    >
                      Install
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredPlugins.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No plugins found</h3>
          <p className="text-gray-400">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  )
}
