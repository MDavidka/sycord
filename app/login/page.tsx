"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn, getSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface AppSettings {
  maintenanceMode: {
    enabled: boolean
    estimatedTime?: string
  }
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push("/dashboard")
      }
    }
    checkSession()
  }, [router])

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

  const handleDiscordLogin = async () => {
    setIsLoading(true)
    try {
      await signIn("discord", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (appSettings?.maintenanceMode.enabled) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Card className="glass-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/new-bot-logo.png" alt="Sycord Bot" width={48} height={48} className="rounded-xl" />
            </div>
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/new-bot-logo.png" alt="Sycord Bot" width={48} height={48} className="rounded-xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Welcome to <span className="text-white">Sycord</span>
          </CardTitle>
          <CardDescription className="text-gray-400">Sign in with Discord to access your bot dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleDiscordLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-200 text-black hover-glow"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Connecting...
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Continue with Discord
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
