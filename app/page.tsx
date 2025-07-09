"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, Users, Shield, MessageSquare, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const [serverCount, setServerCount] = useState(0)

  useEffect(() => {
    fetch("/api/server-count")
      .then((res) => res.json())
      .then((data) => setServerCount(data.count))
      .catch(() => setServerCount(0))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/bot-icon.png" alt="Dash Bot" width={32} height={32} className="rounded-lg" />
              <span className="text-xl font-bold text-gray-900">Dash</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent">
                  Login
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gray-900 text-white hover:bg-gray-800">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">The Ultimate Discord Bot for Your Server</h1>
            <p className="text-xl text-gray-600 mb-8">
              Powerful moderation, engaging features, and seamless management. Everything you need to build an amazing
              Discord community.
            </p>
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Link href="/login">
                <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                  Add to Discord
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{serverCount.toLocaleString()} servers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Free forever</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-lg text-gray-600">Powerful features to manage and grow your Discord community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Moderation</h3>
                <p className="text-gray-600">Advanced auto-moderation with customizable filters and actions</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome System</h3>
                <p className="text-gray-600">Greet new members with custom messages and auto-roles</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Tickets</h3>
                <p className="text-gray-600">Professional ticket system for member support</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Commands</h3>
                <p className="text-gray-600">Create custom commands and automated responses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of Discord servers using Dash to create amazing communities.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                Add to Discord
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    {/* Footer */}
<footer className="border-t border-gray-200 py-8">
  <div className="container mx-auto px-4">
    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
      <div className="flex items-center space-x-3">
        <Image src="/bot-icon.png" alt="Dash Bot" width={24} height={24} className="rounded" />
        <span className="font-semibold text-gray-900">Dash</span>
      </div>
      <div className="flex items-center space-x-6 text-sm text-gray-600">
        <span>© 2024 Dash Bot. Free forever.</span>
        <Link href="/tos" className="hover:underline text-gray-600">
          Terms of Service
        </Link>
      </div>
    </div>
  </div>
</footer>
  )
}
