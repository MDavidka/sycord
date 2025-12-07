import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin, getAccessToken, getDeploymentCollections } from "@/lib/firebase-deploy-utils"

/**
 * Checks if Firebase app exists, creates it if not
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdmin(session.user?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, siteId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    console.log(`[Firebase Check App] Checking project: ${projectId}, site: ${siteId || 'default'}`)

    // Get access token from database
    const accessToken = await getAccessToken(session.user.email)

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
