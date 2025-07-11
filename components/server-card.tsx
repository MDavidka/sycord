"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Server, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface DiscordGuild {
  id: string
  name: string
  icon?: string
  owner: boolean
  permissions: string
  approximate_member_count?: number
}

interface UserServer {
  serverId: string
  serverName: string
  serverIcon?: string
  isBotAdded: boolean
}

interface ServerCardProps {
  server: DiscordGuild
  isBotAdded: boolean
  isBotConfigured: boolean
  onAddBot: (serverId: string, serverName: string, serverIcon?: string) => void
}

export function ServerCard({ server, isBotAdded, isBotConfigured, onAddBot }: ServerCardProps) {
  return (
    <Card key={server.id} className="glass-card hover-glow animate-fade-in group">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Image
              src={
                server.icon
                  ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128`
                  : "/placeholder.svg?height=64&width=64"
              }
              alt={server.name}
              width={64}
              height={64}
              className="rounded-xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{server.name}</h3>
            <div className="flex items-center space-x-2 mt-2">
              <Badge
                variant={isBotAdded ? "default" : "secondary"}
                className={
                  isBotAdded
                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }
              >
                {isBotAdded ? "Bot Added" : "Waiting for Bot"}
              </Badge>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              {isBotAdded ? (
                <Link href={`/dashboard/server/${server.id}`}>
                  <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onAddBot(server.id, server.name, server.icon)}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  <Server className="h-4 w-4 mr-2" />
                  Add Bot
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
