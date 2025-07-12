import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const { db } = await connectToDatabase()
    const giveawayData = await req.json()

    // Generate a unique ID for the giveaway
    const giveawayId = uuidv4()

    const newGiveaway = {
      _id: giveawayId,
      ...giveawayData,
      createdAt: new Date(),
    }

    await db.collection("giveaways").insertOne(newGiveaway)

    return NextResponse.json({ success: true, giveawayId: newGiveaway._id })
  } catch (error) {
    console.error("Error creating giveaway:", error)
    return NextResponse.json({ success: false, message: "Failed to create giveaway" }, { status: 500 })
  }
}
