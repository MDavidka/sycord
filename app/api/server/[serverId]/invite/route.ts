import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()
    const { serverId } = params

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (email === session.user.email) {
      return NextResponse.json({ error: "You cannot invite yourself." }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")

    const existingUser = await db.collection("users").findOne({ email })

    if (!existingUser) {
      return NextResponse.json({ error: "User with this email does not exist." }, { status: 404 })
    }

    const existingContributor = await db.collection("server_contributors").findOne({
      serverId,
      userId: existingUser.discordId,
    })

    if (existingContributor) {
      const errorMessage =
        existingContributor.status === "pending"
          ? "This user already has a pending invitation."
          : "This user is already a contributor."
      return NextResponse.json({ error: errorMessage }, { status: 409 })
    }

    await db.collection("server_contributors").insertOne({
      serverId,
      userId: existingUser.discordId,
      email,
      invitedBy: session.user.id,
      invitedAt: new Date(),
      role: "contributor",
      status: "pending",
    })

    return NextResponse.json({
      success: true,
      message: "Invite sent successfully.",
    })
  } catch (error) {
    console.error("Error sending invite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serverId } = params
    const client = await clientPromise
    const db = client.db("dash-bot")

    // Get server contributors
    const contributors = await db
      .collection("server_contributors")
      .find({
        serverId: serverId,
      })
      .toArray()

    // Get user details for contributors
    const contributorDetails = await Promise.all(
      contributors.map(async (contributor) => {
        const user = await db.collection("users").findOne({ discordId: contributor.userId })
        return {
          ...contributor,
          username: user?.username,
          avatar: user?.avatar,
          discriminator: user?.discriminator,
        }
      }),
    )

    return NextResponse.json({ contributors: contributorDetails })
  } catch (error) {
    console.error("Error fetching contributors:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
