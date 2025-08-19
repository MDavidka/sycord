"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Lightbulb, Wrench, Bug, CheckCircle, Clock } from "lucide-react"

interface GenerationStep {
  id: string
  icon: React.ComponentType<any>
  label: string
  status: "pending" | "active" | "completed"
  progressPercentage: number
}

interface GenerationPipelineProps {
  pluginName: string
  onComplete: (code: string, files?: { name: string; content: string }[]) => void
  isComplex?: boolean
}

export function GenerationPipeline({ pluginName, onComplete, isComplex = false }: GenerationPipelineProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [hiddenReasoning, setHiddenReasoning] = useState<string[]>([])

  const steps: GenerationStep[] = [
    {
      id: "1",
      icon: User,
      label: "Information collected",
      status: "pending",
      progressPercentage: 20,
    },
    {
      id: "2",
      icon: Lightbulb,
      label: "Planning structure",
      status: "pending",
      progressPercentage: 40,
    },
    {
      id: "3",
      icon: Wrench,
      label: "Making Python Cog",
      status: "pending",
      progressPercentage: 60,
    },
    {
      id: "4",
      icon: Bug,
      label: "Finding bugs / optimizing",
      status: "pending",
      progressPercentage: 80,
    },
    {
      id: "5",
      icon: CheckCircle,
      label: "Finishing code",
      status: "pending",
      progressPercentage: 100,
    },
  ]

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (!isComplete) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isComplete])

  // Step progression effect
  useEffect(() => {
    if (currentStep < steps.length && !isComplete) {
      const timer = setTimeout(
        () => {
          // Generate hidden reasoning for planning step
          if (currentStep === 1) {
            generatePlanningReasoning()
          }

          if (currentStep === steps.length - 1) {
            setIsComplete(true)
            generateFinalCode()
          } else {
            setCurrentStep((prev) => prev + 1)
          }
        },
        currentStep === 1 ? 3000 : 2000,
      ) // Planning step takes longer

      return () => clearTimeout(timer)
    }
  }, [currentStep, isComplete])

  const generatePlanningReasoning = () => {
    // Hidden AI reasoning (at least 20 lines as specified)
    const reasoning = [
      `Analyzing plugin requirements for ${pluginName}`,
      "Determining core functionality and command structure",
      "Planning event listeners and message handlers",
      "Designing error handling and edge case management",
      "Considering scalability and performance implications",
      "Mapping out database requirements if needed",
      "Planning user permission and role management",
      "Designing logging and monitoring capabilities",
      "Considering rate limiting and spam protection",
      "Planning configuration and customization options",
      "Designing integration with Discord API features",
      "Planning command validation and input sanitization",
      "Considering multi-server compatibility",
      "Designing backup and recovery mechanisms",
      "Planning testing and debugging strategies",
      "Considering memory usage and optimization",
      "Planning documentation and help commands",
      "Designing user feedback and notification systems",
      "Planning maintenance and update procedures",
      "Finalizing architecture and implementation approach",
    ]
    setHiddenReasoning(reasoning)
  }

  const generateFinalCode = () => {
    const sampleCode = `import discord
from discord.ext import commands

class ${pluginName.replace(/-/g, "_")}(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.data = {}

    @commands.Cog.listener()
    async def on_ready(self):
        print(f"{self.__class__.__name__} is ready!")

    @commands.command()
    async def hello(self, ctx):
        await ctx.send("Hello from ${pluginName}!")

async def setup(bot):
    await bot.add_cog(${pluginName.replace(/-/g, "_")}(bot))`

    const files = isComplex
      ? [
          { name: "main.py", content: sampleCode },
          { name: "config.py", content: "# Configuration settings\nDEBUG = True\nLOG_LEVEL = 'INFO'" },
        ]
      : undefined

    setTimeout(() => {
      onComplete(isComplex ? "" : sampleCode, files)
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" => {
    if (stepIndex < currentStep) return "completed"
    if (stepIndex === currentStep) return "active"
    return "pending"
  }

  const currentProgress = currentStep < steps.length ? steps[currentStep].progressPercentage : 100

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="relative">
              <Wrench className="h-5 w-5 text-accent" />
              <span className="absolute -bottom-1 -right-1 text-xs text-muted-foreground bg-background px-1 rounded text-[10px]">
                s1-small
              </span>
            </div>
            Plugin Generation
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(elapsedTime)}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-3 mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent/80 to-accent transition-all duration-1000 ease-out relative"
            style={{ width: `${currentProgress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">{currentProgress}% complete</div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          const status = getStepStatus(index)

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                status === "active"
                  ? "bg-accent/10 border-accent/30 animate-pulse-glow"
                  : status === "completed"
                    ? "bg-green-50 border-green-200"
                    : "bg-muted/30 border-border"
              }`}
            >
              <div className="relative flex-shrink-0">
                <Icon
                  className={`h-5 w-5 transition-colors duration-300 ${
                    status === "completed"
                      ? "text-green-600"
                      : status === "active"
                        ? "text-accent"
                        : "text-muted-foreground"
                  }`}
                />
              </div>

              <span
                className={`text-sm flex-1 transition-colors duration-300 ${
                  status === "completed"
                    ? "text-green-700 font-medium"
                    : status === "active"
                      ? "text-accent-foreground font-medium"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>

              {status === "completed" && (
                <CheckCircle className="h-4 w-4 text-green-600 animate-in fade-in duration-300" />
              )}
              {status === "active" && (
                <div className="h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )
        })}

        {/* Hidden reasoning display (for debugging - normally hidden) */}
        {process.env.NODE_ENV === "development" && hiddenReasoning.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              View AI Reasoning (Hidden in Production)
            </summary>
            <div className="mt-2 p-3 bg-muted/50 rounded text-xs space-y-1">
              {hiddenReasoning.map((line, i) => (
                <div key={i} className="text-muted-foreground">
                  {i + 1}. {line}
                </div>
              ))}
            </div>
          </details>
        )}

        {isComplete && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Plugin generation complete!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
