import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Initiates Google OAuth flow for Firebase deployment
 * Redirects user to Google OAuth consent screen
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/deploy/firebase/callback`
    
    if (!clientId) {
      console.error("[Firebase OAuth] Missing GOOGLE_CLIENT_ID environment variable")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Build OAuth URL with necessary scopes for Firebase Hosting
    const scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/firebase",
      "https://www.googleapis.com/auth/firebase.hosting",
    ].join(" ")

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", scopes)
    authUrl.searchParams.set("access_type", "offline") // Get refresh token
    authUrl.searchParams.set("prompt", "consent") // Force consent to get refresh token

    console.log("[Firebase OAuth] Redirecting to Google OAuth:", authUrl.toString())

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error("[Firebase OAuth] Error:", error)
    return NextResponse.json({ 
      error: "Failed to initiate OAuth flow",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
