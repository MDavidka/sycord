"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Bot,
  Shield,
  Zap,
  Users,
  MessageSquare,
  Settings,
  ChevronRight,
  Github,
  Twitter,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { data: session } = useSession()
  const [serverCount, setServerCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    // Fetch server count
    fetch("/api/server-count")
      .then((res) => res.json())
      .then((data) => setServerCount(data.count || 0))
      .catch(() => setServerCount(0))

    // Fetch announcements
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []))
      .catch(() => setAnnouncements([]))
  }, [])

  const features = [
    {
      icon: Bot,
      title: "Advanced Automation",
      description: "Powerful automation tools to streamline your Discord server management with intelligent workflows.",
    },
    {
      icon: Shield,
      title: "Enhanced Security",
      description: "Comprehensive moderation and security features to keep your community safe and well-managed.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance with minimal latency for seamless user experience across all features.",
    },
    {
      icon: Users,
      title: "Community Tools",
      description: "Rich set of community engagement tools including polls, events, and member management systems.",
    },
    {
      icon: MessageSquare,
      title: "Smart Messaging",
      description: "Intelligent message handling with auto-responses, templates, and advanced filtering capabilities.",
    },
    {
      icon: Settings,
      title: "Easy Configuration",
      description: "Intuitive dashboard with granular controls for customizing every aspect of your bot's behavior.",
    },
  ]

  const stats = [
    { label: "Active Servers", value: serverCount.toLocaleString() },
    { label: "Happy Users", value: "50K+" },
    { label: "Commands", value: "100+" },
    { label: "Uptime", value: "99.9%" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-foreground" />
              <span className="text-xl font-bold text-foreground">Dash Bot</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="#support" className="text-muted-foreground hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <Link href="/dashboard">
                  <Button className="bg-foreground text-background hover:bg-foreground/90">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => signIn("discord")}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="bg-muted/50 border-b border-border">
          <div className="container mx-auto px-4 py-2">
            {announcements.slice(0, 1).map((announcement) => (
              <div key={announcement._id} className="flex items-center justify-center text-center">
                <Badge variant="secondary" className="mr-2 bg-foreground text-background">
                  {announcement.type.toUpperCase()}
                </Badge>
                <span className="text-sm text-foreground">{announcement.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-muted text-muted-foreground">
              Trusted by {serverCount.toLocaleString()}+ Discord servers
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              The most powerful
              <span className="block text-muted-foreground">Discord bot platform</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform your Discord server with advanced automation, moderation, and community tools. Built for scale,
              designed for simplicity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8">
                    Open Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={() => signIn("discord")}
                  className="bg-foreground text-background hover:bg-foreground/90 px-8"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-muted/50 bg-transparent"
              >
                View Documentation
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-muted text-muted-foreground">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to manage your Discord server
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools and features designed to enhance your community experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border border-border bg-background hover:bg-muted/30 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to transform your Discord server?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of communities already using Dash Bot to enhance their Discord experience.
            </p>
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                onClick={() => signIn("discord")}
                className="bg-foreground text-background hover:bg-foreground/90 px-8"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-8 w-8 text-foreground" />
                <span className="text-xl font-bold text-foreground">Dash Bot</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                The most powerful Discord bot platform for communities of all sizes. Built with modern technology and
                designed for reliability.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#help" className="text-muted-foreground hover:text-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#status" className="text-muted-foreground hover:text-foreground transition-colors">
                    Status
                  </Link>
                </li>
                <li>
                  <Link href="#community" className="text-muted-foreground hover:text-foreground transition-colors">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">© 2024 Dash Bot. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="#terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
