"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Code,
  Search,
  Wrench,
  Sparkles,
} from "lucide-react"
import type { PipelineStep } from "@/lib/types"

interface AnimatedTaskRowProps {
  step: PipelineStep
  isActive: boolean
  onComplete?: () => void
  onStart?: () => void
  onPause?: () => void
  onRetry?: () => void
}

export function AnimatedTaskRow({ step, isActive, onComplete, onStart, onPause, onRetry }: AnimatedTaskRowProps) {
  const [localProgress, setLocalProgress] = useState(step.progress)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (step.status === "in-progress" && isActive) {
      setIsAnimating(true)
      const interval = setInterval(() => {
        setLocalProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 5, step.progress)
          if (newProgress >= 100) {
            setIsAnimating(false)
            onComplete?.()
          }
          return newProgress
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      setLocalProgress(step.progress)
      setIsAnimating(false)
    }
  }, [step.status, step.progress, isActive, onComplete])

  const getStepIcon = () => {
    switch (step.id) {
      case "information":
        return <Search className="w-5 h-5" />
      case "planning":
        return <Zap className="w-5 h-5" />
      case "generation":
        return <Code className="w-5 h-5" />
      case "debugging":
        return <Wrench className="w-5 h-5" />
      case "finishing":
        return <Sparkles className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getStatusIcon = () => {
    if (step.status === "completed") {
      return <CheckCircle className="w-4 h-4 text-green-400" />
    } else if (step.status === "in-progress") {
      return <Play className="w-4 h-4 text-[hsl(var(--chat-accent))] animate-pulse" />
    } else if (step.status === "error") {
      return <AlertCircle className="w-4 h-4 text-red-400" />
    } else {
      return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStepDescription = () => {
    switch (step.id) {
      case "information":
        return "Gathering requirements and understanding your plugin needs"
      case "planning":
        return "Creating architecture and planning implementation strategy"
      case "generation":
        return "Writing Discord.py code with proper async/await patterns"
      case "debugging":
        return "Analyzing code for potential issues and optimizations"
      case "finishing":
        return "Final touches and preparing your plugin for deployment"
      default:
        return "Processing step..."
    }
  }

  const getCardStyle = () => {
    if (step.status === "completed") {
      return "bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
    } else if (step.status === "in-progress" && isActive) {
      return "bg-[hsl(var(--chat-accent))]/10 border-[hsl(var(--chat-accent))]/30 shadow-[0_0_25px_rgba(139,92,246,0.3)] animate-pulse-glow"
    } else if (step.status === "error") {
      return "bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
    } else {
      return "bg-gray-800/20 border-gray-700/30"
    }
  }

  const getProgressColor = () => {
    if (step.status === "completed") return "bg-green-500"
    if (step.status === "error") return "bg-red-500"
    return "bg-[hsl(var(--chat-accent))]"
  }

  return (
    <Card
      className={`transition-all duration-500 ease-out ${getCardStyle()} ${isActive ? "scale-[1.02] transform" : ""}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg transition-all duration-300 ${
                step.status === "completed"
                  ? "bg-green-500/20"
                  : step.status === "in-progress" && isActive
                    ? "bg-[hsl(var(--chat-accent))]/20 animate-pulse"
                    : step.status === "error"
                      ? "bg-red-500/20"
                      : "bg-gray-700/20"
              }`}
            >
              {getStepIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{step.name}</h3>
              <p className="text-sm text-[hsl(var(--chat-muted))] mt-1">{getStepDescription()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <Badge
              variant="outline"
              className={`transition-all duration-300 ${
                step.status === "completed"
                  ? "border-green-500/30 text-green-400"
                  : step.status === "in-progress"
                    ? "border-[hsl(var(--chat-accent))]/30 text-[hsl(var(--chat-accent))]"
                    : step.status === "error"
                      ? "border-red-500/30 text-red-400"
                      : "border-gray-500/30 text-gray-400"
              }`}
            >
              {step.status === "completed"
                ? "Complete"
                : step.status === "in-progress"
                  ? "Processing"
                  : step.status === "error"
                    ? "Error"
                    : "Pending"}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[hsl(var(--chat-muted))]">Progress</span>
            <span className="text-sm font-medium">{Math.round(localProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${getProgressColor()} ${
                isAnimating ? "animate-pulse" : ""
              }`}
              style={{
                width: `${localProgress}%`,
                transition: isAnimating ? "width 0.3s ease-out" : "width 0.5s ease-out",
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {step.status === "error" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {step.status === "pending" && isActive && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onStart}
              className="bg-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/80"
            >
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          </div>
        )}

        {step.status === "in-progress" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              className="border-[hsl(var(--chat-accent))]/30 text-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/10 bg-transparent"
            >
              <Pause className="w-3 h-3 mr-1" />
              Pause
            </Button>
          </div>
        )}

        {/* Time Information */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[hsl(var(--chat-glass-border))]">
          <div className="text-xs text-[hsl(var(--chat-muted))]">
            {step.startTime && <span>Started: {new Date(step.startTime).toLocaleTimeString()}</span>}
            {step.endTime && <span className="ml-4">Completed: {new Date(step.endTime).toLocaleTimeString()}</span>}
          </div>
          <div className="text-xs text-[hsl(var(--chat-muted))]">
            Est.{" "}
            {step.id === "information"
              ? "30s"
              : step.id === "planning"
                ? "45s"
                : step.id === "generation"
                  ? "90s"
                  : step.id === "debugging"
                    ? "60s"
                    : "30s"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
