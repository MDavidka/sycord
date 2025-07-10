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
      if (account?.provider === "discord" && account.access_token) {
        try {
          // Fetch user's Discord guilds
          const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          })

          const guilds = await guildsResponse.json()

          // Filter guilds where user has MANAGE_GUILD permission
          const manageableGuilds = guilds.filter((guild: any) => {
            const permissions = Number.parseInt(guild.permissions)
            return (permissions & 0x20) === 0x20 || guild.owner // MANAGE_GUILD permission or owner
          })

          // Connect to database and save/update user
          const { db } = await connectToDatabase()

          await db.collection("users").updateOne(
            { discordId: user.id },
            {
              $set: {
                discordId: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                discordGuilds: manageableGuilds,
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
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
      }
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
