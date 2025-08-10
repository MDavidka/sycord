"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Bot, Shield, MessageSquare, Clock, Users, Zap, ArrowRight, Github, Twitter, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useAnimation, AnimatePresence } from "framer-motion"

// Confetti will be dynamically imported on success
let confetti: any = null
if (typeof window !== "undefined") {
  import("canvas-confetti").then(mod => {
    confetti = mod.default
  })
}

// Hook for typing effect
function useTypingEffect(texts: string[], speed = 100, pause = 1500) {
  const [index, setIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [typing, setTyping] = useState(true)
  const charIndex = useRef(0)

  useEffect(() => {
    if (typing) {
      if (charIndex.current < texts[index].length) {
        const timeout = setTimeout(() => {
          setDisplayText((prev) => prev + texts[index][charIndex.current])
          charIndex.current++
        }, speed)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => {
          setTyping(false)
        }, pause)
        return () => clearTimeout(timeout)
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, speed / 2)
        if (displayText.length === 1) {
          // Move to next text after finishing delete
          setTimeout(() => {
            setTyping(true)
            charIndex.current = 0
            setIndex((prev) => (prev + 1) % texts.length)
          }, pause / 2)
        }
        return () => clearTimeout(timeout)
      } else {
        setTyping(true)
      }
    }
  }, [displayText, typing, texts, index, speed, pause])

  return displayText
}

const ADMIN_CODE = "7625819-7528-715"

const socialProofs = [
  { id: 1, quote: "Sycord transformed our server management!", author: "Alice, Server Admin" },
  { id: 2, quote: "Best bot for Discord moderation and tickets.", author: "Bob, Community Manager" },
  { id: 3, quote: "The invite tracking and automation saved us hours!", author: "Charlie, Guild Owner" },
]

