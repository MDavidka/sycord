"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Bot, Shield, MessageSquare, Clock, Users, Zap, ArrowRight, Github, Twitter, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
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
  const [adminCode, setAdminCode] = useState("")
  const [shake, setShake] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const lastValidRef = useRef(false) // Track if last input was valid

  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const response = await fetch("/api/app-settings")
        if (response.ok) {
          const data = await response.json()
          setAppSettings(data)
        }
      } catch (error) {
        console.error("Failed to fetch app settings:", error)
      }
    }
    fetchAppSettings()
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAdminCode(value)

    if (value === ADMIN_CODE) {
      lastValidRef.current = true
      router.push("/login")
    } else {
      // If user previously typed the right code, reset
      if (lastValidRef.current) lastValidRef.current = false
      // If input length > 0 and code is wrong, trigger shake
      if (value.length > 0) {
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    }
  }

  const isMaintenanceMode = appSettings?.maintenanceMode.enabled || false
  const maintenanceTime = appSettings?.maintenanceMode.estimatedTime || "30 minutes"

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/new-blue-logo.png" alt="Sycord Bot" width={32} height={32} className="rounded-lg" />
            <span className="text-2xl font-bold">
              <span className="text-white">Sycord</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
            <Button
              className="bg-white text-black hover:bg-gray-200"
              onClick={() => router.push("/login")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <Badge variant="secondary" className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30">
            Beta Project - Admin Access Required
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Meet <span className="text-white">Sycord</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            The intelligent Discord bot that moderates your server, manages tickets, and keeps your community engaged
            with smart automation.
          </p>

          {/* Minimal Admin Code Input */}
          <div className="mx-auto" style={{ maxWidth: "360px" }}>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter admin code"
              value={adminCode}
              onChange={handleInputChange}
              className={`bg-black/50 text-white border-orange-500/30 focus:border-orange-500 transition-opacity duration-700 ease-in-out animate-fade-in ${
                shake ? "animate-shake" : ""
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {isMaintenanceMode ? (
              <Button size="lg" className="bg-gray-700 text-gray-300 cursor-not-allowed text-lg px-8 py-3">
                Under Maintenance ({maintenanceTime})
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-400">Everything you need to manage and grow your Discord community</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="glass-card hover-glow animate-fade-in">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-white">Smart Support System</CardTitle>
              <CardDescription className="text-gray-400">
                Automated ticket system with intelligent responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Automated ticket management</li>
                <li>• Custom response system</li>
                <li>• User reporting features</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in">
            <CardHeader>
              <Shield className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-white">Advanced Moderation</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive protection with fraud detection and raid protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Suspicious account filtering</li>
                <li>• Advanced fraud protection</li>
                <li>• Raid protection</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in">
            <CardHeader>
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-white">Welcome & Invite Tracking</CardTitle>
              <CardDescription className="text-gray-400">
                Welcome new members and track who invited them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Custom welcome messages</li>
                <li>• Invite tracking system</li>
                <li>• Auto role assignment</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in">
            <CardHeader>
              <Clock className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-white">Smart Announcements</CardTitle>
              <CardDescription className="text-gray-400">
                Triggered announcements and web-based giveaways
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Time-based triggers</li>
                <li>• Member count milestones</li>
                <li>• Web giveaway system</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in">
            <CardHeader>
              <Zap className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-white">Real-time Dashboard</CardTitle>
              <CardDescription className="text-gray-400">Monitor and configure your bot from anywhere</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Live server statistics</li>
                <li>• Feature toggles</li>
                <li>• Configuration management</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in">
            <CardHeader>
              <Bot className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-white">Easy Setup</CardTitle>
              <CardDescription className="text-gray-400">
                Get started in minutes with our simple setup process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• One-click Discord integration</li>
                <li>• Guided configuration</li>
                <li>• 24/7 support</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass-card border border-white/10 p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Discord Server?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of communities already using <span className="text-white font-bold">Sycord</span> to create
            better Discord experiences.
          </p>
          {isMaintenanceMode ? (
            <Button size="lg" className="bg-gray-700 text-gray-300 cursor-not-allowed text-lg px-8 py-3">
              Under Maintenance ({maintenanceTime})
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-3"
              onClick={() => router.push("/login")}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 glass-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image src="/new-blue-logo.png" alt="Sycord Bot" width={24} height={24} className="rounded" />
              <span className="text-lg font-semibold">
                <span className="text-white">Sycord</span> Bot
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <span className="text-gray-400 text-sm">© 2024 Sycord Bot. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        /* Shake animation */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s ease;
        }
      `}</style>
    </div>
  )
}