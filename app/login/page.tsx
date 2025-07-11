"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (result?.error) {
      setError(result.error)
    } else {
      router.push("/dashboard")
    }
  }

  const handleDiscordLogin = () => {
    signIn("discord", { callbackUrl: "/dashboard" })
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader className="text-center">
          <Image src="/new-blue-logo.png" alt="Sycord Logo" width={48} height={48} className="mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-white">Login</CardTitle>
          <CardDescription className="text-gray-400">Access your Sycord dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <p className="text-red-500 text-center">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black/60 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200">
              Login
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-400">Or continue with</span>
            </div>
          </div>
          <Button onClick={handleDiscordLogin} className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]">
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.521 3.479A16.003 16.003 0 0 0 12 0C5.373 0 0 5.373 0 12a16.003 16.003 0 0 0 3.479 8.479L2.06 22.94l2.461-.615a15.99 15.99 0 0 0 7.479 1.675c6.627 0 12-5.373 12-12a16.003 16.003 0 0 0-3.479-8.479zM8.41 15.68c-.78 0-1.41-.63-1.41-1.41s.63-1.41 1.41-1.41 1.41.63 1.41 1.41-.63 1.41-1.41 1.41zm7.18 0c-.78 0-1.41-.63-1.41-1.41s.63-1.41 1.41-1.41 1.41.63 1.41 1.41-.63 1.41-1.41 1.41zm-2.06-4.47c-.18-.06-.36-.09-.54-.09-.18 0-.36.03-.54.09-.9.3-1.53.93-1.53 1.83 0 .9.63 1.53 1.53 1.83.18.06.36.09.54.09.18 0 .36-.03.54-.09.9-.3 1.53-.93 1.53-1.83 0-.9-.63-1.53-1.53-1.83z" />
            </svg>
            Login with Discord
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
