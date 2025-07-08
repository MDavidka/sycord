"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"

export function Providers({ childre }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
