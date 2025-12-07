import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

/**
 * Helper function to get valid access token
 */
async function getAccessToken(userId: string) {
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
 * Creates a new hosting version and returns upload URL
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, siteId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const site = siteId || projectId

    console.log(`[Firebase Create Version] Creating version for site: ${site}`)

    const accessToken = await getAccessToken(session.user.email)

    // Create a new version
    const createVersionUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${site}/versions`
    const versionResponse = await fetch(createVersionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          // Empty config for now, can be customized later
        },
      }),
    })

    if (!versionResponse.ok) {
      const errorData = await versionResponse.text()
      console.error("[Firebase Create Version] Failed to create version:", errorData)
      return NextResponse.json({ 
        error: "Failed to create hosting version",
        details: errorData
      }, { status: versionResponse.status })
    }

    const version = await versionResponse.json()
    console.log(`[Firebase Create Version] Version created: ${version.name}`)

    return NextResponse.json({ 
      success: true,
      version: version.name,
      versionId: version.name.split('/').pop(),
      message: "Hosting version created successfully"
    })

  } catch (error) {
    console.error("[Firebase Create Version] Error:", error)
    return NextResponse.json({ 
      error: "Failed to create hosting version",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
