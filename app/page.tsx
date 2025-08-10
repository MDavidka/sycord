"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const ADMIN_CODE = "7625819-7528-715"

// Typing effect for the subtitle text
function TypingEffect({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("")
  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1))
      index++
      if (index === text.length) clearInterval(interval)
    }, 80)
    return () => clearInterval(interval)
  }, [text])

  return (
    <p className="text-xl md:text-2xl leading-relaxed text-blue-700 font-mono min-h-[3rem]">
      {displayedText}
      <span className="animate-blink">|</span>
    </p>
  )
}

export default function LandingPage() {
  const [adminCode, setAdminCode] = useState("")
  const [codeError, setCodeError] = useState("")
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Shake animation class toggle
  const [shake, setShake] = useState(false)

  // When code changes, validate instantly and redirect if correct
  useEffect(() => {
    if (adminCode === ADMIN_CODE) {
      router.push("/login")
    } else if (adminCode.length === ADMIN_CODE.length) {
      // If length reached but wrong code, shake input and show error
      setShake(true)
      setCodeError("Invalid admin code.")
      setTimeout(() => setShake(false), 500)
    } else {
      setCodeError("")
    }
  }, [adminCode, router])

  // Disable buttons if code is invalid
  const isCodeValid = adminCode === ADMIN_CODE

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navigation */}
      <nav className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/new-blue-logo.png" alt="Sycord Bot" width={32} height={32} className="rounded-lg" />
            <span className="text-2xl font-bold select-none">
              {/* Title with sparkling effect on Sycord */}
              <span>Meet </span>
              <span className="relative inline-block text-white">
                <SparkleText text="Sycord" />
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent cursor-not-allowed"
              disabled={!isCodeValid}
            >
              Login
            </Button>
            <Button
              className="bg-white text-black hover:bg-gray-200 cursor-not-allowed"
              disabled={!isCodeValid}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center flex-grow flex flex-col justify-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Removed Beta Project badge as requested */}

          <TypingEffect text="The intelligent Discord bot that moderates your server, manages tickets, and keeps your community engaged with smart automation." />

          {/* Minimal input for admin code with dark blue border & shaking */}
          <div className="mt-12 flex justify-center">
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-blue-800" />
              <input
                ref={inputRef}
                type="text"
                maxLength={ADMIN_CODE.length}
                placeholder="Enter admin code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className={`bg-black/70 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 rounded-md py-2 pl-10 pr-6 w-60 sm:w-48 transition-transform ${
                  shake ? "animate-shake" : ""
                }`}
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>
          {codeError && (
            <p className="text-red-500 mt-2 select-none">{codeError}</p>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-400">Everything you need to manage and grow your Discord community</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Keeping the original cards exactly as they were */}
          {/* ... All six feature cards here ... */}
          <FeatureCard
            icon="MessageSquare"
            title="Smart Support System"
            description="Automated ticket system with intelligent responses"
            points={[
              "Automated ticket management",
              "Custom response system",
              "User reporting features",
            ]}
          />
          <FeatureCard
            icon="Shield"
            title="Advanced Moderation"
            description="Comprehensive protection with fraud detection and raid protection"
            points={[
              "Suspicious account filtering",
              "Advanced fraud protection",
              "Raid protection",
            ]}
          />
          <FeatureCard
            icon="Users"
            title="Welcome & Invite Tracking"
            description="Welcome new members and track who invited them"
            points={[
              "Custom welcome messages",
              "Invite tracking system",
              "Auto role assignment",
            ]}
          />
          <FeatureCard
            icon="Clock"
            title="Smart Announcements"
            description="Triggered announcements and web-based giveaways"
            points={[
              "Time-based triggers",
              "Member count milestones",
              "Web giveaway system",
            ]}
          />
          <FeatureCard
            icon="Zap"
            title="Real-time Dashboard"
            description="Monitor and configure your bot from anywhere"
            points={[
              "Live server statistics",
              "Feature toggles",
              "Configuration management",
            ]}
          />
          <FeatureCard
            icon="Bot"
            title="Easy Setup"
            description="Get started in minutes with our simple setup process"
            points={[
              "One-click Discord integration",
              "Guided configuration",
              "24/7 support",
            ]}
          />
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
          <Button
            size="lg"
            className="text-lg px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white cursor-not-allowed"
            disabled={!isCodeValid}
          >
            Enter Admin Code
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
              <span className="text-lg font-semibold select-none">
                <span className="text-white">Sycord</span> Bot
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.263.82-.582 0-.288-.01-1.05-.015-2.06-3.338.724-4.042-1.61-4.042-1.61-.546-1.39-1.333-1.76-1.333-1.76-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.236 1.84 1.236 1.07 1.834 2.81 1.304 3.495.997.108-.775.418-1.305.76-1.605-2.665-.3-5.466-1.335-5.466-5.933 0-1.31.47-2.38 1.236-3.22-.125-.303-.536-1.522.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.552 3.297-1.23 3.297-1.23.654 1.654.243 2.873.12 3.176.77.84 1.234 1.91 1.234 3.22 0 4.61-2.807 5.63-5.48 5.922.43.37.814 1.1.814 2.22 0 1.604-.015 2.896-.015 3.286 0 .322.216.7.824.58C20.565 21.796 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.954 4.569c-.885.385-1.83.647-2.825.765 1.014-.611 1.794-1.574 2.163-2.724-.949.555-2.005.959-3.127 1.184-.897-.959-2.178-1.559-3.594-1.559-2.723 0-4.928 2.206-4.928 4.93 0 .39.045.765.127 1.124-4.094-.205-7.725-2.168-10.158-5.144-.425.722-.666 1.561-.666 2.457 0 1.69.86 3.178 2.172 4.054-.798-.025-1.548-.245-2.203-.616v.06c0 2.362 1.678 4.331 3.91 4.778-.41.11-.84.17-1.287.17-.314 0-.615-.03-.909-.086.617 1.927 2.407 3.33 4.53 3.37-1.66 1.3-3.757 2.075-6.032 2.075-.392 0-.779-.023-1.158-.067 2.153 1.38 4.708 2.185 7.46 2.185 8.952 0 13.86-7.42 13.86-13.86 0-.21-.005-.423-.015-.632.955-.69 1.78-1.56 2.436-2.548l-.047-.02z"/></svg>
              </Link>
              <span className="text-gray-400 text-sm select-none">© 2024 Sycord Bot. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Sparkling effect CSS */}
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(-2px); }
        }
        .sparkle {
          display: inline-block;
          animation: sparkle 1.5s infinite ease-in-out;
          color: #3b82f6; /* Dark blue */
          font-weight: 700;
          position: relative;
        }
        .sparkle::after {
          content: '✦';
          position: absolute;
          top: -10px;
          right: -10px;
          font-size: 0.8rem;
          opacity: 0.6;
          animation: sparkle 1.5s infinite ease-in-out;
          animation-delay: 0.3s;
          color: #2563eb;
        }
        .animate-blink {
          animation: blink 1s steps(2, start) infinite;
        }
        @keyframes blink {
          to {
            visibility: hidden;
          }
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        .glass-card {
          background: rgba(255 255 255 / 0.05);
          backdrop-filter: saturate(180%) blur(16px);
          -webkit-backdrop-filter: saturate(180%) blur(16px);
          border-radius: 12px;
        }
        .animate-fade-in {
          animation: fadeIn 1.2s ease forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

function SparkleText({ text }: { text: string }) {
  // Minimal sparkle effect on each letter with slight delay for random sparkle
  return (
    <>
      {[...text].map((char, i) => (
        <span
          key={i}
          className="sparkle"
          style={{ animationDelay: `${(i * 200) % 1500}ms` }}
          aria-hidden="true"
        >
          {char}
        </span>
      ))}
    </>
  )
}

interface FeatureCardProps {
  icon: string
  title: string
  description: string
  points: string[]
}

function FeatureCard({ icon, title, description, points }: FeatureCardProps) {
  // Simple icon mapping from lucide-react or use placeholders
  const IconComponent = (() => {
    switch (icon) {
      case "MessageSquare": return <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      case "Shield": return <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
      case "Users": return <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-3-3.87M7 21v-2a4 4 0 0 1 3-3.87M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path></svg>
      case "Clock": return <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      case "Zap": return <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
      case "Bot": return <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6" rx="1"></rect><line x1="9" y1="15" x2="15" y2="9"></line></svg>
      default: return null
    }
  })()

  return (
    <Card className="glass-card p-6">
      <CardHeader>
        <div className="mb-3">{IconComponent}</div>
        <CardTitle>{title}</CardTitle>
        <p className="text-gray-400">{description}</p>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          {points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}