import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

// Szerver típus definiálása a biztonságosabb kódhoz
type ServerData = {
  server_id: string
  server_stats?: {
    total_members?: number
    total_bots?: number
    total_admins?: number
  }
}

export async function GET(
  request: Request,
  { params }: { params: { serverId: string } }
) {
  try {
    // Ellenőrizzük, hogy van-e session
    const session = await getServerSession(authOptions)

    if (!params?.serverId) {
      return NextResponse.json({ error: "Hiányzó szerver azonosító" }, { status: 400 })
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Nincs jogosultság" }, { status: 401 })
    }

    // Kapcsolódás az adatbázishoz
    const client = await clientPromise
    const db = client.db("dash-bot")
    const users = db.collection("users")

    // Felhasználó lekérése email alapján
    const userData = await users.findOne({ email: session.user.email })

    if (!userData) {
      return NextResponse.json({ error: "Felhasználó nem található" }, { status: 404 })
    }

    // Megfelelő szerver keresése a `servers` tömbben
    const server: ServerData | undefined = userData.servers?.find(
      (s: ServerData) => s.server_id === params.serverId
    )

    if (!server) {
      return NextResponse.json({ error: "Szerver nem található" }, { status: 404 })
    }

    // Statisztikák biztonságos lekérése
    const stats = server.server_stats || {}
    const serverStats = {
      total_members: stats.total_members || 0,
      total_bots: stats.total_bots || 0,
      total_admins: stats.total_admins || 0
    }

    return NextResponse.json({ serverStats })
  } catch (error) {
    console.error("Hiba a szerver statisztikák lekérdezésekor:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}