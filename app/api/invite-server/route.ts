import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { serverId, serverName, serverIcon, isOwner } = body

    if (!serverId || !serverName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const userServers = db.collection("user_servers")

    // Default configuration for new servers
    const defaultConfig = {
      moderationLevel: "off",
      "moderate-suspicious-account": false,
      "moderate-link": false,
      "moderate-link-mode": "all",
      "moderate-allowed-domains": [],
      "moderate-badword": false,
      "moderate-custom-badwords": [],
      "moderate-autorole": false,
      "moderate-autorole-id": "",
      "moderate-fraud": false,
      "moderate-raid": false,
      "support-autoanswer": false,
      "support-ticket": false,
      "support-ticket-channel": "",
      "support-ticket-blacklist": [],
      "support-beta-autoanswer": false,
      "support-autoanswer-document": "",
      "support-report-user": false,
      "announcement-triggered": false,
      "announcement-time": false,
      "announcement-membercount": false,
      "announcement-uptime": false,
      "announcement-membercount-threshold": 100,
      "announcement-channel": "",
      "announcement-giveaway": false,
    }

    // Check if entry already exists
    const existingEntry = await userServers.findOne({
      userId: session.user.id,
      serverId: serverId,
    })

    if (existingEntry) {
      return NextResponse.json({
        message: "Server already tracked",
        userServer: existingEntry,
      })
    }

    // Create new user server entry
    const userServerEntry = {
      userId: session.user.id,
      serverId: serverId,
      serverName: serverName,
      serverIcon: serverIcon || null,
      isOwner: isOwner || false,
      isBotAdded: false, // Initially false, will be updated by bot when it joins
      invitedAt: new Date(),
      botJoinedAt: null,
      lastConfigUpdate: new Date(),
      config: defaultConfig,
    }

    const result = await userServers.insertOne(userServerEntry)

    return NextResponse.json({
      message: "Server invitation tracked successfully",
      userServer: { ...userServerEntry, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error tracking server invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
