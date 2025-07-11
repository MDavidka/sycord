import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { AppSettings } from "@/lib/types"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const appSettingsCollection = db.collection<AppSettings>("app_settings")

    let appSettings = await appSettingsCollection.findOne({})

    if (!appSettings) {
      // Initialize default settings if none exist
      const defaultSettings: AppSettings = {
        maintenanceMode: {
          enabled: false,
          estimatedTime: "30 minutes",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await appSettingsCollection.insertOne(defaultSettings)
      appSettings = defaultSettings
    }

    return NextResponse.json(appSettings)
  } catch (error) {
    console.error("Error fetching app settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow specific admin user to update app settings
    if (!session?.user || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db("dash-bot")
    const appSettingsCollection = db.collection<AppSettings>("app_settings")

    const updatedSettings = await appSettingsCollection.findOneAndUpdate(
      {}, // Find the single app settings document
      {
        $set: {
          maintenanceMode: body.maintenanceMode,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after", upsert: true }, // Create if not exists, return updated document
    )

    return NextResponse.json(updatedSettings.value)
  } catch (error) {
    console.error("Error updating app settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
