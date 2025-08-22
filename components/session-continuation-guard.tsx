"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  FrostedModal,
  FrostedModalContent,
  FrostedModalHeader,
  FrostedModalTitle,
  FrostedModalDescription,
} from "@/components/ui/frosted-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, Lock } from "lucide-react"

interface SessionContinuationGuardProps {
  onAllowNewSession?: () => void
  onBlockNewSession?: () => void
  children: React.ReactNode
}

export function SessionContinuationGuard({
  onAllowNewSession,
  onBlockNewSession,
  children,
}: SessionContinuationGuardProps) {
  const { data: session } = useSession()
  const [isBlocked, setIsBlocked] = useState(false)
  const [incompleteSessions, setIncompleteSessions] = useState<any[]>([])
  const [showBlockModal, setShowBlockModal] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      checkSessionStatus()
    }
  }, [session])

  const checkSessionStatus = async () => {
    try {
      const response = await fetch("/api/ai-plugin-followup")
      const data = await response.json()

      if (data.shouldEnforceFollowUp && data.incompleteSessions.length > 0) {
        setIncompleteSessions(data.incompleteSessions)
        setIsBlocked(true)
        setShowBlockModal(true)
        onBlockNewSession?.()
      } else {
        setIsBlocked(false)
        onAllowNewSession?.()
      }
    } catch (error) {
      console.error("Error checking session status:", error)
    }
  }

  const handleForceAllow = async () => {
    // Allow user to bypass enforcement (with warning)
    setIsBlocked(false)
    setShowBlockModal(false)
    onAllowNewSession?.()
  }

  const handleCompleteFirst = () => {
    setShowBlockModal(false)
    // Redirect to incomplete sessions
    window.location.href = "/ai-plugin-chat"
  }

  if (isBlocked) {
    return (
      <>
        <div className="relative">
          {/* Overlay to block interaction */}
          <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-400 mb-2">Session Blocked</h3>
                <p className="text-[hsl(var(--chat-muted))] max-w-sm">
                  Complete your existing plugin sessions before starting new ones.
                </p>
              </div>
              <Button onClick={() => setShowBlockModal(true)} className="bg-orange-500 hover:bg-orange-600">
                View Incomplete Sessions
              </Button>
            </div>
          </div>

          {/* Blurred content */}
          <div className="filter blur-sm pointer-events-none">{children}</div>
        </div>

        {/* Block Modal */}
        <FrostedModal open={showBlockModal} onOpenChange={setShowBlockModal}>
          <FrostedModalContent className="max-w-lg">
            <FrostedModalHeader>
              <FrostedModalTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                Follow-up Enforcement Active
              </FrostedModalTitle>
              <FrostedModalDescription>
                You have {incompleteSessions.length} incomplete plugin session{incompleteSessions.length > 1 ? "s" : ""}{" "}
                that require attention before starting new work.
              </FrostedModalDescription>
            </FrostedModalHeader>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <h4 className="font-medium text-orange-400 mb-2">Why is this enforced?</h4>
                <ul className="text-sm text-[hsl(var(--chat-muted))] space-y-1">
                  <li>• Prevents abandoned work and wasted resources</li>
                  <li>• Ensures quality completion of started projects</li>
                  <li>• Maintains focus on current objectives</li>
                  <li>• Improves overall development workflow</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Incomplete Sessions:</h4>
                {incompleteSessions.slice(0, 3).map((incompleteSession) => (
                  <div
                    key={incompleteSession.sessionId}
                    className="flex items-center justify-between p-2 rounded bg-gray-800/20"
                  >
                    <div>
                      <span className="text-sm font-medium">{incompleteSession.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {incompleteSession.completionPercentage}% complete
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        incompleteSession.urgency === "critical"
                          ? "border-red-500/30 text-red-400"
                          : "border-orange-500/30 text-orange-400"
                      }`}
                    >
                      {incompleteSession.urgency}
                    </Badge>
                  </div>
                ))}
                {incompleteSessions.length > 3 && (
                  <p className="text-xs text-[hsl(var(--chat-muted))]">...and {incompleteSessions.length - 3} more</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCompleteFirst}
                  className="flex-1 bg-[hsl(var(--chat-accent))] hover:bg-[hsl(var(--chat-accent))]/80"
                >
                  Complete Sessions First
                </Button>
                <Button
                  variant="outline"
                  onClick={handleForceAllow}
                  className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Override (Not Recommended)
                </Button>
              </div>

              <p className="text-xs text-[hsl(var(--chat-muted))] text-center">
                Overriding enforcement may result in reduced AI assistance quality.
              </p>
            </div>
          </FrostedModalContent>
        </FrostedModal>
      </>
    )
  }

  return <>{children}</>
}
