"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Cloud, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Upload, 
  Rocket,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeploymentStatus {
  authenticated: boolean
  tokenExpired: boolean
  expiresAt?: string
  recentDeployments: Array<{
    projectId: string
    siteId: string
    deployedAt: string
    status: string
  }>
}

export default function DeployPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<DeploymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [projectId, setProjectId] = useState("")
  const [siteId, setSiteId] = useState("")
  const [files, setFiles] = useState("")
  const [deploymentStep, setDeploymentStep] = useState("")
  const [deploymentError, setDeploymentError] = useState("")
  const [deploymentSuccess, setDeploymentSuccess] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login")
    }
  }, [sessionStatus, router])

  useEffect(() => {
    // Check admin status by attempting to fetch deployment status
    // If unauthorized, user is not admin and will be redirected
    if (session) {
      checkAdminAndFetchStatus()
    }
  }, [session])

  const checkAdminAndFetchStatus = async () => {
    try {
      const response = await fetch("/api/deploy/firebase/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        setIsAdmin(true)
      } else if (response.status === 401 || response.status === 403) {
        // Not admin, redirect to dashboard
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check for OAuth callback errors/success
    const error = searchParams.get("error")
    const success = searchParams.get("success")

    if (error) {
      setDeploymentError(`OAuth error: ${error}`)
    } else if (success) {
      fetchStatus() // Refresh status after successful OAuth
    }
  }, [searchParams])

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/deploy/firebase/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error fetching status:", error)
    }
  }

  const handleAuthenticate = () => {
    window.location.href = "/api/deploy/firebase/oauth"
  }

  const handleDeploy = async () => {
    if (!projectId || !files) {
      setDeploymentError("Project ID and files are required")
      return
    }

    setDeploying(true)
    setDeploymentError("")
    setDeploymentSuccess(false)
    setDeploymentUrl("")

    try {
      // Parse files JSON
      let parsedFiles
      try {
        parsedFiles = JSON.parse(files)
        
        // Validate it's an array
        if (!Array.isArray(parsedFiles)) {
          throw new Error("Files must be an array")
        }
        
        // Validate each file has required fields
        for (const file of parsedFiles) {
          if (!file.path || !file.content) {
            throw new Error(`Each file must have 'path' and 'content' properties`)
          }
        }
      } catch (e) {
        throw new Error(`Invalid JSON format: ${e instanceof Error ? e.message : String(e)}. Expected format: [{"path": "index.html", "content": "<html>..."}]`)
      }

      // Step 1: Check/Create Firebase app
      setDeploymentStep("Checking Firebase project...")
      const checkResponse = await fetch("/api/deploy/firebase/check-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, siteId: siteId || projectId }),
      })

      if (!checkResponse.ok) {
        const error = await checkResponse.json()
        throw new Error(error.error || "Failed to check Firebase app")
      }

      const checkData = await checkResponse.json()
      console.log("Check app result:", checkData)

      // Step 2: Create hosting version
      setDeploymentStep("Creating hosting version...")
      const versionResponse = await fetch("/api/deploy/firebase/create-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, siteId: siteId || projectId }),
      })

      if (!versionResponse.ok) {
        const error = await versionResponse.json()
        throw new Error(error.error || "Failed to create hosting version")
      }

      const versionData = await versionResponse.json()
      console.log("Version created:", versionData)

      // Step 3: Upload files
      setDeploymentStep(`Uploading ${parsedFiles.length} files...`)
      const uploadResponse = await fetch("/api/deploy/firebase/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          siteId: siteId || projectId,
          versionId: versionData.versionId,
          files: parsedFiles,
        }),
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || "Failed to upload files")
      }

      const uploadData = await uploadResponse.json()
      console.log("Upload result:", uploadData)

      // Step 4: Finalize deployment
      setDeploymentStep("Finalizing deployment...")
      const finalizeResponse = await fetch("/api/deploy/firebase/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          siteId: siteId || projectId,
          versionId: versionData.versionId,
        }),
      })

      if (!finalizeResponse.ok) {
        const error = await finalizeResponse.json()
        throw new Error(error.error || "Failed to finalize deployment")
      }

      const finalizeData = await finalizeResponse.json()
      console.log("Deployment finalized:", finalizeData)

      setDeploymentSuccess(true)
      setDeploymentUrl(finalizeData.url)
      setDeploymentStep("Deployment successful!")
      
      // Show alternative URL if available
      if (finalizeData.alternativeUrl) {
        console.log("Alternative URL:", finalizeData.alternativeUrl)
      }
      
      await fetchStatus() // Refresh status

    } catch (error) {
      console.error("Deployment error:", error)
      setDeploymentError(error instanceof Error ? error.message : String(error))
    } finally {
      setDeploying(false)
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return null
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
                <h1 className="text-xl md:text-2xl font-bold text-white">Firebase Deployment</h1>
                <p className="text-sm text-gray-400">Deploy your site to Firebase Hosting</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Authentication Status */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Cloud className="h-5 w-5 mr-2" />
              Firebase Authentication
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your Google account to deploy to Firebase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status?.authenticated ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-white">
                    Authenticated {status.tokenExpired && "(Token expired - will refresh automatically)"}
                  </span>
                </div>
                <Button
                  onClick={handleAuthenticate}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Re-authenticate
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-white">Not authenticated</span>
                </div>
                <Button
                  onClick={handleAuthenticate}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Authenticate with Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deployment Form */}
        {status?.authenticated && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Rocket className="h-5 w-5 mr-2" />
                Deploy to Firebase
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure and deploy your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-sm mb-2 block">
                  Firebase Project ID *
                </Label>
                <Input
                  placeholder="my-project-id"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                  disabled={deploying}
                />
              </div>

              <div>
                <Label className="text-white text-sm mb-2 block">
                  Site ID (Optional - defaults to project ID)
                </Label>
                <Input
                  placeholder="my-site"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400"
                  disabled={deploying}
                />
              </div>

              <div>
                <Label className="text-white text-sm mb-2 block">
                  Files (JSON Array) *
                </Label>
                <Textarea
                  placeholder='[{"path": "index.html", "content": "<html>...</html>"}]'
                  value={files}
                  onChange={(e) => setFiles(e.target.value)}
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[200px] font-mono text-xs"
                  disabled={deploying}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JSON array of files with &apos;path&apos; and &apos;content&apos; properties. Example: {`[{"path": "index.html", "content": "<html><body>Hello</body></html>"}]`}
                </p>
              </div>

              {deploymentError && (
                <Alert className="bg-red-500/10 border-red-500/50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-400">
                    {deploymentError}
                  </AlertDescription>
                </Alert>
              )}

              {deploymentSuccess && (
                <Alert className="bg-green-500/10 border-green-500/50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-400">
                    Deployment successful! Your site is live at:{" "}
                    <a 
                      href={deploymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                    >
                      {deploymentUrl}
                    </a>
                    <br />
                    <span className="text-xs text-green-300">
                      Also accessible at: {deploymentUrl.replace('.web.app', '.firebaseapp.com')}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleDeploy}
                disabled={deploying || !projectId || !files}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {deploymentStep}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Deploy to Firebase
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Deployments */}
        {status?.recentDeployments && status.recentDeployments.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Recent Deployments</CardTitle>
              <CardDescription className="text-gray-400">
                Your deployment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {status.recentDeployments.map((deployment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{deployment.projectId}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(deployment.deployedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {deployment.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-400">{deployment.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
