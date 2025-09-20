"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, GitBranch, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function StatusPage() {
  const [systemStatus, setSystemStatus] = useState<"checking" | "online" | "issues">("checking")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/status")
        const data = await response.json()
        setSystemStatus(data.status === "available" ? "online" : "issues")
      } catch (error) {
        setSystemStatus("issues")
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="hero-gradient" aria-hidden />

      <nav className="glass-card border-b border-white/10 -mt-4">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 pt-8">
            <Image src="/new-blue-logo.png" alt="Sycord Bot" width={32} height={32} className="rounded-lg" />
            <span className="text-2xl font-bold">
              <span className="text-white">Sycord</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 pt-8">
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">System Status</h1>
          <p className="text-xl text-gray-400">Current operational status of Sycord services</p>
        </div>

        {/* Main Status Display */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-center text-2xl">
              {systemStatus === "checking" && (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Checking systems...
                </>
              )}
              {systemStatus === "online" && (
                <>
                  <CheckCircle className="h-6 w-6 mr-3 text-green-400" />
                  Every system online
                </>
              )}
              {systemStatus === "issues" && (
                <>
                  <AlertCircle className="h-6 w-6 mr-3 text-orange-400" />
                  Some systems experiencing issues
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${systemStatus === "online" ? "bg-green-500" : "bg-orange-500"}`}
                ></div>
                <span className="text-gray-300">Discord Bot</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${systemStatus === "online" ? "bg-green-500" : "bg-orange-500"}`}
                ></div>
                <span className="text-gray-300">Web Dashboard</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${systemStatus === "online" ? "bg-green-500" : "bg-orange-500"}`}
                ></div>
                <span className="text-gray-300">API Services</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-6 text-sm">
                <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0" asChild>
                  <Link href="/privacy-policy">Privacy</Link>
                </Button>
                <span className="text-gray-500">|</span>
                <div className="flex items-center text-gray-400">
                  <GitBranch className="h-4 w-4 mr-1" />
                  <span className="text-xs">2c7d9</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  )
}
