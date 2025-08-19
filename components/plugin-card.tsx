"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, CheckCircle, Edit, Eye, EyeOff, Clock, AlertCircle } from "lucide-react"

interface GenerationStep {
  id: string
  icon: React.ComponentType<any>
  label: string
  status: "pending" | "active" | "completed"
}

interface PluginFile {
  name: string
  content: string
}

interface PluginCardProps {
  id: string
  name: string
  code: string
  files?: PluginFile[]
  isDeployed: boolean
  isComplex?: boolean
  generationSteps?: GenerationStep[]
  usageInstructions?: string
  onDeploy: (id: string) => void
  onEdit: (id: string) => void
}

export function PluginCard({
  id,
  name,
  code,
  files = [],
  isDeployed,
  isComplex = false,
  generationSteps,
  usageInstructions,
  onDeploy,
  onEdit,
}: PluginCardProps) {
  const [showCode, setShowCode] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer for generation process
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (generationSteps && !isDeployed) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [generationSteps, isDeployed])

  // Auto-progress through generation steps
  useEffect(() => {
    if (generationSteps && currentStep < generationSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
      }, 2000) // Each step takes 2 seconds
      return () => clearTimeout(timer)
    }
  }, [currentStep, generationSteps])

  const handleDeploy = async () => {
    setIsDeploying(true)

    // Simulate deployment process
    setTimeout(() => {
      setDeploySuccess(true)
      setTimeout(() => {
        onDeploy(id)
        setIsDeploying(false)
        setDeploySuccess(false)
      }, 1000)
    }, 500)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return "completed"
    if (stepIndex === currentStep) return "active"
    return "pending"
  }

  const progressPercentage = generationSteps ? Math.min((currentStep / generationSteps.length) * 100, 100) : 100

  return (
    <Card className="plugin-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <div className="flex items-center gap-2">
            {isComplex && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Complex task
              </Badge>
            )}
            {generationSteps && !isDeployed && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(elapsedTime)}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {generationSteps && !isDeployed && (
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage Instructions */}
        {usageInstructions && (
          <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-accent">
            <p className="text-sm text-muted-foreground">{usageInstructions}</p>
          </div>
        )}

        {/* Generation Steps */}
        {generationSteps && !isDeployed && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Generation Progress</h4>
            {generationSteps.map((step, index) => {
              const Icon = step.icon
              const status = getStepStatus(index)

              return (
                <div
                  key={step.id}
                  className={`generation-step ${status} ${status === "active" ? "animate-pulse-glow" : ""}`}
                >
                  <div className="relative">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="absolute -bottom-1 -right-1 text-xs text-muted-foreground bg-background px-1 rounded">
                      s1-small
                    </span>
                  </div>
                  <span className="text-sm flex-1">{step.label}</span>
                  {status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {status === "active" && (
                    <div className="h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Code Display */}
        {(showCode || isDeployed) && (code || files.length > 0) && (
          <div className="border border-border rounded-lg overflow-hidden">
            {isComplex && files.length > 0 ? (
              <Tabs defaultValue={files[0]?.name || "main.py"} className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b">
                  {files.map((file) => (
                    <TabsTrigger key={file.name} value={file.name} className="text-xs">
                      {file.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {files.map((file) => (
                  <TabsContent key={file.name} value={file.name} className="m-0">
                    <pre className="p-4 text-xs bg-muted/30 overflow-x-auto">
                      <code>{file.content}</code>
                    </pre>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <pre className="p-4 text-xs bg-muted/30 overflow-x-auto">
                <code>{code}</code>
              </pre>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isDeployed ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCode ? "Hide Code" : "Show Code"}
              </Button>

              <Button
                size="sm"
                className="flex-1 relative"
                onClick={handleDeploy}
                disabled={isDeploying || (generationSteps && currentStep < generationSteps.length)}
              >
                {deploySuccess ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : isDeploying ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Deploy
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
