"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Users, Clock } from "lucide-react"
import Link from "next/link"

interface DocumentData {
  content: string
  lastUpdated: string
  lastUpdatedBy: string
}

export default function AdminDocumentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [editors, setEditors] = useState<string[]>([])

  useEffect(() => {
    fetchDocument()

    // Set up polling for real-time updates
    const interval = setInterval(fetchDocument, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchDocument = async () => {
    try {
      const response = await fetch("/api/admin/document")
      if (response.ok) {
        const data = await response.json()
        setDocument(data.document)
        setContent(data.document.content)
        setEditors(data.editors || [])
        setLoading(false)
      } else {
        console.error("Failed to fetch document")
        setLoading(false)
      }
    } catch (error) {
      console.error("Error fetching document:", error)
      setLoading(false)
    }
  }

  const saveDocument = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          username: session?.user?.name || "Anonymous",
        }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        await fetchDocument() // Refresh data
      }
    } catch (error) {
      console.error("Error saving document:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Secret Admin Document</h1>
                <p className="text-sm text-gray-400">Collaborative document for team notes</p>
              </div>
            </div>
            <Button onClick={saveDocument} disabled={saving} className="bg-white text-black hover:bg-gray-200">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">Document Content</CardTitle>
                <CardDescription className="text-gray-400">Everyone can view and edit this document</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] bg-black/60 border-white/20 text-white placeholder-gray-400"
                  placeholder="Start typing here..."
                />
                {lastSaved && (
                  <p className="text-xs text-gray-400 mt-2">Last saved: {lastSaved.toLocaleTimeString()}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="glass-card mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Last Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                {document && (
                  <div className="text-sm">
                    <p className="text-gray-400">
                      Last updated by <span className="text-white">{document.lastUpdatedBy}</span>
                    </p>
                    <p className="text-gray-400">
                      on <span className="text-white">{new Date(document.lastUpdated).toLocaleString()}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Recent Editors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editors.length > 0 ? (
                  <ul className="space-y-2">
                    {editors.map((editor, index) => (
                      <li key={index} className="text-sm text-gray-400">
                        {editor}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No recent editors</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
