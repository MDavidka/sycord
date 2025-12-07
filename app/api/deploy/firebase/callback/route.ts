import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin, getDeploymentCollections } from "@/lib/firebase-deploy-utils"

/**
 * Handles OAuth callback from Google
 * Exchanges authorization code for access and refresh tokens
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login`)
    }

    // Check if user is admin
    if (!isAdmin(session.user?.email)) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("[Firebase OAuth Callback] OAuth error:", error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/admin/deploy?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/admin/deploy?error=no_code`
      )
    }

    console.log("[Firebase OAuth Callback] Received authorization code")

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/deploy/firebase/callback`,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("[Firebase OAuth Callback] Token exchange failed:", errorData)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/admin/deploy?error=token_exchange_failed`
      )
    }

    const tokens = await tokenResponse.json()
    console.log("[Firebase OAuth Callback] Successfully obtained tokens")

    // Store tokens in database
    const { deploymentsCollection } = await getDeploymentCollections()

    await deploymentsCollection.updateOne(
      { userId: session.user.email },
      {
        $set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    console.log("[Firebase OAuth Callback] Tokens stored successfully")

    // Redirect to deploy page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/admin/deploy?success=true`
    )
  } catch (error) {
    console.error("[Firebase OAuth Callback] Error:", error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/admin/deploy?error=callback_failed`
    )
  }
}
