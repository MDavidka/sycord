"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Users, Crown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ServerCardProps {
  server: {
    id: string
    name: string
    icon?: string
    owner: boolean
    approximate_member_count?: number
  }
  botAdded?: boolean
}

export function ServerCard({ server, botAdded = false }: ServerCardProps) {
  const iconUrl = server.icon
    ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128`
    : "/placeholder.svg?height=64&width=64"

  return (
    <Card className="glass-card hover-glow animate-fade-in group">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Image
              src={iconUrl || "/placeholder.svg"}
              alt={server.name}
              width={64}
              height={64}
              className="rounded-xl"
            />
            {server.owner && <Crown className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{server.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              {server.approximate_member_count && (
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="h-4 w-4 mr-1" />
                  {server.approximate_member_count.toLocaleString()}
                </div>
              )}
              {server.owner && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Owner
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-4">
              {botAdded ? (
                <Link href={`/dashboard/server/${server.id}`}>
                  <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </Link>
              ) : (
                <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
                  Add Bot
                </Button>
              )}
              <Badge
                variant={botAdded ? "default" : "secondary"}
                className={
                  botAdded
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }
              >
                {botAdded ? "Active" : "Not Added"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
