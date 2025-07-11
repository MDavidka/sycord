import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("server_settings")

    const serverSettings = await settings.findOne({
      serverId: params.serverId,
      ownerId: session.user.id,
    })

    if (!serverSettings) {
      // Return default settings if none exist
      const defaultSettings = {
        serverId: params.serverId,
        serverName: "Unknown Server",
        ownerId: session.user.id,
        settings: {
          aiAnswersEnabled: false,
          contentModerationEnabled: false,
          badWordFilterEnabled: false,
          badLinkDetectionEnabled: false,
          autoApproveEnabled: false,
          timedAnnouncementsEnabled: false,
          memberCountThreshold: 100,
          announcementChannel: "",
          moderationChannel: "",
          customBadWords: [],
          trustedRoles: [],
          suspiciousUserThreshold: 3,
          // New custom bot settings
          botProfilePictureUrl: "",
          customBotName: "",
          botToken: "",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await settings.insertOne(defaultSettings)
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(serverSettings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("server_settings")

    const updatedSettings = await settings.findOneAndUpdate(
      {
        serverId: params.serverId,
        ownerId: session.user.id,
      },
      {
        $set: {
          "settings.aiAnswersEnabled": body.settings.aiAnswersEnabled,
          "settings.contentModerationEnabled": body.settings.contentModerationEnabled,
          "settings.badWordFilterEnabled": body.settings.badWordFilterEnabled,
          "settings.badLinkDetectionEnabled": body.settings.badLinkDetectionEnabled,
          "settings.autoApproveEnabled": body.settings.autoApproveEnabled,
          "settings.timedAnnouncementsEnabled": body.settings.timedAnnouncementsEnabled,
          "settings.memberCountThreshold": body.settings.memberCountThreshold,
          "settings.announcementChannel": body.settings.announcementChannel,
          "settings.moderationChannel": body.settings.moderationChannel,
          "settings.customBadWords": body.settings.customBadWords,
          "settings.trustedRoles": body.settings.trustedRoles,
          "settings.suspiciousUserThreshold": body.settings.suspiciousUserThreshold,
          // New custom bot settings
          "settings.botProfilePictureUrl": body.settings.botProfilePictureUrl,
          "settings.customBotName": body.settings.customBotName,
          "settings.botToken": body.settings.botToken,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after", upsert: true },
    )

    return NextResponse.json(updatedSettings.value)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
