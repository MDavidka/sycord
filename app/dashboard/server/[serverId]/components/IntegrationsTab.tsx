"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkIcon } from "lucide-react"

export default function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <LinkIcon className="h-6 w-6 mr-3" />
            Integrations
          </CardTitle>
          <CardDescription className="text-gray-400">
            Connect your server with other services and platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-400">Integrations are coming soon! Stay tuned for updates.</p>
        </CardContent>
      </Card>
    </div>
  )
}
