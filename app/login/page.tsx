"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2Icon, LogInIcon, Shield, Users, Zap } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push("/dashboard")
      } else {
        setIsCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  const handleDiscordLogin = async () => {
    setIsLoading(true)
    try {
      await signIn("discord", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Hitelesítés ellenőrzése...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-8 sm:py-12 mobile-optimized">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 animate-slide-up">
        {/* Header */}
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary shadow-lg flex items-center justify-center mb-4 sm:mb-6 animate-bounce-in">
            <Image src="/bot-icon.png" alt="Dash Bot" width={48} height={48} className="rounded-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Üdvözöl a Dash</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Jelentkezz be a Discord fiókodddal a szervered kezeléséhez
          </p>
        </div>

        {/* Login Card */}
        <Card className="modern-card shadow-xl border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg sm:text-xl">
              <LogInIcon className="h-5 w-5 text-primary" />
              <span>Bejelentkezés</span>
            </CardTitle>
            <CardDescription className="text-sm">Csatlakozz a Discord fiókodddal a kezdéshez</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <Button
              onClick={handleDiscordLogin}
              disabled={isLoading}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white h-11 sm:h-12 text-sm sm:text-base font-medium transition-all duration-200 hover:scale-105"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Csatlakozás...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Folytatás Discord-dal
                </>
              )}
            </Button>

            {/* Features Preview */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-muted-foreground">Biztonság</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-muted-foreground">Közösség</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-muted-foreground">Gyorsaság</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            A bejelentkezéssel elfogadod a{" "}
            <span className="text-primary hover:underline cursor-pointer">felhasználási feltételeket</span> és az{" "}
            <span className="text-primary hover:underline cursor-pointer">adatvédelmi szabályzatot</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
