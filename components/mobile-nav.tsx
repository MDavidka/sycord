"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Bot, Settings, Users, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

interface MobileNavProps {
  currentPage?: string
}

export function MobileNav({ currentPage }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Bot },
    { href: "/dashboard/servers", label: "Servers", icon: Users },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden text-white hover:bg-white/10 p-1 h-auto">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 sm:w-80 bg-black/95 backdrop-blur-xl border-white/10 p-4">
        <div className="flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <Bot className="h-6 w-6 text-cyan-400" />
            <span className="text-xl font-bold text-white">Dash</span>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-white hover:bg-white/10 ${
                    currentPage === item.href ? "bg-white/20" : ""
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <Button
            onClick={() => signOut()}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-500/10 mt-4"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
