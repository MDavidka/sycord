"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedTaskRow } from "./animated-task-row"
import { Play, Pause, RotateCcw, FastForward, Settings, Download, Share } from "lucide-react"
import type { PipelineStep } from "@/lib/types"

interface PipelineFlowAnimationProps {
  sessionId: string
  onStepComplete?: (stepId: string) => void
  onPipelineComplete?: () => void
  onError?: (stepId: string, error: string) => void
}

export function PipelineFlowAnimation({
  sessionId,
  onStepComplete,
  onPipelineComplete,
  onError,
}: PipelineFlowAnimationProps) {
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: "information", name: "Information", status: "pending", progress: 0 },
    { id: "planning", name: "Planning", status: "pending", progress: 0 },
    { id: "generation", name: "Code Generation", status: "pending", progress: 0 },
    { id: "debugging", name: "Bug Finding", status: "pending", progress: 0 },
    { id: "finishing", name: "Finishing", status: "pending", progress: 0 },
  ])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [completedSteps, setCompletedSteps] = useState(0)

  const updateStepStatus = async (stepIndex: number, status: PipelineStep["status"], progress = 0) => {
    setSteps((prev) =>
      prev.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              status,
              progress,
              startTime: status === "in-progress" ? new Date().toISOString() : step.startTime,
              endTime: status === "completed" ? new Date().toISOString() : step.endTime,
            }
          : step,
      ),
    )

    // Update backend
    try {
      await fetch("/api/ai-plugin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePipeline",
          sessionId,
          stepUpdate: {
            stepId: steps[stepIndex].id,
            status,
            progress,
            currentStep: stepIndex,
            startTime: status === "in-progress" ? new Date().toISOString() : undefined,
            endTime: status === "completed" ? new Date().toISOString() : undefined,
          },
        }),
      })
    } catch (error) {
      console.error("Error updating pipeline:", error)
    }
  }

  const startStep = async (stepIndex: number) => {
    if (stepIndex >= steps.length) {
      onPipelineComplete?.()
      return
    }

    await updateStepStatus(stepIndex, "in-progress", 0)

    // Simulate step processing with realistic timing
    const stepDurations = {
      information: 3000, // 3 seconds
      planning: 4500, // 4.5 seconds
      generation: 9000, // 9 seconds
      debugging: 6000, // 6 seconds
      finishing: 3000, // 3 seconds
    }

    const stepId = steps[stepIndex].id as keyof typeof stepDurations
    const duration = stepDurations[stepId] || 5000

    // Animate progress
    const progressInterval = setInterval(() => {
      setSteps((prev) =>
        prev.map((step, index) =>
          index === stepIndex && step.status === "in-progress"
            ? { ...step, progress: Math.min(step.progress + Math.random() * 8, 95) }
            : step,
        ),
      )
    }, 200)

    // Complete step after duration
    setTimeout(async () => {
      clearInterval(progressInterval)

      // Small chance of error for demonstration
      const hasError = Math.random() < 0.1 && stepIndex > 0

      if (hasError) {
        await updateStepStatus(stepIndex, "error", steps[stepIndex].progress)
        onError?.(steps[stepIndex].id, "Simulated processing error")
      } else {
        await updateStepStatus(stepIndex, "completed", 100)
        setCompletedSteps((prev) => prev + 1)
        onStepComplete?.(steps[stepIndex].id)

        // Auto-start next step
        if (stepIndex < steps.length - 1 && isRunning) {
          setTimeout(() => {
            setCurrentStepIndex(stepIndex + 1)
            startStep(stepIndex + 1)
          }, 1000)
        } else if (stepIndex === steps.length - 1) {
          setIsRunning(false)
          onPipelineComplete?.()
        }
      }
    }, duration)
  }

  const handleStart = () => {
    setIsRunning(true)
    setIsPaused(false)
    startStep(currentStepIndex)
  }

  const handlePause = () => {
    setIsRunning(false)
    setIsPaused(true)
  }

  const handleRetry = (stepIndex: number) => {
    updateStepStatus(stepIndex, "pending", 0)
    if (isRunning) {
      startStep(stepIndex)
    }
  }

  const handleReset = () => {
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: "pending" as const,
        progress: 0,
        startTime: undefined,
        endTime: undefined,
      })),
    )
    setCurrentStepIndex(0)
    setIsRunning(false)
    setIsPaused(false)
    setCompletedSteps(0)
  }

  const handleSkipStep = () => {
    if (currentStepIndex < steps.length - 1) {
      updateStepStatus(currentStepIndex, "completed", 100)
      setCurrentStepIndex((prev) => prev + 1)
      setCompletedSteps((prev) => prev + 1)
    }
  }

  const getOverallProgress = () => {
    return Math.round((completedSteps / steps.length) * 100)
  }

  const getTotalEstimatedTime = () => {
    const remaining = steps.length - completedSteps
    return `${Math.round(remaining * 1.2)} minutes remaining`
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Control Header */}
      <Card className="chat-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Plugin Generation Pipeline</CardTitle>
              <p className="text-sm text-[hsl(var(--chat-muted))] mt-1">Automated Discord plugin creation workflow</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {completedSteps}/{steps.length} Complete
              </Badge>
              <Badge
                variant="outline"
                className={`text-sm ${
                  isRunning
                    ? "border-green-500/30 text-green-400"
                    : isPaused
                      ? "border-yellow-500/30 text-yellow-400"
                      : "border-gray-500/30 text-gray-400"
                }`}
              >
                {isRunning ? "Running" : isPaused ? "Paused" : "Stopped"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-[hsl(var(--chat-muted))]">{getTotalEstimatedTime()}</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[hsl(var(--chat-accent))] to-green-500 transition-all duration-500"
                style={{ width: `${getOverallProgress()}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-3">
            {!isRunning && !isPaused && (
              <Button
                onClick={handleStart}
                className="bg-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/80"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Pipeline
              </Button>
            )}

            {isRunning && (
              <Button onClick={handlePause} variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}

            {isPaused && (
              <Button
                onClick={handleStart}
                className="bg-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/80"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}

            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>

            {isRunning && currentStepIndex < steps.length - 1 && (
              <Button onClick={handleSkipStep} variant="outline" size="sm">
                <FastForward className="w-4 h-4 mr-2" />
                Skip Step
              </Button>
            )}

            <div className="flex-1" />

            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Animated Task Rows */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <AnimatedTaskRow
            key={step.id}
            step={step}
            isActive={index === currentStepIndex}
            onComplete={() => onStepComplete?.(step.id)}
            onStart={() => startStep(index)}
            onRetry={() => handleRetry(index)}
          />
        ))}
      </div>

      {/* Completion Actions */}
      {completedSteps === steps.length && (
        <Card className="chat-container border-green-500/30 bg-green-500/10">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Download className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Pipeline Complete!</h3>
                <p className="text-[hsl(var(--chat-muted))]">
                  Your Discord plugin has been successfully generated and is ready for download.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button className="bg-green-500 hover:bg-green-600">
                  <Download className="w-4 h-4 mr-2" />
                  Download Plugin
                </Button>
                <Button variant="outline">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
