"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordLogoIcon } from "@radix-ui/react-icons"
import Image from "next/image"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader className="text-center">
          <Image src="/new-blue-logo.png" alt="Sycord Bot" width={64} height={64} className="mx-auto mb-4 rounded-lg" />
          <CardTitle className="text-3xl font-bold text-white">Welcome to Sycord</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your Discord server with advanced bot features.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Button
            onClick={() => signIn("discord")}
            className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors py-2 px-4 rounded-md flex items-center justify-center space-x-2"
          >
            <DiscordLogoIcon className="h-5 w-5" />
            <span>Login with Discord</span>
          </Button>
          <p className="text-xs text-gray-500">
            By logging in, you agree to our{" "}
            <a href="#" className="underline hover:text-gray-300">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-gray-300">
              Privacy Policy
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
