"use client"

import * as React from "react"
import { signOut } from "next-auth/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { LogOut } from "lucide-react"

interface UserDetails {
  name: string
  email: string
  createdAt: string
  image: string
}

interface UserProfileProps {
  user: UserDetails
}

export function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Image
            src={user.image || "/placeholder-user.jpg"}
            alt="User Avatar"
            fill
            className="rounded-full"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 glass-card border-none mr-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12">
              <Image
                src={user.image || "/placeholder-user.jpg"}
                alt="User Avatar"
                fill
                className="rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold truncate text-white">{user.name || "User"}</p>
              {/* Badge can go here if available */}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 opacity-80">{user.email || "No email provided"}</p>
            {user.createdAt && (
              <p className="text-xs text-gray-500 mt-1">
                Account created: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
