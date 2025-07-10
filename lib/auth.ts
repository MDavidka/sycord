import type { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { connectToDatabase } from "./mongodb"

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        try {
          const { db } = await connectToDatabase()

          // Simple user creation/update without Discord API calls
          await db.collection("users").updateOne(
            { discordId: user.id },
            {
              $set: {
                discordId: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                lastLogin: new Date(),
              },
              $setOnInsert: {
                createdAt: new Date(),
                servers: [],
              },
            },
            { upsert: true },
          )

          return true
        } catch (error) {
          console.error("Error saving user data:", error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, account }) {
      return token
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}
