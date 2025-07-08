// Example Discord bot webhook integration
// This shows how your Discord bot should call the webhook endpoints

const BOT_WEBHOOK_SECRET = "your-secret-key-here" // Set this in your environment variables
const WEBSITE_URL = "https://your-website.com" // Your website URL

// When bot joins a server
async function onBotJoinServer(guild) {
  try {
    // Fetch all roles from the guild
    const roles = guild.roles.cache
      .filter((role) => role.name !== "@everyone")
      .map((role) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
      }))

    const response = await fetch(`${WEBSITE_URL}/api/bot-webhook/server-join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serverId: guild.id,
        serverName: guild.name,
        serverIcon: guild.icon,
        roles: roles, // Send all roles to populate roles_and_names
        botSecret: BOT_WEBHOOK_SECRET,
      }),
    })

    if (response.ok) {
      console.log(`Successfully updated server status for ${guild.name}`)
    } else {
      console.error(`Failed to update server status: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error calling webhook:", error)
  }
}

// When bot leaves a server
async function onBotLeaveServer(guild) {
  try {
    const response = await fetch(`${WEBSITE_URL}/api/bot-webhook/server-leave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serverId: guild.id,
        botSecret: BOT_WEBHOOK_SECRET,
      }),
    })

    if (response.ok) {
      console.log(`Successfully updated server status for ${guild.name} (left)`)
    } else {
      console.error(`Failed to update server status: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error calling webhook:", error)
  }
}

// Example Discord.js integration
const { Client, GatewayIntentBits } = require("discord.js")

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
})

client.on("guildCreate", onBotJoinServer)
client.on("guildDelete", onBotLeaveServer)

client.login("your-bot-token")
