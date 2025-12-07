import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin, getAccessToken } from "@/lib/firebase-deploy-utils"

/**
 * Creates a new hosting version and returns upload URL
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