export default function LandingPage() {
  const [appSettings, setAppSettings] = useState<any | null>(null)
  const [adminCode, setAdminCode] = useState("")
  const [isCodeValid, setIsCodeValid] = useState(false)
  const [shakeInput, setShakeInput] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const typingText = useTypingEffect([
    "Moderate smarter…",
    "Automate faster…",
    "Grow your community…",
  ], 100, 2000)

  // Social proof carousel index
  const [proofIndex, setProofIndex] = useState(0)

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
      } finally {
        setLoading(false)
      }
    }
    fetchAppSettings()
  }, [])

  // Handle admin code input instantly redirects if correct
  useEffect(() => {
    if (adminCode === ADMIN_CODE) {
      // Confetti before redirect
      if (confetti) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
      setTimeout(() => router.push("/login"), 800)
    } else if (adminCode.length === ADMIN_CODE.length) {
      // Shake if wrong code after full length
      setShakeInput(true)
      setTimeout(() => setShakeInput(false), 500)
    }
  }, [adminCode, router])

  const isMaintenanceMode = appSettings?.maintenanceMode?.enabled || false
  const maintenanceTime = appSettings?.maintenanceMode?.estimatedTime || "30 minutes"

  // Animation controls for scroll reveal
  const controls = useAnimation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const top = ref.current.getBoundingClientRect().top
      if (top < window.innerHeight - 100) {
        controls.start("visible")
      }
    }
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [controls])

  return (
    <div className="min-h-screen bg-gradient-to-r from-black via-zinc-900 to-black text-white">
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
              onClick={() => router.push(isCodeValid ? "/login" : "#")}
              disabled={!isCodeValid}
            >
              Login
            </Button>
            <Button
              className="bg-white text-black hover:bg-gray-200"
              onClick={() => router.push(isCodeValid ? "/login" : "#")}
              disabled={!isCodeValid}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <Badge variant="secondary" className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30">
            Beta Project - Admin Access Required
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Meet <span className="text-white">Sycord</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed h-10">
            <span className="border-r-2 border-white pr-2 animate-pulse">{typingText}</span>
          </p>

          {/* Animated Bot Mascot */}
          <div className="mx-auto mb-8 w-24 h-24">
            <motion.div
              whileHover={{ rotate: [0, 15, -15, 15, 0] }}
              transition={{ duration: 1 }}
              className="text-white"
            >
              <Bot size={96} />
            </motion.div>
          </div>

          {/* Admin Code Input */}
          <div className="flex justify-center">
            <motion.input
              type="text"
              placeholder="Enter admin code"
              value={adminCode}
              maxLength={ADMIN_CODE.length}
              onChange={(e) => setAdminCode(e.target.value)}
              className={`bg-black/50 text-white border-orange-500/30 focus:border-orange-500 rounded-md px-4 py-3 text-center text-lg w-72 sm:w-64 md:w-96 ${
                shakeInput ? "animate-shake border-red-500" : "border"
              }`}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              aria-label="Admin code input"
            />
          </div>
          <p className="mt-2 text-sm text-gray-400 italic">Hint: Ask your admin for the code</p>

          {/* Maintenance Button */}
          <div className="mt-8 flex justify-center">
            {isMaintenanceMode ? (
              <Button size="lg" className="bg-gray-700 text-gray-300 cursor-not-allowed text-lg px-8 py-3">
                Under Maintenance ({maintenanceTime})
              </Button>
            ) : (
              <Button
                size="lg"
                className={`text-lg px-8 py-3 hover-glow ${
                  isCodeValid
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-orange-500 hover:bg-orange-600 text-white cursor-not-allowed"
                }`}
                disabled={!isCodeValid}
              >
                {isCodeValid ? "Get Started Now" : "Enter Admin Code"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20" ref={ref}>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-400">Everything you need to manage and grow your Discord community</p>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          animate={controls}
          variants={{
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                staggerChildren: 0.2,
              },
            },
            hidden: { opacity: 0, y: 40 },
          }}
        >
          {[
            {
              icon: MessageSquare,
              title: "Smart Support System",
              description: "Automated ticket system with intelligent responses",
              items: [
                "Automated ticket management",
                "Custom response system",
                "User reporting features",
              ],
            },
            {
              icon: Shield,
              title: "Advanced Moderation",
              description: "Comprehensive protection with fraud detection and raid protection",
              items: [
                "Suspicious account filtering",
                "Advanced fraud protection",
                "Raid protection",
              ],
            },
            {
              icon: Users,
              title: "Welcome & Invite Tracking",
              description: "Welcome new members and track who invited them",
              items: [
                "Custom welcome messages",
                "Invite tracking system",
                "Auto role assignment",
              ],
            },
            {
              icon: Clock,
              title: "Smart Announcements",
              description: "Triggered announcements and web-based giveaways",
              items: [
                "Time-based triggers",
                "Member count milestones",
                "Web giveaway system",
              ],
            },
            {
              icon: Zap,
              title: "Real-time Dashboard",
              description: "Monitor and configure your bot from anywhere",
              items: [
                "Live activity monitoring",
                "Settings management",
                "Invite link generation",
              ],
            },
            {
              icon: Bot,
              title: "Custom Commands",
              description: "Tailor the bot to your server’s needs",
              items: [
                "Command customization",
                "Slash commands support",
                "Personalized bot responses",
              ],
            },
          ].map(({ icon: Icon, title, description, items }, i) => (
            <motion.div
              key={title}
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgb(255 165 0 / 0.6)" }}
              variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: 40 },
              }}
              className="glass-card p-6 rounded-lg cursor-pointer bg-zinc-900 border border-white/10 flex flex-col"
            >
              <Icon className="h-12 w-12 mb-4 text-orange-400" />
              <h3 className="text-2xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 mb-3">{description}</p>
              <ul className="list-disc list-inside text-gray-500 flex-grow">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-black/80 py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center relative">
          <h2 className="text-3xl font-bold mb-8">What Our Beta Users Say</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={proofIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-gray-300 text-lg italic mb-4"
            >
              “{socialProofs[proofIndex].quote}”
              <p className="mt-3 font-semibold text-white">— {socialProofs[proofIndex].author}</p>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center space-x-6 mt-8">
            <button
              aria-label="Previous testimonial"
              onClick={() =>
                setProofIndex((idx) => (idx === 0 ? socialProofs.length - 1 : idx - 1))
              }
              className="text-white hover:text-orange-400 transition"
            >
              &larr;
            </button>
            <button
              aria-label="Next testimonial"
              onClick={() =>
                setProofIndex((idx) => (idx + 1) % socialProofs.length)
              }
              className="text-white hover:text-orange-400 transition"
            >
              &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
          <div className="space-y-4 max-w-lg w-full px-4">
            <div className="h-12 bg-zinc-700 rounded animate-pulse" />
            <div className="h-6 bg-zinc-700 rounded animate-pulse" />
            <div className="h-6 bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Background gradient animation */
        @keyframes gradientBG {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        body {
          background: linear-gradient(-45deg, #000, #222, #444, #222);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
        }

        /* Shake animation */
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-8px);
          }
          40%,
          80% {
            transform: translateX(8px);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease;
        }

        /* Fade in animation for hero */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease forwards;
        }

        /* Glow on hover for buttons */
        .hover-glow:hover {
          box-shadow: 0 0 12px 2px rgb(255 165 0 / 0.8);
        }
      `}</style>
    </div>
  )
}