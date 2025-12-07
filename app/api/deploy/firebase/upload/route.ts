import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { createHash } from "crypto"

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

  if (deployment.expiresAt && new Date(deployment.expiresAt) < new Date()) {
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
  }

  return accessToken
}

/**
 * Uploads files to Firebase Hosting
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, siteId, versionId, files } = await request.json()

    if (!projectId || !versionId || !files || !Array.isArray(files)) {
      return NextResponse.json({ 
        error: "Missing required fields: projectId, versionId, files" 
      }, { status: 400 })
    }

    const site = siteId || projectId

    console.log(`[Firebase Upload] Uploading ${files.length} files to version: ${versionId}`)

    const accessToken = await getAccessToken(session.user.email)

    // Prepare file hashes
    const fileHashes: { [key: string]: string } = {}
    files.forEach((file: { path: string; content: string }) => {
      const hash = createHash('sha256').update(file.content).digest('hex')
      fileHashes[`/${file.path}`] = hash
    })

    // Populate files (tell Firebase what files we want to upload)
    const versionName = `projects/${projectId}/sites/${site}/versions/${versionId}`
    const populateUrl = `https://firebasehosting.googleapis.com/v1beta1/${versionName}:populateFiles`
    
    const populateResponse = await fetch(populateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: fileHashes,
      }),
    })

    if (!populateResponse.ok) {
      const errorData = await populateResponse.text()
      console.error("[Firebase Upload] Failed to populate files:", errorData)
      return NextResponse.json({ 
        error: "Failed to populate files",
        details: errorData
      }, { status: populateResponse.status })
    }

    const populateData = await populateResponse.json()
    const uploadRequiredHashes = populateData.uploadRequiredHashes || []
    
    console.log(`[Firebase Upload] Need to upload ${uploadRequiredHashes.length} files`)

    // Upload each required file
    let uploadedCount = 0
    const uploadResults = []

    for (const file of files) {
      const hash = fileHashes[`/${file.path}`]
      
      if (uploadRequiredHashes.includes(hash)) {
        const uploadUrl = `${populateData.uploadUrl}/${hash}`
        
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream",
          },
          body: file.content,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.text()
          console.error(`[Firebase Upload] Failed to upload ${file.path}:`, errorData)
          uploadResults.push({ 
            path: file.path, 
            success: false, 
            error: errorData 
          })
        } else {
          uploadedCount++
          uploadResults.push({ 
            path: file.path, 
            success: true 
          })
          console.log(`[Firebase Upload] Uploaded: ${file.path}`)
        }
      } else {
        console.log(`[Firebase Upload] File already exists: ${file.path}`)
        uploadResults.push({ 
          path: file.path, 
          success: true, 
          cached: true 
        })
      }
    }

    console.log(`[Firebase Upload] Upload complete: ${uploadedCount} new files uploaded`)

    return NextResponse.json({ 
      success: true,
      uploadedCount,
      totalFiles: files.length,
      uploadResults,
      message: `Successfully uploaded ${uploadedCount} files`
    })

  } catch (error) {
    console.error("[Firebase Upload] Error:", error)
    return NextResponse.json({ 
      error: "Failed to upload files",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
