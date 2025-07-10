"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LogOutIcon,
  SettingsIcon,
  BotIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCcwIcon,
  Loader2Icon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { UserServer } from "@/lib/types"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [loadingUserServers, setLoadingUserServers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserServers()
    }
  }, [status, session])

  const fetchUserServers = async () => {
    setLoadingUserServers(true)
    setError(null)
    try {
      const response = await fetch("/api/user-servers")
      if (!response.ok) {
        throw new Error("Failed to fetch servers")
      }
      const data = await response.json()
      setUserServers(data.userServers || [])
    } catch (error) {
      console.error("Error fetching user servers:", error)
      setError("Failed to load your servers")
      setUserServers([])
    } finally {
      setLoadingUserServers(false)
    }
  }

  const getBotInviteLink = (serverId: string) => {
    return `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_BOT_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${serverId}`
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2Icon className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image src="/bot-icon.png" alt="Dash Bot" width={40} height={40} className="rounded-full" />
          <h1 className="text-xl font-bold text-gray-900">Dash</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Image
                src={session?.user?.image || "/placeholder-user.jpg"}
                alt="User Avatar"
                width={36}
                height={36}
                className="rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Your Servers</h2>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button onClick={fetchUserServers} className="mt-2 bg-transparent" variant="outline">
              <RefreshCcwIcon className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </Alert>
        )}

        {loadingUserServers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-10 w-24" />
              </Card>
            ))}
          </div>
        ) : userServers.length === 0 ? (
          <div className="text-center py-16">
            <BotIcon className="mx-auto h-20 w-20 text-gray-400 mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No servers added yet!</h3>
            <p className="text-gray-600 mb-6">Add your Discord servers to get started with Dash.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userServers.map((server) => (
              <Card key={server.serverId} className="p-4 flex flex-col items-center text-center shadow-sm bg-white">
                <Image
                  src={server.serverIcon || "/placeholder-logo.svg"}
                  alt={server.serverName}
                  width={80}
                  height={80}
                  className="rounded-full mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{server.serverName}</h3>
                {server.isBotAdded ? (
                  <div className="flex items-center text-green-600 mb-4">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span>Bot Added</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-red-500 mb-4">
                    <div className="flex items-center mb-2">
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      <span>Bot Not Added</span>
                    </div>
                    <a
                      href={getBotInviteLink(server.serverId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Invite the bot
                    </a>
                  </div>
                )}
                <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  <Link href={`/dashboard/server/${server.serverId}`}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Configure
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
