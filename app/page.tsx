"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BotIcon,
  ShieldIcon,
  ZapIcon,
  UsersIcon,
  TrendingUpIcon,
  StarIcon,
  ArrowRightIcon,
  SparklesIcon,
  HeartIcon,
  MessageSquareIcon,
  SettingsIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  const [serverCount, setServerCount] = useState(0)

  useEffect(() => {
    // Fetch server count
    fetch("/api/server-count")
      .then((res) => res.json())
      .then((data) => setServerCount(data.count || 0))
      .catch(() => setServerCount(0))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Image src="/bot-icon.png" alt="Dash Bot" width={24} height={24} className="rounded-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dash Bot
                </h1>
                <p className="text-xs text-muted-foreground">AI-Powered Discord Moderation</p>
              </div>
            </div>
            <Link href="/login">
              <Button
                variant="outline"
                className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950 bg-transparent"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
              <SparklesIcon className="w-3 h-3 mr-1" />
              AI-Powered Moderation
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              The Future of Discord Moderation
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Dash Bot uses advanced AI to automatically moderate your Discord server, keeping your community safe and
              engaged 24/7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => {
                const clientId = process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID
                window.open(
                  `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot`,
                  "_blank",
                )
              }}
            >
              <BotIcon className="mr-2 h-5 w-5" />
              Add to Discord
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 bg-transparent"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Open Dashboard
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="border-blue-100 bg-white/50 backdrop-blur-sm dark:border-blue-900 dark:bg-gray-800/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{serverCount.toLocaleString()}+</h3>
                <p className="text-muted-foreground">Active Servers</p>
              </CardContent>
            </Card>
            <Card className="border-purple-100 bg-white/50 backdrop-blur-sm dark:border-purple-900 dark:bg-gray-800/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">99.9%</h3>
                <p className="text-muted-foreground">Uptime</p>
              </CardContent>
            </Card>
            <Card className="border-green-100 bg-white/50 backdrop-blur-sm dark:border-green-900 dark:bg-gray-800/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ZapIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">10k+</h3>
                <p className="text-muted-foreground">Actions/Day</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to keep your Discord community safe and thriving
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-blue-100 hover:border-blue-200 transition-colors bg-white/80 backdrop-blur-sm dark:border-blue-900 dark:bg-gray-800/80">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <ShieldIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-blue-600 dark:text-blue-400">AI Moderation</CardTitle>
                <CardDescription>
                  Advanced AI automatically detects and handles spam, toxic behavior, and rule violations in real-time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-purple-100 hover:border-purple-200 transition-colors bg-white/80 backdrop-blur-sm dark:border-purple-900 dark:bg-gray-800/80">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquareIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-purple-600 dark:text-purple-400">Smart Tickets</CardTitle>
                <CardDescription>
                  Intelligent ticket system that categorizes and routes support requests to the right team members.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-green-100 hover:border-green-200 transition-colors bg-white/80 backdrop-blur-sm dark:border-green-900 dark:bg-gray-800/80">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                  <ZapIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-green-600 dark:text-green-400">Auto Events</CardTitle>
                <CardDescription>
                  Automated welcome messages, role assignments, and scheduled announcements to keep your community
                  engaged.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-100 hover:border-orange-200 transition-colors bg-white/80 backdrop-blur-sm dark:border-orange-900 dark:bg-gray-800/80">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUpIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-orange-600 dark:text-orange-400">Analytics</CardTitle>
                <CardDescription>
                  Detailed insights into your server activity, member engagement, and moderation effectiveness.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-pink-100 hover:border-pink-200 transition-colors bg-white/80 backdrop-blur-sm dark:border-pink-900 dark:bg-gray-800/80">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-pink-600 dark:text-pink-400">Easy Setup</CardTitle>
                <CardDescription>
                  Get started in minutes with our intuitive dashboard and guided setup process. No coding required.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-indigo-100 hover:border-indigo-200 transition-colors bg-white/80 backdrop-blur-sm dark:border-indigo-900 dark:bg-gray-800/80">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <StarIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-indigo-600 dark:text-indigo-400">24/7 Support</CardTitle>
                <CardDescription>
                  Round-the-clock monitoring and support to ensure your server stays protected at all times.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ready to Transform Your Server?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of Discord communities already using Dash Bot to create safer, more engaging spaces.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => {
              const clientId = process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID
              window.open(
                `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot`,
                "_blank",
              )
            }}
          >
            <BotIcon className="mr-2 h-5 w-5" />
            Add Dash Bot Now
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Image src="/bot-icon.png" alt="Dash Bot" width={20} height={20} className="rounded" />
            </div>
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dash Bot
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 Dash Bot. All rights reserved. Made with <HeartIcon className="inline h-4 w-4 text-red-500" /> for
            Discord communities.
          </p>
        </div>
      </footer>
    </div>
  )
}
