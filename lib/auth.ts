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
          scope: "identify email guilds",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        try {
          const { db } = await connectToDatabase()

          // Create or update user in database
          await db.collection("users").updateOne(
            { discordId: user.id },
            {
              $set: {
                discordId: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
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

          return true
        } catch (error) {
          console.error("Error saving user:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id = token.userId as string
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}
