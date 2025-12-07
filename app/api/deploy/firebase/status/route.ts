import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin, getDeploymentCollections } from "@/lib/firebase-deploy-utils"

/**
 * Get Firebase deployment status and credentials
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdmin(session.user?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { deploymentsCollection, historyCollection } = await getDeploymentCollections()

    const deployment = await deploymentsCollection.findOne({ userId: session.user.email })
    const recentDeployments = await historyCollection
      .find({ userId: session.user.email })
      .sort({ deployedAt: -1 })
      .limit(10)
      .toArray()

    const hasCredentials = !!(deployment && deployment.accessToken)
    const isExpired = deployment?.expiresAt ? new Date(deployment.expiresAt) < new Date() : false

    return NextResponse.json({ 
      authenticated: hasCredentials,
      tokenExpired: isExpired,
      expiresAt: deployment?.expiresAt,
      recentDeployments: recentDeployments.map(d => ({
        projectId: d.projectId,
        siteId: d.siteId,
        deployedAt: d.deployedAt,
        status: d.status,
      })),
    })

  } catch (error) {
    console.error("[Firebase Status] Error:", error)
    return NextResponse.json({ 
      error: "Failed to get deployment status",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
