'use client'

import { useState, useEffect } from 'react'

const StatusDot = ({ color }: { color: string }) => (
  <div className={`w-2 h-2 rounded-full ${color} mr-2`} />
)

const StatusMonitor = () => {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable' | 'server_down'>('checking')

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/status')
        const data = await response.json()
        setStatus(data.status)
      } catch (error) {
        setStatus('unavailable')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center p-4 text-gray-400 text-sm bg-black">
      {status === 'checking' && (
        <div className="flex items-center">
          <StatusDot color="bg-gray-500" />
          <span>Checking status...</span>
        </div>
      )}
      {status === 'available' && (
        <div className="flex items-center">
          <StatusDot color="bg-green-500" />
          <span>all systems functional</span>
        </div>
      )}
      {(status === 'unavailable' || status === 'server_down') && (
        <div className="flex items-center">
          <StatusDot color="bg-orange-500" />
          <span>our site having an issue</span>
        </div>
      )}
    </div>
  )
}

export default StatusMonitor
