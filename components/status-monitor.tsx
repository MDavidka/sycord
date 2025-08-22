'use client'

import { useState, useEffect } from 'react'

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
    <div className="fixed bottom-0 left-0 w-full bg-black text-white p-2 text-center text-sm">
      {isAvailable === null ? (
        <span>Checking status...</span>
      ) : isAvailable ? (
        <span>🟢 | all systems functional</span>
      ) : (
        <span>🔴 | our site having an issue</span>
      )}
    </div>
  )
}

export default StatusMonitor
