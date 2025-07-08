// MongoDB seed script to add sample bot servers
// Run this to populate your database with test data

import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dash-bot"

async function seedBotServers() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("dash-bot")
    const botServers = db.collection("bot_servers")

    // Sample bot servers data
    const sampleServers = [
      {
        serverId: "123456789012345678",
        serverName: "My Awesome Server",
        serverIcon: null,
        addedAt: new Date(),
        isActive: true,
      },
      {
        serverId: "987654321098765432",
        serverName: "Gaming Community",
        serverIcon: null,
        addedAt: new Date(),
        isActive: true,
      },
      {
        serverId: "456789123456789123",
        serverName: "Study Group",
        serverIcon: null,
        addedAt: new Date(),
        isActive: true,
      },
    ]

    // Clear existing data
    await botServers.deleteMany({})
    console.log("Cleared existing bot servers")

    // Insert sample data
    const result = await botServers.insertMany(sampleServers)
    console.log(`Inserted ${result.insertedCount} bot servers`)

    console.log("Seed completed successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

seedBotServers()
