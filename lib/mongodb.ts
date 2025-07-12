import { MongoClient, type Db } from "mongodb"

// Make MongoDB URI optional during build time
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/fallback"
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Add the missing connectToDatabase export
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise
  const db = client.db("dash-discord-bot") // Replace with your actual database name
  return { client, db }
}

export default clientPromise
