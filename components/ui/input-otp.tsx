"use client"
import { useState, useEffect, useRef } from "react"
import React from "react"

import { cn } from "@/lib/utils"

interface InputOtpProps extends React.HTMLAttributes<HTMLElement> {
  length: number
  onChange: (value: string) => void
}

const InputOtp = React.forwardRef<HTMLDivElement, InputOtpProps>(({ className, length, onChange, ...props }, ref) => {
  const [otp, setOtp] = useState(Array(length).fill(""))
  const inputRefs = useRef<Array<HTMLInputElement>>([])

  useEffect(() => {
    // Focus on the first input when the component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [length])

  const handleChange = (index: number, value: string) => {
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    onChange(newOtp.join(""))

    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  return (
    <div className={cn("flex items-center justify-center", className)} ref={ref} {...props}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          className="w-12 h-16 text-3xl font-semibold text-center rounded border border-gray-300 focus:outline-none focus:border-blue-500 mx-1"
          value={otp[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          ref={(el) => (inputRefs.current[index] = el as HTMLInputElement)}
        />
      ))}
    </div>
  )
})

InputOtp.displayName = "InputOtp"

export { InputOtp }
