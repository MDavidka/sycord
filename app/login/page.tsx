"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

interface AppSettings {
  maintenanceMode: {
    enabled: boolean
    estimatedTime?: string
  }
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const response = await fetch("/api/app-settings")
        if (response.ok) {
          const data = await response.json()
          setAppSettings(data)
        }
      } catch (error) {
        console.error("Error fetching app settings:", error)
      }
    }
    fetchAppSettings()
  }, [])

  const handleDiscordSignIn = async () => {
    setIsLoading(true)
    await signIn("discord", { callbackUrl: "/dashboard" })
  }

  if (appSettings?.maintenanceMode.enabled) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Card className="glass-card max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">Maintenance Mode</CardTitle>
            <CardDescription className="text-gray-400">
              Sycord is currently undergoing maintenance. We'll be back shortly!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg font-semibold text-white mb-4">
              Estimated downtime: {appSettings.maintenanceMode.estimatedTime || "30 minutes"}
            </p>
            <p className="text-gray-400">Thank you for your patience.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Card className="glass-card max-w-md w-full">
        <CardHeader className="text-center">
          <Image src="/bot-icon.png" alt="Sycord Bot" width={64} height={64} className="mx-auto mb-4 rounded-lg" />
          <CardTitle className="text-3xl font-bold text-white">Login to Sycord</CardTitle>
          <CardDescription className="text-gray-400">Access your server dashboard and manage your bot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleDiscordSignIn}
            className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center py-2 text-lg"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Github className="mr-2 h-5 w-5" />}
            Login with Discord
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-400">Or continue with</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="mt-1 bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                className="mt-1 bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200">
              Login
            </Button>
          </div>
          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="#" className="underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
