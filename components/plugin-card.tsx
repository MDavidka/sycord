"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, Play, Download, Edit, CheckCircle } from "lucide-react"
import { useState } from "react"

interface Plugin {
  id: string
  name: string
  code: string
  deployed: boolean
  lastModified: Date
  usageInstructions?: string
}

interface PluginCardProps {
  plugin: Plugin
  onDeploy: (plugin: Plugin) => void
  isGenerating?: boolean
}

export function PluginCard({ plugin, onDeploy, isGenerating }: PluginCardProps) {
  const [showCode, setShowCode] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)

  const handleDeploy = async () => {
    setIsDeploying(true)
    setTimeout(() => {
      onDeploy(plugin)
      setIsDeploying(false)
    }, 1000)
  }

  return (
    <Card className="plugin-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Code className="w-3 h-3 text-primary-foreground" />
            </div>
            {plugin.name}
          </CardTitle>
          {plugin.deployed ? (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              <CheckCircle className="w-3 h-3 mr-1" />
              Deployed
            </Badge>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {plugin.code && (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setShowCode(!showCode)} className="mb-2">
              <Code className="w-4 h-4 mr-2" />
              {showCode ? "Hide Code" : "Show Code"}
            </Button>

            {showCode && (
              <div className="code-block max-h-40 overflow-y-auto">
                <pre className="text-xs">
                  <code>{plugin.code}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {plugin.usageInstructions && (
          <div className="p-3 bg-muted/20 rounded-lg border border-border">
            <h4 className="text-sm font-medium mb-1">Usage Instructions</h4>
            <p className="text-sm text-muted-foreground">{plugin.usageInstructions}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!plugin.deployed ? (
            <Button onClick={handleDeploy} disabled={isDeploying || isGenerating || !plugin.code} className="flex-1">
              {isDeploying ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Deploying...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Deploy
                </>
              )}
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 bg-transparent">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}

          {plugin.code && (
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">Last modified: {plugin.lastModified.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}
