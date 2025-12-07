import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

/**
 * Checks if Firebase app exists, creates it if not
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

    console.log(`[Firebase Check App] Checking project: ${projectId}, site: ${siteId || 'default'}`)

    // Get access token from database
    const client = await clientPromise
    const db = client.db("dash-bot")
    const deploymentsCollection = db.collection("firebase_deployments")

    const deployment = await deploymentsCollection.findOne({ userId: session.user.email })

    if (!deployment || !deployment.accessToken) {
      return NextResponse.json({ 
        error: "No Firebase credentials found. Please authenticate first." 
      }, { status: 401 })
    }

    // Check if token is expired and refresh if needed
    let accessToken = deployment.accessToken
    if (deployment.expiresAt && new Date(deployment.expiresAt) < new Date()) {
      console.log("[Firebase Check App] Access token expired, refreshing...")
      
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

      if (refreshResponse.ok) {
        const tokens = await refreshResponse.json()
        accessToken = tokens.access_token
        
        await deploymentsCollection.updateOne(
          { userId: session.user.email },
          {
            $set: {
              accessToken: tokens.access_token,
              expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            },
          }
        )
        console.log("[Firebase Check App] Token refreshed successfully")
      } else {
        console.error("[Firebase Check App] Failed to refresh token")
        return NextResponse.json({ 
          error: "Failed to refresh authentication. Please re-authenticate." 
        }, { status: 401 })
      }
    }

    const site = siteId || projectId

    // Check if the Firebase Hosting site exists
    const checkSiteUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${site}`
    const siteResponse = await fetch(checkSiteUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (siteResponse.ok) {
      const siteData = await siteResponse.json()
      console.log(`[Firebase Check App] Site exists: ${site}`)
      return NextResponse.json({ 
        exists: true, 
        site: siteData,
        message: "Firebase site exists and is ready for deployment"
      })
    }

    // If site doesn't exist, create it
    console.log(`[Firebase Check App] Site doesn't exist, creating: ${site}`)
    
    const createSiteUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites`
    const createResponse = await fetch(createSiteUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        siteId: site,
      }),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.text()
      console.error("[Firebase Check App] Failed to create site:", errorData)
      return NextResponse.json({ 
        error: "Failed to create Firebase site",
        details: errorData
      }, { status: createResponse.status })
    }

    const newSite = await createResponse.json()
    console.log(`[Firebase Check App] Site created successfully: ${site}`)

    return NextResponse.json({ 
      exists: false, 
      created: true,
      site: newSite,
      message: "Firebase site created successfully"
    })

  } catch (error) {
    console.error("[Firebase Check App] Error:", error)
    return NextResponse.json({ 
      error: "Failed to check/create Firebase app",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
