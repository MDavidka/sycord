"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, Check, Clock, Users, ExternalLink, LogIn, Star } from "lucide-react"
import Image from "next/image"

interface GiveawayData {
  id: string
  title: string
  prize: string
  description: string
  endDate: string
  winners: number
  requirements: {
    membership: boolean
    role?: string
    accountAge: boolean
    login: boolean
  }
  status: "active" | "ended"
  entries: number
  serverName?: string
  serverIcon?: string
}

export default function GiveawayPage() {
  const params = useParams()
  const giveawayId = params.giveawayId as string
  const [giveaway, setGiveaway] = useState<GiveawayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [entered, setEntered] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Mock data - in real implementation, fetch from API
    const mockGiveaway: GiveawayData = {
      id: giveawayId,
      title: "Amazing $100 Steam Gift Card Giveaway",
      prize: "$100 Steam Gift Card",
      description:
        "Win a $100 Steam gift card to spend on your favorite games! Perfect for the upcoming holiday sales.",
      endDate: "2024-12-31T23:59:59Z",
      winners: 1,
      requirements: {
        membership: true,
        role: "Member",
        accountAge: true,
        login: true,
      },
      status: "active",
      entries: 1247,
      serverName: "Gaming Community",
      serverIcon: null,
    }

    setTimeout(() => {
      setGiveaway(mockGiveaway)
      setLoading(false)
    }, 500)
  }, [giveawayId])

  const handleEnter = () => {
    if (!user && giveaway?.requirements.login) {
      // Redirect to Discord OAuth
      window.location.href = "/api/auth/signin/discord"
      return
    }

    setEntered(true)
    if (giveaway) {
      setGiveaway({ ...giveaway, entries: giveaway.entries + 1 })
    }
  }

  const timeRemaining = giveaway ? new Date(giveaway.endDate).getTime() - Date.now() : 0
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading giveaway...</p>
        </div>
      </div>
    )
  }

  if (!giveaway) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Giveaway Not Found</h2>
            <p className="text-gray-600">This giveaway doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Mobile-optimized Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Giveaway</h1>
                <p className="text-xs text-gray-600">Powered by Dash</p>
              </div>
            </div>
            {giveaway.serverName && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="hidden sm:inline">From</span>
                <div className="flex items-center space-x-1">
                  {giveaway.serverIcon ? (
                    <Image
                      src={giveaway.serverIcon || "/placeholder.svg"}
                      alt={giveaway.serverName}
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  ) : (
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  )}
                  <span className="font-medium truncate max-w-24 sm:max-w-none">{giveaway.serverName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Hero Card - Mobile Optimized */}
          <Card className="overflow-hidden shadow-xl border-0 bg-white">
            <div className="relative">
              <div className="h-24 sm:h-32 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"></div>
              <div className="absolute top-3 right-3">
                <Badge
                  variant={giveaway.status === "active" ? "default" : "secondary"}
                  className={
                    giveaway.status === "active"
                      ? "bg-green-100 text-green-800 border-green-200 shadow-sm"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }
                >
                  {giveaway.status === "active" ? "Active" : "Ended"}
                </Badge>
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <CardContent className="pt-8 pb-6 px-4 sm:px-6">
              <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight">{giveaway.title}</h1>
                {giveaway.status === "active" && timeRemaining > 0 && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {daysRemaining > 0 ? `${daysRemaining}d ` : ""}
                      {hoursRemaining}h remaining
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Prize</h3>
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
                    <p className="text-lg font-bold text-purple-700">{giveaway.prize}</p>
                  </div>
                </div>

                {giveaway.description && (
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{giveaway.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900">{giveaway.winners}</div>
                    <div className="text-sm text-gray-600">Winner{giveaway.winners > 1 ? "s" : ""}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900">{giveaway.entries.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Entries</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Card - Mobile Optimized */}
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-center sm:text-left">Entry Requirements</h3>
              <div className="space-y-3">
                {giveaway.requirements.membership && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Server membership required</span>
                  </div>
                )}
                {giveaway.requirements.role && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">Role required: {giveaway.requirements.role}</span>
                  </div>
                )}
                {giveaway.requirements.accountAge && (
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700">Account age: 30+ days</span>
                  </div>
                )}
                {giveaway.requirements.login && (
                  <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                    <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-gray-700">Discord login required</span>
                  </div>
                )}
                {!giveaway.requirements.membership &&
                  !giveaway.requirements.role &&
                  !giveaway.requirements.accountAge &&
                  !giveaway.requirements.login && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">No special requirements</span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Entry Button - Mobile Optimized */}
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-4 sm:p-6">
              {giveaway.status === "ended" ? (
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Giveaway Ended</h3>
                  <p className="text-gray-600">This giveaway has ended. Winners have been selected.</p>
                </div>
              ) : entered ? (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">You're Entered!</h3>
                  <p className="text-gray-600 mb-4">Good luck! Winners will be announced when the giveaway ends.</p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://discord.gg/invite`, "_blank")}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 w-full sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Discord Server
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    onClick={handleEnter}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg transform transition-transform hover:scale-105"
                  >
                    {giveaway.requirements.login && !user ? (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Login with Discord to Enter
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5 mr-2" />
                        Enter Giveaway
                      </>
                    )}
                  </Button>
                  {giveaway.requirements.login && (
                    <p className="text-xs text-gray-600 mt-3">
                      We'll verify your Discord account and server membership
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Powered by{" "}
              <span className="font-semibold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                Dash
              </span>{" "}
              Discord Bot
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
