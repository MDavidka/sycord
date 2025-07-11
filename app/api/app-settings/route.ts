import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("app_settings")

    let appSettings = await settings.findOne({})

    if (!appSettings) {
      // Create default settings if none exist
      const defaultSettings = {
        maintenanceMode: {
          enabled: false,
          estimatedTime: "30 minutes",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await settings.insertOne(defaultSettings)
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

    // Check if user is admin
    if (!session?.user || session.user.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db("dash-bot")
    const settings = db.collection("app_settings")

    const updatedSettings = await settings.findOneAndUpdate(
      {},
      {
        $set: {
          maintenanceMode: body.maintenanceMode,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        upsert: true,
      },
    )

    return NextResponse.json(updatedSettings.value)
  } catch (error) {
    console.error("Error updating app settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
