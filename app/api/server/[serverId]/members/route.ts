import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const client = await clientPromise
    const db = client.db("dash-bot")

    const [serverMembers, contributors] = await Promise.all([
      db
        .collection("server_members")
        .find({
          serverId: serverId,
          hasAdminAccess: true,
        })
        .toArray(),
      db
        .collection("server_contributors")
        .find({
          serverId: serverId,
        })
        .toArray(),
    ])

    const contributorsWithProfiles = await Promise.all(
      contributors.map(async (contributor) => {
        const userProfile = await db.collection("users").findOne({
          email: contributor.email,
        })

        return {
          ...contributor,
          avatar_url: userProfile?.avatar_url || null,
          username: userProfile?.username || contributor.email.split("@")[0],
          discriminator: userProfile?.discriminator || null,
        }
      }),
    )

    return NextResponse.json({
      members: serverMembers,
      contributors: contributorsWithProfiles,
    })
  } catch (error) {
    console.error("Error fetching server members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
