"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { FrostedCard, FrostedCardContent } from "@/components/ui/frosted-card"
import {
  FrostedModal,
  FrostedModalContent,
  FrostedModalHeader,
  FrostedModalTitle,
  FrostedModalDescription,
} from "@/components/ui/frosted-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Clock, Zap, RotateCcw, Play, X, CheckCircle } from "lucide-react"

interface IncompleteSession {
  sessionId: string
  name: string
  description: string
  currentStep: number
  totalSteps: number
  urgency: "low" | "medium" | "high" | "critical"
  hoursSinceUpdate: number
  completionPercentage: number
  last_updated: string
}

interface FollowUpEnforcementProps {
  onSessionResume?: (sessionId: string) => void
  onSessionAbandon?: (sessionId: string) => void
}

export function FollowUpEnforcement({ onSessionResume, onSessionAbandon }: FollowUpEnforcementProps) {
  const { data: session } = useSession()
  const [incompleteSessions, setIncompleteSessions] = useState<IncompleteSession[]>([])
  const [showEnforcementModal, setShowEnforcementModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<IncompleteSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      fetchIncompleteSessions()

      // Set up periodic checks for follow-up enforcement
      const interval = setInterval(fetchIncompleteSessions, 5 * 60 * 1000) // Check every 5 minutes
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchIncompleteSessions = async () => {
    try {
      const response = await fetch("/api/ai-plugin-followup")
      const data = await response.json()

      if (data.incompleteSessions) {
        setIncompleteSessions(data.incompleteSessions)

        // Show enforcement modal if there are critical sessions
        if (data.criticalSessions > 0 && !showEnforcementModal) {
          setShowEnforcementModal(true)
        }
      }
    } catch (error) {
      console.error("Error fetching incomplete sessions:", error)
    }
  }

  const handleResumeSession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai-plugin-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resumeSession",
          sessionId,
        }),
      })

      if (response.ok) {
        onSessionResume?.(sessionId)
        await fetchIncompleteSessions()
        setShowEnforcementModal(false)
      }
    } catch (error) {
      console.error("Error resuming session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAbandonSession = async (sessionId: string, reason: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai-plugin-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "abandonSession",
          sessionId,
          reason,
        }),
      })

      if (response.ok) {
        onSessionAbandon?.(sessionId)
        await fetchIncompleteSessions()
        setShowEnforcementModal(false)
      }
    } catch (error) {
      console.error("Error abandoning session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case "high":
        return <Zap className="w-5 h-5 text-orange-400" />
      case "medium":
        return <Clock className="w-5 h-5 text-yellow-400" />
      default:
        return <CheckCircle className="w-5 h-5 text-blue-400" />
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "border-red-500/30 bg-red-500/10"
      case "high":
        return "border-orange-500/30 bg-orange-500/10"
      case "medium":
        return "border-yellow-500/30 bg-yellow-500/10"
      default:
        return "border-blue-500/30 bg-blue-500/10"
    }
  }

  const getTimeMessage = (hours: number) => {
    if (hours < 1) return "Less than an hour ago"
    if (hours < 24) return `${hours} hours ago`
    const days = Math.round(hours / 24)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  if (incompleteSessions.length === 0) {
    return null
  }

  return (
    <>
      {/* Incomplete Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Incomplete Plugin Sessions</h3>
          <Badge variant="outline" className="text-sm">
            {incompleteSessions.length} pending
          </Badge>
        </div>

        {incompleteSessions.map((incompleteSession) => (
          <FrostedCard
            key={incompleteSession.sessionId}
            className={`transition-all duration-300 ${getUrgencyColor(incompleteSession.urgency)}`}
            hover={true}
          >
            <FrostedCardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getUrgencyIcon(incompleteSession.urgency)}
                  <div>
                    <h4 className="font-medium">{incompleteSession.name}</h4>
                    <p className="text-sm text-[hsl(var(--chat-muted))] mt-1">{incompleteSession.description}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    incompleteSession.urgency === "critical"
                      ? "border-red-500/30 text-red-400"
                      : incompleteSession.urgency === "high"
                        ? "border-orange-500/30 text-orange-400"
                        : incompleteSession.urgency === "medium"
                          ? "border-yellow-500/30 text-yellow-400"
                          : "border-blue-500/30 text-blue-400"
                  }`}
                >
                  {incompleteSession.urgency.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[hsl(var(--chat-muted))]">Progress</span>
                    <span className="text-sm font-medium">{incompleteSession.completionPercentage}%</span>
                  </div>
                  <Progress value={incompleteSession.completionPercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--chat-muted))]">
                    Last updated: {getTimeMessage(incompleteSession.hoursSinceUpdate)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResumeSession(incompleteSession.sessionId)}
                      disabled={isLoading}
                      className="bg-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/80"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSession(incompleteSession)
                        setShowEnforcementModal(true)
                      }}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Options
                    </Button>
                  </div>
                </div>
              </div>
            </FrostedCardContent>
          </FrostedCard>
        ))}
      </div>

      {/* Enforcement Modal */}
      <FrostedModal open={showEnforcementModal} onOpenChange={setShowEnforcementModal}>
        <FrostedModalContent className="max-w-md">
          <FrostedModalHeader>
            <FrostedModalTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Complete Your Plugin
            </FrostedModalTitle>
            <FrostedModalDescription>
              {selectedSession ? (
                <>
                  Your "{selectedSession.name}" plugin is {selectedSession.completionPercentage}% complete. It was last
                  updated {getTimeMessage(selectedSession.hoursSinceUpdate)}.
                </>
              ) : (
                "You have incomplete plugin sessions that need your attention."
              )}
            </FrostedModalDescription>
          </FrostedModalHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="font-medium text-yellow-400 mb-2">Follow-up Enforcement Active</h4>
              <p className="text-sm text-[hsl(var(--chat-muted))]">
                To maintain quality and prevent abandoned work, you must complete or properly close your current
                sessions before starting new ones.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => selectedSession && handleResumeSession(selectedSession.sessionId)}
                disabled={isLoading}
                className="flex-1 bg-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/80"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume Session
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  selectedSession && handleAbandonSession(selectedSession.sessionId, "User chose to abandon session")
                }
                disabled={isLoading}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Abandon
              </Button>
            </div>

            <p className="text-xs text-[hsl(var(--chat-muted))] text-center">
              Abandoning sessions may affect your ability to start new plugin generations.
            </p>
          </div>
        </FrostedModalContent>
      </FrostedModal>
    </>
  )
}
