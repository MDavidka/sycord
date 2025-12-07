import clientPromise from "@/lib/mongodb"

/**
 * Admin configuration
 */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dmarton336@gmail.com"

/**
 * Helper function to check if user is admin
 */
export function isAdmin(email?: string | null): boolean {
  return email === ADMIN_EMAIL
}

/**
 * Helper function to get valid access token with auto-refresh
 */
export async function getAccessToken(userId: string): Promise<string> {
  const client = await clientPromise
  const db = client.db("dash-bot")
  const deploymentsCollection = db.collection("firebase_deployments")

  const deployment = await deploymentsCollection.findOne({ userId })

  if (!deployment || !deployment.accessToken) {
    throw new Error("No Firebase credentials found")
  }

  let accessToken = deployment.accessToken

  // Check if token is expired and refresh if needed
  if (deployment.expiresAt && new Date(deployment.expiresAt) < new Date()) {
    console.log("[Token] Access token expired, refreshing...")
    
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: deployment.refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!refreshResponse.ok) {
      throw new Error("Failed to refresh token")
    }

    const tokens = await refreshResponse.json()
    accessToken = tokens.access_token
    
    await deploymentsCollection.updateOne(
      { userId },
      {
        $set: {
          accessToken: tokens.access_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      }
    )
    console.log("[Token] Token refreshed successfully")
  }

  return accessToken
}

/**
 * Helper function to get database collections
 */
export async function getDeploymentCollections() {
  const client = await clientPromise
  const db = client.db("dash-bot")
  
  return {
    deploymentsCollection: db.collection("firebase_deployments"),
    historyCollection: db.collection("deployment_history"),
  }
}

/**
 * Validates file data for deployment
 */
export function validateFile(file: { path: string; content: string }): { valid: boolean; error?: string } {
  if (!file.path || typeof file.path !== "string") {
    return { valid: false, error: "File path is required and must be a string" }
  }

  // Check for dangerous path characters
  if (file.path.includes("..") || file.path.startsWith("/")) {
    return { valid: false, error: "File path contains invalid characters" }
  }

  if (!file.content || typeof file.content !== "string") {
    return { valid: false, error: "File content is required and must be a string" }
  }

  // Check file size (limit to 10MB)
  if (file.content.length > 10 * 1024 * 1024) {
    return { valid: false, error: "File content exceeds maximum size of 10MB" }
  }

  return { valid: true }
}
