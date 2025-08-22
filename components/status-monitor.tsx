'use client'

import { useState, useEffect } from 'react'

const StatusDot = ({ color }: { color: string }) => (
  <div className={`w-2 h-2 rounded-full ${color} mr-2`} />
)

const StatusMonitor = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('https://admin.sycord.com', {
          method: 'HEAD',
          mode: 'no-cors',
        })
        setIsAvailable(true)
      } catch (error) {
        setIsAvailable(false)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center p-4 bg-transparent text-gray-400 text-sm">
      {isAvailable === null ? (
        <div className="flex items-center">
          <StatusDot color="bg-gray-500" />
          <span>Checking status...</span>
        </div>
      ) : isAvailable ? (
        <div className="flex items-center">
          <StatusDot color="bg-green-500" />
          <span>all systems functional</span>
        </div>
      ) : (
        <div className="flex items-center">
          <StatusDot color="bg-yellow-500" />
          <span>our site having an issue</span>
        </div>
      )}
    </div>
  )
}

export default StatusMonitor
