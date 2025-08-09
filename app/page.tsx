"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Bot, Shield, MessageSquare, Clock, Users, Zap, ArrowRight, Github, Twitter, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AppSettings {
  maintenanceMode: {
    enabled: boolean
    estimatedTime?: string
  }
}

const ADMIN_CODE = "7625819-7528-715"

export default function LandingPage() {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [betaCode, setBetaCode] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Fetch app settings from API
    fetch("/api/app-settings")
      .then((res) => res.json())
      .then((data) => setAppSettings(data))
      .catch(() => null)
  }, [])

  const handleAccess = () => {
    if (betaCode.trim() === ADMIN_CODE) {
      router.push("/login")
    } else {
      setError("Invalid beta access code")
    }
  }

  if (appSettings?.maintenanceMode?.enabled) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-3xl font-bold">We&apos;re Under Maintenance</h1>
        <p className="mt-2">
          We&apos;re making improvements. Please check back later.
        </p>
        {appSettings.maintenanceMode.estimatedTime && (
          <p className="mt-1 text-gray-500">
            Estimated time: {appSettings.maintenanceMode.estimatedTime}
          </p>
        )}
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Example: logo or hero section */}
      <Image
        src="/new-bot-logo.png"
        alt="Bot Logo"
        width={120}
        height={120}
        className="mb-6"
      />

      <h1 className="text-4xl font-bold mb-4">Welcome to the Beta</h1>
      <p className="text-lg text-center text-gray-600 max-w-lg mb-8">
        This website is currently in beta access. Enter your beta access code below to continue.
      </p>

      {/* Replaced 'Add to Discord' with this block */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <Input
          placeholder="Enter beta access code"
          value={betaCode}
          onChange={(e) => setBetaCode(e.target.value)}
          className="h-10"
        />
        <Button onClick={handleAccess} className="h-10">
          Access Beta
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </main>
  )
}