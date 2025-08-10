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
  const [isCodeValid, setIsCodeValid] = useState(false)
  const [shake, setShake] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Check admin code instantly on input change
  useEffect(() => {
    if (adminCode === ADMIN_CODE) {
      setIsCodeValid(true)
      // Redirect to login after short delay for UX
      setTimeout(() => {
        router.push("/login")
      }, 300)
    } else {
      setIsCodeValid(false)
    }
  }, [adminCode, router])

  // Shake animation on wrong code if user tries to proceed
  const handleInvalidCodeAttempt = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
    if (inputRef.current) inputRef.current.focus()
  }

  // Handle buttons: only redirect if code is valid
  const handleGetStarted = () => {
    if (isCodeValid) {
      router.push("/login")
    } else {
      handleInvalidCodeAttempt()
    }
  }
  const handleLogin = () => {
    if (isCodeValid) {
      router.push("/login")
    } else {
      handleInvalidCodeAttempt()
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
            {/* Mascot removed */}
            <span className="text-2xl font-bold">
              <SparklingText text="Sycord" />
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className="border-blue-700/70 text-blue-500 hover:bg-blue-900 bg-transparent"
              onClick={handleLogin}
            >
              Login
            </Button>
            <Button
              className="bg-blue-700 text-white hover:bg-blue-800"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Beta project badge removed */}

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Meet <SparklingText text="Sycord" />
          </h1>
          <TypingEffect
            text="The intelligent Discord bot that moderates your server, manages tickets, and keeps your community engaged with smart automation."
            className="text-blue-400 text-xl md:text-2xl mb-8 leading-relaxed"
          />

          {/* Minimal Admin Code Input only */}
          <Card className="glass-card border border-blue-700/50 max-w-xs mx-auto">
            <CardContent className="p-6">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter admin code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className={`bg-black/50 text-white border-blue-700 focus:border-blue-500 transition-all duration-300 ${
                  shake ? "animate-shake" : ""
                }`}
                style={{ maxWidth: "280px", margin: "0 auto" }}
                spellCheck={false}
                autoComplete="off"
              />
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            {isMaintenanceMode ? (
              <Button
                size="lg"
                className="bg-gray-700 text-gray-300 cursor-not-allowed text-lg px-8 py-3"
                disabled
              >
                Under Maintenance ({maintenanceTime})
              </Button>
            ) : (
              <Button
                size="lg"
                className={`text-lg px-8 py-3 hover-glow bg-blue-700 text-white hover:bg-blue-800`}
                onClick={handleGetStarted}
              >
                Enter Admin Code
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-400">
            Everything you need to manage and grow your Discord community
          </p>
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
              <CardDescription className="text-gray-400">
                Monitor and configure your bot from anywhere
              </CardDescription>
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
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Discord Server?
          </h2>
          <TypingEffect
            text="Join thousands of communities already using Sycord to create better Discord experiences."
            className="text-blue-400 text-xl mb-8"
          />
          {isMaintenanceMode ? (
            <Button
              size="lg"
              className="bg-gray-700 text-gray-300 cursor-not-allowed text-lg px-8 py-3"
              disabled
            >
              Under Maintenance ({maintenanceTime})
            </Button>
          ) : (
            <Button
              size="lg"
              className="text-lg px-8 py-3 hover-glow bg-blue-700 text-white hover:bg-blue-800"
              onClick={handleGetStarted}
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
              {/* Mascot removed */}
              <span className="text-lg font-semibold">
                <SparklingText text="Sycord Bot" />
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        .animate-shake {
          animation: shake 0.5s;
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-6px);
          }
          40%,
          80% {
            transform: translateX(6px);
          }
        }
        .hover-glow:hover {
          box-shadow: 0 0 8px 2px #2563eb;
        }
        .glass-card {
          background: rgba(255 255 255 / 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        .sparkle {
          position: relative;
          color: #2563eb; /* Dark Blue */
          font-weight: 900;
        }
        .sparkle::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          animation: sparkle 2.5s infinite;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        @keyframes sparkle {
          0% {
            background-position: -200%;
          }
          100% {
            background-position: 200%;
          }
        }
      `}</style>
    </div>
  )
}

// SparklingText component for minimal sparkle effect on "Sycord"
function SparklingText({ text }: { text: string }) {
  return <span className="sparkle">{text}</span>
}

// Typing effect component for blue typing text
function TypingEffect({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [displayedText, setDisplayedText] = useState("")
  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, currentIndex))
      currentIndex++
      if (currentIndex > text.length) {
        clearInterval(interval)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [text])
  return (
    <p className={className} style={{ color: "#2563eb", fontWeight: "500" }}>
      {displayedText}
      <span className="cursor">|</span>
      <style jsx>{`
        .cursor {
          display: inline-block;
          width: 1ch;
          animation: blink 1.2s steps(2, start) infinite;
        }
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </p>
  )
}