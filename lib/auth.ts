import type { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import clientPromise from "./mongodb"

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
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        try {
          const client = await clientPromise
          const db = client.db("dash-bot")
          const users = db.collection("users")

          const discordProfile = profile as any

          await users.updateOne(
            { discordId: discordProfile.id },
            {
              $set: {
                discordId: discordProfile.id,
                username: discordProfile.username,
                discriminator: discordProfile.discriminator,
                avatar: discordProfile.avatar,
                email: discordProfile.email,
                lastLogin: new Date(),
              },
              $setOnInsert: {
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
  },
  pages: {
    signIn: "/login",
  },
}
