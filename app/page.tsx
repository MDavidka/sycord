"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Bot, Shield, MessageSquare, Clock, Users, Zap, ArrowRight, Github, Twitter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface AppSettings {
  maintenanceMode: {
    enabled: boolean
    estimatedTime?: string
  }
}

const ADMIN_CODE = "7625819-7528-715"

export default function LandingPage() {
  const router = useRouter()
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [adminCode, setAdminCode] = useState("")
  const [shake, setShake] = useState(false)
  const [glowSuccess, setGlowSuccess] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const typingPhrases = [
    "Moderate smarter…",
    "Automate faster…",
    "Grow your community…"
  ]
  const [typedText, setTypedText] = useState("")
  const [typingIndex, setTypingIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const socialProof = [
    { quote: "Sycord cut moderation time in half.", who: "Nova Server" },
    { quote: "Tickets get handled automatically — love it.", who: "GameHub" },
    { quote: "Invite tracking that actually works.", who: "Study Group" }
  ]
  const [proofIndex, setProofIndex] = useState(0)

  const cardRefs = useRef<HTMLElement[]>([])

  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const response = await fetch("/api/app-settings")
        if (response.ok) {
          const data = await response.json()
          setAppSettings(data)
        } else {
          setAppSettings({ maintenanceMode: { enabled: false } })
        }
      } catch (err) {
        console.error("Failed to fetch app settings:", err)
        setAppSettings({ maintenanceMode: { enabled: false } })
      }
    }
    fetchAppSettings()
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    let timeout
    const currentPhrase = typingPhrases[typingIndex % typingPhrases.length]

    if (!isDeleting) {
      if (charIndex <= currentPhrase.length) {
        timeout = setTimeout(() => {
          setTypedText(currentPhrase.slice(0, charIndex))
          setCharIndex(c => c + 1)
        }, 80)
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 800)
      }
    } else {
      if (charIndex >= 0) {
        timeout = setTimeout(() => {
          setTypedText(currentPhrase.slice(0, charIndex))
          setCharIndex(c => c - 1)
        }, 35)
      } else {
        setIsDeleting(false)
        setTypingIndex(i => (i + 1) % typingPhrases.length)
        setCharIndex(0)
      }
    }

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, typingIndex])

  useEffect(() => {
    const id = setInterval(() => {
      setProofIndex(i => (i + 1) % socialProof.length)
    }, 4200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            el.classList.add("in-view")
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15 }
    )
    cardRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim()
    if (pasted === ADMIN_CODE) {
      e.preventDefault()
      authorize()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAdminCode(value)

    if (value.trim().length === ADMIN_CODE.length) {
      if (value.trim() === ADMIN_CODE) {
        authorize()
      } else {
        setShake(true)
        setTimeout(() => setShake(false), 520)
      }
    }
  }

  const authorize = () => {
    setGlowSuccess(true)
    setIsAuthorized(true)
    spawnConfetti()
    setTimeout(() => {
      router.push("/login")
    }, 700)
  }

  const spawnConfetti = () => {
    const parent = document.body
    const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
    for (let i = 0; i < 22; i++) {
      const el = document.createElement("span")
      el.className = "sy-confetti"
      const size = Math.floor(Math.random() * 8) + 6
      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.left = `${50 + (Math.random() - 0.5) * 40}vw`
      el.style.background = colors[Math.floor(Math.random() * colors.length)]
      el.style.transform = `rotate(${Math.random() * 360}deg)`
      parent.appendChild(el)
      setTimeout(() => {
        el.remove()
      }, 1200)
    }
  }

  const protectedNavigate = (path: string) => {
    if (isAuthorized) {
      router.push(path)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 520)
      inputRef.current?.focus()
    }
  }

  const isMaintenanceMode = appSettings?.maintenanceMode.enabled || false
  const maintenanceTime = appSettings?.maintenanceMode.estimatedTime || "30 minutes"

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="hero-gradient" aria-hidden />

      <nav className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/new-blue-logo.png" alt="Sycord Bot" width={32} height={32} className="rounded-lg" />
            <span className="text-2xl font-bold">
              <span className="sparkle-text">Sycord</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className={`border-white/20 text-white hover:bg-white/10 bg-transparent ${!isAuthorized ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => protectedNavigate("/login")}
              disabled={!isAuthorized}
            >
              Login
            </Button>
            <Button
              className={`bg-white text-black hover:bg-gray-200 ${!isAuthorized ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => protectedNavigate("/login")}
              disabled={!isAuthorized}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-center justify-center gap-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Meet <span className="sparkle-text">Sycord</span>
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-2 leading-relaxed">
            The intelligent Discord bot that moderates your server, manages tickets, and keeps your community engaged
            with smart automation.
          </p>

          <p className="text-sm mb-6 h-6 typing-text">
            {typedText}
            <span className="typing-cursor">|</span>
          </p>

          <div className="max-w-sm mx-auto">
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter admin code"
              value={adminCode}
              onChange={handleInputChange}
              onPaste={handlePaste}
              aria-label="Admin code"
              maxLength={ADMIN_CODE.length}
              className={`admin-input ${shake ? "animate-shake" : ""} ${glowSuccess ? "glow-success" : ""}`}
            />
            <p className="text-xs text-gray-500 mt-2">Hint: ask your admin for the code — or paste it here.</p>
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

      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-400">Everything you need to manage and grow your Discord community</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(appSettings === null ? Array.from({ length: 6 }) : [
            {
              Icon: MessageSquare,
              title: "Smart Support System",
              desc: "Automated ticket system with intelligent responses",
              items: ["Automated ticket management", "Custom response system", "User reporting features"]
            },
            {
              Icon: Shield,
              title: "Advanced Moderation",
              desc: "Comprehensive protection with fraud detection and raid protection",
              items: ["Suspicious account filtering", "Advanced fraud protection", "Raid protection"]
            },
            {
              Icon: Users,
              title: "Welcome & Invite Tracking",
              desc: "Welcome new members and track who invited them",
              items: ["Custom welcome messages", "Invite tracking system", "Auto role assignment"]
            },
            {
              Icon: Clock,
              title: "Smart Announcements",
              desc: "Triggered announcements and web-based giveaways",
              items: ["Time-based triggers", "Member count milestones", "Web giveaway system"]
            },
            {
              Icon: Zap,
              title: "Real-time Dashboard",
              desc: "Monitor and configure your bot from anywhere",
              items: ["Live server statistics", "Feature toggles", "Configuration management"]
            },
            {
              Icon: Bot,
              title: "Easy Setup",
              desc: "Get started in minutes with our simple setup process",
              items: ["One-click Discord integration", "Guided configuration", "24/7 support"]
            }
          ]).map((c, idx) => {
            if (appSettings === null) {
              return (
                <div key={idx} className="glass-card p-6 animate-fade-in skeleton-card" ref={el => (cardRefs.current[idx] = el as HTMLElement)}>
                  <div className="h-6 bg-white/6 rounded mb-4 w-24 animate-pulse" />
                  <div className="h-4 bg-white/6 rounded mb-2 w-48 animate-pulse" />
                  <div className="h-3 bg-white/6 rounded mt-4 w-full animate-pulse" />
                </div>
              )
            }

            const Icon = c.Icon
            return (
              <Card key={idx} className="glass-card hover-glow card-reveal" ref={el => (cardRefs.current[idx] = el as HTMLElement)}>
                <CardHeader>
                  <Icon className="h-12 w-12 text-gray-400 mb-4" />
                  <CardTitle className="text-white">{c.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {c.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-300 space-y-2">
                    {c.items.map((it, i) => <li key={i}>• {it}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="glass-card border border-white/10 p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Discord Server?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of communities already using <span className="text-white font-bold">Sycord</span> to create
            better Discord experiences.
          </p>

          <div className="mb-8">
            <blockquote className="text-gray-300 italic">“{socialProof[proofIndex].quote}”</blockquote>
            <div className="text-sm text-gray-500 mt-2">— {socialProof[proofIndex].who}</div>
          </div>

          {isMaintenanceMode ? (
            <Button size="lg" className="bg-gray-700 text-gray-300 cursor-not-allowed text-lg px-8 py-3">
              Under Maintenance ({maintenanceTime})
            </Button>
          ) : (
            <Button
              size="lg"
              className={`bg-white text-black hover:bg-gray-200 text-lg px-8 py-3 ${!isAuthorized ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => protectedNavigate("/login")}
              disabled={!isAuthorized}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </section>

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
        @keyframes fadeIn { to { opacity: 1; } }

        .hero-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 36vh;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(255,138,96,0.04), rgba(139,92,246,0.03), rgba(59,130,246,0.025));
          animation: gradientShift 12s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes gradientShift {
          0% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(25deg); }
          100% { filter: hue-rotate(0deg); }
        }

        .admin-input {
          background: rgba(255,255,255,0.03);
          color: #fff;
          border: 1px solid #1e3a8a;
          padding: 10px 12px;
          border-radius: 8px;
          text-align: center;
          width: 100%;
          max-width: 240px;
          display: block;
          margin: 0 auto;
          transition: box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease;
        }

        .admin-input::placeholder { color: rgba(255,255,255,0.5); }

        .admin-input:focus {
          outline: none;
          box-shadow: 0 6px 24px rgba(30, 58, 138, 0.18);
          border-color: #1e3a8a;
        }

        .glow-success {
          box-shadow: 0 10px 30px rgba(96, 165, 250, 0.28);
          border-color: rgba(96, 165, 250, 0.95);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.52s ease-in-out; }

        .sy-confetti {
          position: fixed;
          top: 12vh;
          z-index: 9999;
          border-radius: 2px;
          opacity: 0.95;
          animation: confettiFall 1.05s linear forwards;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(420px) rotate(360deg); opacity: 0; }
        }

        .card-reveal { opacity: 0; transform: translateY(16px); transition: all 560ms cubic-bezier(.2,.9,.2,1); }
        .card-reveal.in-view { opacity: 1; transform: translateY(0); }

        .skeleton-card { border-radius: 12px; padding: 20px; }

        .typing-cursor { opacity: 0.9; margin-left: 6px; display: inline-block; animation: blink 900ms steps(1,end) infinite; }
        @keyframes blink { 50% { opacity: 0 } }

        .sparkle-text {
          position: relative;
          display: inline-block;
          background: linear-gradient(90deg, #ffffff, #93c5fd, #ffffff);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: sparkle 4.5s linear infinite;
        }
        @keyframes sparkle {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .typing-text {
          color: #1e3a8a;
        }

        .glass-card:hover, .glass-card:focus { transform: translateY(-6px) scale(1.008); transition: transform 220ms ease; }
      `}</style>
    </div>
  )
}
