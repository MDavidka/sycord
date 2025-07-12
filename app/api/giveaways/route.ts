import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection("giveaways")

    const giveawayData = await req.json()

    // Generate a unique ID for the giveaway
    const giveawayId = uuidv4()

    const result = await collection.insertOne({
      _id: giveawayId,
      ...giveawayData,
      createdAt: new Date(),
    })

    if (result.acknowledged) {
      return NextResponse.json({ giveawayId }, { status: 201 })
    } else {
      return NextResponse.json({ message: "Failed to create giveaway" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating giveaway:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
