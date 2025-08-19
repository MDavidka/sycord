"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { User, Lightbulb, Wrench, Bug, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface GenerationStep {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  status: "pending" | "active" | "complete"
}

export function GenerationPipeline() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  const steps: GenerationStep[] = [
    { id: "collect", icon: User, label: "Information collected", status: "pending" },
    { id: "plan", icon: Lightbulb, label: "Planning structure", status: "pending" },
    { id: "code", icon: Wrench, label: "Making Python Cog", status: "pending" },
    { id: "debug", icon: Bug, label: "Finding bugs / optimizing", status: "pending" },
    { id: "finish", icon: CheckCircle, label: "Finishing code", status: "pending" },
  ]

  const [pipelineSteps, setPipelineSteps] = useState(steps)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)

      if (currentStep < steps.length) {
        const progressPerStep = 100 / steps.length
        const stepProgress = progressPerStep * (currentStep + 1)
        setProgress(stepProgress)

        setPipelineSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            status: index < currentStep ? "complete" : index === currentStep ? "active" : "pending",
          })),
        )

        // Move to next step after 3 seconds
        if (elapsedTime > 0 && elapsedTime % 3 === 0) {
          setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentStep, elapsedTime, steps.length])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Generation Pipeline</span>
          <div className="text-sm font-mono text-muted-foreground">{formatTime(elapsedTime)}</div>
        </CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-3">
        {pipelineSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={step.id}
              className={`generation-step ${
                step.status === "active" ? "active animate-pulse-glow" : step.status === "complete" ? "complete" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === "complete"
                    ? "bg-accent text-accent-foreground"
                    : step.status === "active"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      step.status === "active"
                        ? "text-primary"
                        : step.status === "complete"
                          ? "text-accent"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.status === "active" && <div className="text-xs text-primary font-mono">s1-small</div>}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
