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
      if (account && user) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.userId as string
        session.accessToken = token.accessToken as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
