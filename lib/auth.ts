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
  },
  session: {
    strategy: "jwt", // Use JWT for session management
  },
  pages: {
    signIn: "/login",
  },
  events: {
    async signIn({ user, account, profile }) {
      try {
        // Create or update user document with Discord information
        const { db } = await import("./mongodb").then((mod) => mod.connectToDatabase())

        // Check if user exists
        const existingUser = await db.collection("users").findOne({ discordId: user.id })

        if (!existingUser) {
          // Create new user with empty servers array
          await db.collection("users").insertOne({
            discordId: user.id,
            username: user.name,
            email: user.email,
            avatar: user.image,
            servers: [],
            createdAt: new Date(),
            lastLogin: new Date(),
          })
        } else {
          // Update last login time
          await db.collection("users").updateOne(
            { discordId: user.id },
            {
              $set: {
                lastLogin: new Date(),
                username: user.name,
                email: user.email,
                avatar: user.image,
              },
            },
          )
        }
      } catch (error) {
        console.error("Error in signIn event:", error)
      }
    },
  },
}
