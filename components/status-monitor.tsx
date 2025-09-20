"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GitBranch } from "lucide-react"

const StatusDot = ({ color }: { color: string }) => <div className={`w-2 h-2 rounded-full ${color} mr-2`} />

const StatusMonitor = () => {
  const [status, setStatus] = useState<"checking" | "available" | "unavailable" | "server_down">("checking")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/status")
        const data = await response.json()
        setStatus(data.status)
      } catch (error) {
        setStatus("unavailable")
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-black border-t border-white/10">
      <div className="flex items-center justify-center p-4 text-gray-400 text-sm">
        {status === "checking" && (
          <div className="flex items-center">
            <StatusDot color="bg-gray-500" />
            <span>Checking status...</span>
          </div>
        )}
        {status === "available" && (
          <div className="flex items-center">
            <StatusDot color="bg-green-500" />
            <span>all systems functional</span>
          </div>
        )}
        {(status === "unavailable" || status === "server_down") && (
          <div className="flex items-center">
            <StatusDot color="bg-orange-500" />
            <span>our site having an issue</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center pb-3 text-xs text-gray-500 space-x-4">
        <Link href="/privacy-policy" className="hover:text-gray-400 transition-colors">
          Privacy
        </Link>
        <span className="text-gray-600">|</span>
        <div className="flex items-center space-x-1">
          <GitBranch className="h-3 w-3" />
          <span>2c7d9</span>
        </div>
      </div>
    </div>
  )
}

export default StatusMonitor
