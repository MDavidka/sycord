import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin, getAccessToken, getDeploymentCollections } from "@/lib/firebase-deploy-utils"

/**
 * Finalizes the deployment and makes it live
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdmin(session.user?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, siteId, versionId } = await request.json()

    if (!projectId || !versionId) {
      return NextResponse.json({ 
        error: "Missing required fields: projectId, versionId" 
      }, { status: 400 })
    }

    const site = siteId || projectId

    console.log(`[Firebase Finalize] Finalizing version: ${versionId}`)

    const accessToken = await getAccessToken(session.user.email)

    const versionName = `projects/${projectId}/sites/${site}/versions/${versionId}`

    // First, finalize the version
    const finalizeUrl = `https://firebasehosting.googleapis.com/v1beta1/${versionName}?update_mask=status`
    const finalizeResponse = await fetch(finalizeUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "FINALIZED",
      }),
    })

    if (!finalizeResponse.ok) {
      const errorData = await finalizeResponse.text()
      console.error("[Firebase Finalize] Failed to finalize version:", errorData)
      return NextResponse.json({ 
        error: "Failed to finalize version",
        details: errorData
      }, { status: finalizeResponse.status })
    }

    const finalizedVersion = await finalizeResponse.json()
    console.log(`[Firebase Finalize] Version finalized: ${versionName}`)

    // Create a release to deploy the version
    const releaseUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${site}/releases?versionName=${versionName}`
    const releaseResponse = await fetch(releaseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Deployed from Sycord Admin Panel",
      }),
    })

    if (!releaseResponse.ok) {
      const errorData = await releaseResponse.text()
      console.error("[Firebase Finalize] Failed to create release:", errorData)
      return NextResponse.json({ 
        error: "Failed to create release",
        details: errorData
      }, { status: releaseResponse.status })
    }

    const release = await releaseResponse.json()
    console.log(`[Firebase Finalize] Release created: ${release.name}`)

    // Store deployment record
    const { historyCollection } = await getDeploymentCollections()

    await historyCollection.insertOne({
      userId: session.user.email,
      projectId,
      siteId: site,
      versionId,
      releaseName: release.name,
      deployedAt: new Date(),
      status: "success",
    })

    return NextResponse.json({ 
      success: true,
      release: release.name,
      url: `https://${site}.web.app`,
      alternativeUrl: `https://${site}.firebaseapp.com`,
      message: "Deployment successful! Site is now live."
    })

  } catch (error) {
    console.error("[Firebase Finalize] Error:", error)
    return NextResponse.json({ 
      error: "Failed to finalize deployment",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
