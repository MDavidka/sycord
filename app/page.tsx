"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Lock } from "lucide-react"

const ADMIN_CODE = "7625819-7528-715"

function useTypingEffect(text: string, speed = 150) {
  const [displayedText, setDisplayedText] = useState("")
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1))
      i++
      if (i === text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])
  return displayedText
}

export default function LandingPage() {
  const router = useRouter()
  const [adminCode, setAdminCode] = useState("")
  const [isCodeValid, setIsCodeValid] = useState(false)
  const [codeError, setCodeError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const titleText = "Meet "
  const sycordText = "Sycord"
  const displayedTitle = useTypingEffect(titleText, 120)
  const displayedSycord = useTypingEffect(sycordText, 150)

  // Handle admin code change & redirect if correct
  const handleAdminCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAdminCode(value)
    if (value === ADMIN_CODE) {
      setIsCodeValid(true)
      setCodeError("")
      router.push("/login")
    } else if (codeError) {
      setCodeError("")
    }
  }

  // Shake animation trigger on error
  useEffect(() => {
    if (codeError && inputRef.current) {
      inputRef.current.classList.remove("shake")
      // Trigger reflow to restart animation
      void inputRef.current.offsetWidth
      inputRef.current.classList.add("shake")
    }
  }, [codeError])

  // Lock buttons: do nothing on click unless code valid
  const handleLockedButton = () => {
    if (!isCodeValid) {
      setCodeError("Please enter a valid admin code to proceed.")
      if (inputRef.current) inputRef.current.focus()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/new-blue-logo.png" alt="Sycord Bot" width={32} height={32} className="rounded-lg" />
            <span className="text-2xl font-bold">
              {/* Title with typing and sparkling effect */}
              <span className="text-white">{displayedTitle}</span>
              <span className="relative inline-block text-blue-600 font-extrabold sparkle">
                {displayedSycord}
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className="border-blue-700 text-blue-600 hover:bg-blue-900 bg-transparent"
              onClick={handleLockedButton}
            >
              Login
            </Button>
            <Button
              className="bg-blue-700 text-white hover:bg-blue-800"
              onClick={handleLockedButton}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Removed Beta Project badge */}

          <h1 className="text-5xl md:text-7xl font-bold mb-6 select-none">
            <span className="text-white">Meet </span>
            <span className="relative inline-block text-blue-600 sparkle">
              Sycord
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            The intelligent Discord bot that moderates your server, manages tickets, and keeps your community engaged with smart automation.
          </p>

          {/* Admin Code Input */}
          <div className="mx-auto max-w-xs">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter admin code"
              value={adminCode}
              onChange={handleAdminCodeChange}
              spellCheck={false}
              autoComplete="off"
              className={`bg-black/50 text-blue-500 border-blue-700 focus:border-blue-500 focus:ring-blue-500 placeholder:text-blue-600 transition-all w-full max-w-xs mx-auto
                ${codeError ? "border-red-500 shake" : "border"}`
              }
            />
            {codeError && (
              <p className="text-red-500 text-sm mt-2 select-none">{codeError}</p>
            )}
          </div>

          {/* Buttons locked unless admin code entered */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              size="lg"
              className="bg-blue-700 text-white cursor-not-allowed text-lg px-8 py-3"
              onClick={handleLockedButton}
            >
              Enter Admin Code
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
          {/* Cards unchanged */}
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
            Join thousands of communities already using <span className="text-white font-bold">Sycord</span> to create better Discord experiences.
          </p>
          <Button
            size="lg"
            className="bg-blue-700 text-white cursor-not-allowed text-lg px-8 py-3"
            onClick={handleLockedButton}
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
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
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <span className="text-gray-400 text-sm select-none">© 2024 Sycord Bot. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* Sparkling effect for Sycord */
        .sparkle {
          position: relative;
          overflow: visible;
        }
        .sparkle::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 6px;
          height: 6px;
          background: linear-gradient(45deg, #3b82f6, #2563eb, #3b82f6);
          border-radius: 50%;
          opacity: 0.75;
          animation: sparkle 2.5s infinite;
          transform: translateX(-50%);
          filter: drop-shadow(0 0 3px #2563eb);
        }
        @keyframes sparkle {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.75;
          }
          50% {
            transform: translateX(-50%) scale(1.5);
            opacity: 0;
          }
        }

        /* Shake animation */
        .shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        /* Fade in animation */
        @keyframes fadeIn {
          from {opacity: 0;}
          to {opacity: 1;}
        }
        .animate-fade-in {
          animation: fadeIn 1s ease forwards;
        }

        /* Responsive input width */
        @media (max-width: 640px) {
          input[type="text"] {
            max-width: 250px !important;
            font-size: 1rem;
            border-width: 2px !important;
          }
        }
      `}</style>
    </div>
  )
}

// Minimal card components for features section
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg p-6 bg-black/70 border border-white/10 shadow-md ${className}`}>{children}</div>
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-semibold">{children}</h3>
}
function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-400 mt-1">{children}</p>
}
function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-2">{children}</div>
}

// Icons used in cards
import { MessageSquare, Shield, Users, Clock, Zap, Bot, Github, Twitter } from "lucide-react"
import { ArrowRight } from "lucide-react"