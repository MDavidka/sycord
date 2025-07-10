import type { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "./mongodb"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token and user ID to the token right after sign-in
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.userId = user?.id // Store the user ID from the database
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, such as an access_token and user id from a provider.
      if (session.user) {
        session.user.id = token.userId as string
        session.accessToken = token.accessToken as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord" && account.access_token) {
        try {
          // Fetch user's Discord guilds
          const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          })

          if (guildsResponse.ok) {
            const guilds = await guildsResponse.json()

            // Store guilds in user document
            const client = await clientPromise
            const db = client.db("dash-bot")

            await db.collection("users").updateOne(
              { email: user.email },
              {
                $set: {
                  discordGuilds: guilds,
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  updatedAt: new Date(),
                },
                $setOnInsert: {
                  servers: [],
                  createdAt: new Date(),
                },
              },
              { upsert: true },
            )
          }
        } catch (error) {
          console.error("Error fetching Discord guilds during sign in:", error)
        }
      }
      return true
    },
  },
  session: {
    strategy: "jwt", // Use JWT for session management
  },
  pages: {
    signIn: "/login",
  },
}
