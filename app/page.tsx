"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Typing effect
  const typingPhrases = [
    "Moderate smarter…",
    "Automate faster…",
    "Grow your community…"
  ]
  const [typedText, setTypedText] = useState("")
  const [typingIndex, setTypingIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Social proof rotator
  const socialProof = [
    { quote: "Sycord cut moderation time in half.", who: "Nova Server" },
    { quote: "Tickets get handled automatically — love it.", who: "GameHub" },
    { quote: "Invite tracking that actually works.", who: "Study Group" }
  ]
  const [proofIndex, setProofIndex] = useState(0)

  // For scroll-triggered reveals
  const cardRefs = useRef<HTMLElement[]>([])

  useEffect(() => {
    // fetch app settings (skeleton shown until loaded)
    const fetchAppSettings = async () => {
      try {
        const response = await fetch("/api/app-settings")
        if (response.ok) {
          const data = await response.json()
          setAppSettings(data)
        } else {
          // keep null -> show skeletons
          setAppSettings({ maintenanceMode: { enabled: false } })
        }
      } catch (err) {
        console.error("Failed to fetch app settings:", err)
        setAppSettings({ maintenanceMode: { enabled: false } })
      }
    }
    fetchAppSettings()
  }, [])

  // Autofocus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Typing effect loop
  useEffect(() => {
    let timeout: any
    const currentPhrase = typingPhrases[typingIndex % typingPhrases.length]

    if (!isDeleting) {
      if (charIndex <= currentPhrase.length) {
        timeout = setTimeout(() => {
          setTypedText(currentPhrase.slice(0, charIndex))
          setCharIndex(c => c + 1)
        }, 80)
      } else {
        // pause then start deleting
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

  // Social proof rotator
  useEffect(() => {
    const id = setInterval(() => {
      setProofIndex(i => (i + 1) % socialProof.length)
    }, 4200)
    return () => clearInterval(id)
  }, [])

  // IntersectionObserver for reveal
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

  // handle paste (immediate redirect if exact)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim()
    if (pasted === ADMIN_CODE) {
      e.preventDefault()
      triggerSuccessThenRedirect()
    }
    // otherwise allow normal paste
  }

  // input change: redirect immediately if exact-length and matches
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAdminCode(value)

    if (value.trim().length === ADMIN_CODE.length) {
      if (value.trim() === ADMIN_CODE) {
        triggerSuccessThenRedirect()
      } else {
        setShake(true)
        setTimeout(() => setShake(false), 520)
      }
    }
  }

  // confetti + glow then redirect
  const triggerSuccessThenRedirect = () => {
    setGlowSuccess(true)
    spawnConfetti()
    setTimeout(() => {
      router.push("/login")
    }, 700)
  }

  // small confetti impl (lightweight DOM + CSS)
  const spawnConfetti = () => {
    const parent = document.body
    const colors = ["#FFB86B", "#FF8A80", "#8BE9FD", "#C3FF88", "#FFD580"]
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

  const isMaintenanceMode = appSettings?.maintenanceMode.enabled || false
  const maintenanceTime = appSettings?.maintenanceMode.estimatedTime || "30 minutes"

  return (
    <div className="min-h-screen bg-black text-white">
      {/* subtle animated gradient background for hero */}
      <div className="hero-gradient" aria-hidden />

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
              disabled={!adminCode || adminCode !== ADMIN_CODE}
            >
              Login
            </Button>
            <Button
              className="bg-white text-black hover:bg-gray-200"
              onClick={() => router.push("/login")}
              disabled={!adminCode || adminCode !== ADMIN_CODE}
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

          <div className="flex items-center justify-center gap-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Meet <span className="text-white">Sycord</span>
            </h1>

            {/* Mascot - small bot SVG that waves on hover */}
            <div className="mascot" title="Sycord">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="3" fill="rgba(255,255,255,0.06)"/>
                <circle cx="8.5" cy="11.5" r="1.4" fill="#fff"/>
                <circle cx="15.5" cy="11.5" r="1.4" fill="#fff"/>
                <rect x="10" y="15" width="4" height="1.2" rx="0.6" fill="#fff" />
                <path className="mascot-arm" d="M18 8c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z" fill="#fff"/>
              </svg>
            </div>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-2 leading-relaxed">
            The intelligent Discord bot that moderates your server, manages tickets, and keeps your community engaged
            with smart automation.
          </p>

          {/* typing microheadline */}
          <p className="text-sm text-blue-700 mb-6 h-6">
            {typedText}
            <span className="typing-cursor">|</span>
          </p>

          {/* Compact Admin Code Input */}
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
              className={`admin-input-modern ${shake ? "animate-shake" : ""} ${glowSuccess ? "glow-success" : ""}`}
              autoComplete="off"
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

            const Icon = (c as any).Icon
            return (
              <Card key={idx} className="glass-card hover-glow card-reveal" ref={el => (cardRefs.current[idx] = el as HTMLElement)}>
                <CardHeader>
                  <Icon className="h-12 w-12 text-gray-400 mb-4" />
                  <CardTitle className="text-white">{(c as any).title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {(c as any).desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-300 space-y-2">
                    {((c as any).items as string[]).map((it, i) => <li key={i}>• {it}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA + Social Proof */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass-card border border-white/10 p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Discord Server?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of communities already using <span className="text-white font-bold">Sycord</span> to create
            better Discord experiences.
          </p>

          {/* small rotating social proof */}
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
              className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-3"
              onClick={() => router.push("/login")}
              disabled={!adminCode || adminCode !== ADMIN_CODE}
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

      {/* Local styles kept here */}
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
          z-index: -1;
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%;}
          50% { background-position: 100% 50%;}
        }

        .admin-input-modern {
          width: 100%;
          padding: 0.5rem 1rem;
          font-size: 1.125rem;
          border-radius: 0.5rem;
          border: 2px solid #d1d5db; /* Tailwind gray-300 */
          background-color: #f3f4f6; /* Tailwind gray-100 */
          color: #111827; /* Tailwind gray-900 */
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .admin-input-modern:focus {
          outline: none;
          border-color: #3b82f6; /* Tailwind blue-500 */
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
        }

        .animate-shake {
          animation: shake 0.52s cubic-bezier(.36,.07,.19,.97) both;
          transform-origin: center;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }

        .glow-success {
          border-color: #34d399 !important; /* Tailwind green-400 */
          box-shadow: 0 0 8px #34d399;
          animation: glowPulse 1.2s ease-in-out infinite alternate;
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 4px #34d399; }
          100% { box-shadow: 0 0 12px #34d399; }
        }

        .typing-cursor {
          animation: blink 1.2s steps(2) infinite;
          color: #3b82f6;
          font-weight: 700;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .glass-card {
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: saturate(180%) blur(20px);
          border-radius: 1rem;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
          color: #ddd;
          transition: box-shadow 0.3s ease;
        }
        .glass-card:hover {
          box-shadow: 0 0 35px #3b82f6;
        }

        .card-reveal {
          opacity: 0;
          transform: translateY(15px);
          transition: all 0.5s ease;
        }
        .card-reveal.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        .skeleton-card > div {
          border-radius: 0.375rem;
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.05) 63%);
          background-size: 400% 100%;
          animation: skeleton-loading 1.4s ease infinite;
        }
        @keyframes skeleton-loading {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }

        /* confetti style */
        .sy-confetti {
          position: fixed;
          z-index: 9999;
          border-radius: 50%;
          pointer-events: none;
          animation: confetti-fall 1.2s forwards ease-out;
          opacity: 1;
        }
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}