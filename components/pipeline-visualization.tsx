"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle, Play } from "lucide-react"
import type { PipelineStep } from "@/lib/types"

interface PipelineVisualizationProps {
  steps: PipelineStep[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
}

export function PipelineVisualization({ steps, currentStep, onStepClick }: PipelineVisualizationProps) {
  const [animatedSteps, setAnimatedSteps] = useState<PipelineStep[]>(steps)

  useEffect(() => {
    setAnimatedSteps(steps)
  }, [steps])

  const getStepIcon = (step: PipelineStep, index: number) => {
    if (step.status === "completed") {
      return <CheckCircle className="w-5 h-5 text-green-400" />
    } else if (step.status === "in-progress") {
      return <Play className="w-5 h-5 text-[hsl(var(--chat-accent))] animate-pulse" />
    } else if (step.status === "error") {
      return <AlertCircle className="w-5 h-5 text-red-400" />
    } else {
      return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStepStatus = (step: PipelineStep) => {
    switch (step.status) {
      case "completed":
        return "Complete"
      case "in-progress":
        return "In Progress"
      case "error":
        return "Error"
      default:
        return "Pending"
    }
  }

  const getStepColor = (step: PipelineStep, index: number) => {
    if (step.status === "completed") {
      return "bg-green-500/20 border-green-500/30"
    } else if (step.status === "in-progress") {
      return "bg-[hsl(var(--chat-accent))]/20 border-[hsl(var(--chat-accent))]/30 animate-pulse-glow"
    } else if (step.status === "error") {
      return "bg-red-500/20 border-red-500/30"
    } else if (index <= currentStep) {
      return "bg-gray-500/20 border-gray-500/30"
    } else {
      return "bg-gray-800/20 border-gray-800/30"
    }
  }

  return (
    <Card className="chat-container">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Plugin Generation Pipeline</h3>
          <Badge variant="outline" className="text-sm">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-700 -z-10">
              <div
                className="h-full bg-[hsl(var(--chat-accent))] transition-all duration-1000 ease-out"
                style={{
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {animatedSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
                  onStepClick ? "hover:scale-105" : ""
                }`}
                onClick={() => onStepClick?.(index)}
              >
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-3 transition-all duration-300 ${getStepColor(step, index)}`}
                >
                  {getStepIcon(step, index)}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">{step.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      step.status === "completed"
                        ? "border-green-500/30 text-green-400"
                        : step.status === "in-progress"
                          ? "border-[hsl(var(--chat-accent))]/30 text-[hsl(var(--chat-accent))]"
                          : step.status === "error"
                            ? "border-red-500/30 text-red-400"
                            : "border-gray-500/30 text-gray-400"
                    }`}
                  >
                    {getStepStatus(step)}
                  </Badge>
                  {step.progress > 0 && (
                    <div className="w-16 h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[hsl(var(--chat-accent))] transition-all duration-500 animate-progress"
                        style={
                          {
                            "--progress-width": `${step.progress}%`,
                            width: `${step.progress}%`,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {animatedSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${getStepColor(step, index)} ${
                onStepClick ? "cursor-pointer hover:scale-[1.02]" : ""
              }`}
              onClick={() => onStepClick?.(index)}
            >
              <div className="flex-shrink-0">{getStepIcon(step, index)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{step.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      step.status === "completed"
                        ? "border-green-500/30 text-green-400"
                        : step.status === "in-progress"
                          ? "border-[hsl(var(--chat-accent))]/30 text-[hsl(var(--chat-accent))]"
                          : step.status === "error"
                            ? "border-red-500/30 text-red-400"
                            : "border-gray-500/30 text-gray-400"
                    }`}
                  >
                    {getStepStatus(step)}
                  </Badge>
                </div>
                {step.progress > 0 && (
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[hsl(var(--chat-accent))] transition-all duration-500"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Time Estimates */}
        <div className="mt-6 pt-4 border-t border-[hsl(var(--chat-glass-border))]">
          <div className="flex items-center justify-between text-sm text-[hsl(var(--chat-muted))]">
            <span>Estimated completion time: 3-5 minutes</span>
            <span>
              {steps.filter((s) => s.status === "completed").length} of {steps.length} completed
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
