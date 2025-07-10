"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2Icon, CheckCircleIcon, XCircleIcon, SaveIcon, RefreshCcwIcon } from "lucide-react"
import Image from "next/image"
import type { ServerConfig, BotSettings, DiscordGuild } from "@/lib/types"

export default function ServerConfigPage() {
  const { serverId } = useParams()
  const { data: session, status } = useSession()
  const [config, setConfig] = useState<ServerConfig | null>(null)
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null)
  const [discordGuild, setDiscordGuild] = useState<DiscordGuild | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingBotSettings, setLoadingBotSettings] = useState(true)
  const [loadingDiscordGuild, setLoadingDiscordGuild] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [botSettingsError, setBotSettingsError] = useState<string | null>(null)
  const [discordGuildError, setDiscordGuildError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated" && serverId) {
      fetchServerConfig()
      fetchBotSettings()
      fetchDiscordGuildInfo()
    }
  }, [status, serverId])

  const fetchServerConfig = async () => {
    setLoadingConfig(true)
    setConfigError(null)
    try {
      const response = await fetch(`/api/user-config/${serverId}`)
      const data = await response.json()
      if (response.ok) {
        setConfig(data.config || { moderation: { linkFilter: { whitelist: [] } } })
      } else {
        setConfigError(data.error || "Failed to load server configuration.")
        console.error("Error fetching server config:", data.error)
        setConfig({ moderation: { linkFilter: { whitelist: [] } } }) // Fallback
      }
    } catch (error) {
      setConfigError("An unexpected error occurred while fetching server configuration.")
      console.error("Fetch server config error:", error)
      setConfig({ moderation: { linkFilter: { whitelist: [] } } }) // Fallback
    } finally {
      setLoadingConfig(false)
    }
  }

  const fetchBotSettings = async () => {
    setLoadingBotSettings(true)
    setBotSettingsError(null)
    try {
      const response = await fetch(`/api/bot-settings/${serverId}`)
      const data = await response.json()
      if (response.ok) {
        setBotSettings(data.botSettings || { name: "", avatar: "", status: "offline", version: "", updatedAt: "" })
      } else {
        setBotSettingsError(data.error || "Failed to load bot settings.")
        console.error("Error fetching bot settings:", data.error)
        setBotSettings({ name: "", avatar: "", status: "offline", version: "", updatedAt: "" }) // Fallback
      }
    } catch (error) {
      setBotSettingsError("An unexpected error occurred while fetching bot settings.")
      console.error("Fetch bot settings error:", error)
      setBotSettings({ name: "", avatar: "", status: "offline", version: "", updatedAt: "" }) // Fallback
    } finally {
      setLoadingBotSettings(false)
    }
  }

  const fetchDiscordGuildInfo = async () => {
    setLoadingDiscordGuild(true)
    setDiscordGuildError(null)
    try {
      const response = await fetch(`/api/discord/guilds`) // Fetch all guilds, then find the specific one
      const data = await response.json()
      if (response.ok && data.guilds) {
        const guild = data.guilds.find((g: DiscordGuild) => g.id === serverId)
        if (guild) {
          setDiscordGuild(guild)
        } else {
          setDiscordGuildError("Discord guild not found or you don't have permissions.")
        }
      } else {
        setDiscordGuildError(data.error || "Failed to load Discord guild info.")
        console.error("Error fetching Discord guild info:", data.error)
      }
    } catch (error) {
      setDiscordGuildError("An unexpected error occurred while fetching Discord guild info.")
      console.error("Fetch Discord guild info error:", error)
    } finally {
      setLoadingDiscordGuild(false)
    }
  }

  const handleConfigChange = (key: keyof ServerConfig, value: any) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : null))
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleNestedConfigChange = (parentKey: keyof ServerConfig, childKey: string, value: any) => {
    setConfig((prev) => {
      if (!prev) return null
      const parent = prev[parentKey] as Record<string, any>
      return {
        ...prev,
        [parentKey]: {
          ...parent,
          [childKey]: value,
        },
      }
    })
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleSaveConfig = async () => {
    if (!config) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const response = await fetch(`/api/user-config/${serverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })
      const data = await response.json()
      if (response.ok) {
        setSaveSuccess(true)
        fetchServerConfig() // Optionally refetch config to ensure consistency
      } else {
        setSaveError(data.error || "Failed to save configuration.")
        console.error("Error saving config:", data.error)
      }
    } catch (error) {
      setSaveError("An unexpected error occurred while saving configuration.")
      console.error("Save config error:", error)
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loadingConfig || loadingBotSettings || loadingDiscordGuild) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2Icon className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (configError || botSettingsError || discordGuildError || !config || !botSettings || !discordGuild) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Server Data</h2>
        <p className="text-gray-600 text-center mb-4">
          {configError ||
            botSettingsError ||
            discordGuildError ||
            "Could not load server configuration or bot settings. Please ensure the bot is in this server and you have the necessary permissions."}
        </p>
        <Button
          onClick={() => {
            fetchServerConfig()
            fetchBotSettings()
            fetchDiscordGuildInfo()
          }}
          variant="outline"
        >
          <RefreshCcwIcon className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Rest of the UI rendering logic */}
    </div>
  )
}