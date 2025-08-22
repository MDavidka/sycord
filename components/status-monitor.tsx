'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

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
    <div className="flex items-center justify-center p-4 bg-gray-900 text-gray-400 text-sm">
      {isAvailable === null ? (
        <div className="flex items-center">
          <Loader className="animate-spin mr-2" size={16} />
          <span>Checking status...</span>
        </div>
      ) : isAvailable ? (
        <div className="flex items-center text-green-500">
          <CheckCircle className="mr-2" size={16} />
          <span>all systems functional</span>
        </div>
      ) : (
        <div className="flex items-center text-red-500">
          <XCircle className="mr-2" size={16} />
          <span>our site having an issue</span>
        </div>
      )}
    </div>
  )
}

export default StatusMonitor
