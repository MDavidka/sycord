"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    getSession().then((session) => {
      if (session) {
        router.push("/dashboard")
      }
    })
  }, [router])

  const handleDiscordLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Starting Discord login...")

      const result = await signIn("discord", {
        redirect: false,
        callbackUrl: "/dashboard",
      })

      console.log("Sign in result:", result)

      if (result?.error) {
        console.error("Sign in error:", result.error)
        setError("Failed to sign in with Discord. Please try again.")
      } else if (result?.ok) {
        console.log("Sign in successful, redirecting...")
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to DashBot</CardTitle>
          <CardDescription>Sign in with Discord to manage your servers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="w-full" onClick={handleDiscordLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign in with Discord"}
          </Button>

          <p className="text-xs text-center text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
