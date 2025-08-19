"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Send } from "lucide-react"

interface MissingDetailsFormProps {
  details: string[]
  pluginName?: string
  onSubmit: (details: { [key: string]: string }) => void
  onCancel: () => void
}

export function MissingDetailsForm({ details, pluginName, onSubmit, onCancel }: MissingDetailsFormProps) {
  const [values, setValues] = useState<{ [key: string]: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if all fields are filled
    const allFilled = details.every((detail) => values[detail]?.trim())
    if (!allFilled) return

    onSubmit(values)
  }

  const handleInputChange = (detail: string, value: string) => {
    setValues((prev) => ({ ...prev, [detail]: value }))
  }

  const allFieldsFilled = details.every((detail) => values[detail]?.trim())

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Missing Details Required
        </CardTitle>
        {pluginName && (
          <p className="text-sm text-muted-foreground">
            For plugin: <span className="font-mono font-medium">{pluginName}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-orange-700 mb-4">Please provide the following details to complete your plugin:</p>

          {details.map((detail) => (
            <div key={detail} className="space-y-2">
              <Label htmlFor={detail} className="text-sm font-medium">
                {detail.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Label>
              <Input
                id={detail}
                value={values[detail] || ""}
                onChange={(e) => handleInputChange(detail, e.target.value)}
                placeholder={`Enter ${detail.replace(/-/g, " ")}`}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={!allFieldsFilled} className="flex-1 bg-orange-600 hover:bg-orange-700">
              <Send className="h-4 w-4 mr-2" />
              Submit Details
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
