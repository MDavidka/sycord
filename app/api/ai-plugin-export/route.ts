import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { AIPluginSession } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, format = "zip" } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Get session data
    const client = await clientPromise
    const db = client.db("dash-bot")
    const sessionsCollection = db.collection<AIPluginSession>("ai_plugin_sessions")

    const pluginSession = await sessionsCollection.findOne({
      sessionId,
      userId: session.user.email,
    })

    if (!pluginSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (pluginSession.status !== "completed") {
      return NextResponse.json({ error: "Session not completed" }, { status: 400 })
    }

    // Generate export package
    const exportData = await generateExportPackage(pluginSession, format)

    return NextResponse.json({
      success: true,
      exportData,
      downloadUrl: exportData.downloadUrl,
      metadata: {
        pluginName: pluginSession.pluginMetadata?.name || "discord-plugin",
        version: pluginSession.pluginMetadata?.version || "1.0.0",
        author: pluginSession.pluginMetadata?.author || session.user.name,
        exportFormat: format,
        exportedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error exporting plugin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateExportPackage(session: AIPluginSession, format: string) {
  const pluginName = session.pluginMetadata?.name || "discord_plugin"
  const code = session.generatedCode || ""

  // Generate additional files
  const files = {
    [`${pluginName}.py`]: code,
    "requirements.txt": generateRequirements(code),
    "README.md": generateReadme(session),
    "config.json": generateConfig(session),
    "install.md": generateInstallGuide(session),
  }

  // For now, return file contents (in production, would create actual zip)
  return {
    files,
    downloadUrl: `/api/download/${session.sessionId}`, // Placeholder URL
    format,
    size: Object.values(files).join("").length,
  }
}

function generateRequirements(code: string): string {
  const requirements = ["discord.py>=2.3.0"]

  if (code.includes("aiohttp")) requirements.push("aiohttp>=3.8.0")
  if (code.includes("asyncpg")) requirements.push("asyncpg>=0.28.0")
  if (code.includes("redis")) requirements.push("redis>=4.5.0")
  if (code.includes("requests")) requirements.push("requests>=2.28.0")

  return requirements.join("\n")
}

function generateReadme(session: AIPluginSession): string {
  const pluginName = session.pluginMetadata?.name || "Discord Plugin"
  const description = session.pluginMetadata?.description || session.description || "AI-generated Discord plugin"

  return `# ${pluginName}

${description}

## Installation

1. Install required dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Add the cog to your bot:
\`\`\`python
await bot.load_extension('${pluginName.toLowerCase()}')
\`\`\`

## Configuration

See \`config.json\` for configuration options.

## Usage

This plugin was generated using AI and includes the following features:
${session.messages
  .filter((m) => m.role === "ai" && m.content.includes("[2]"))
  .map((m) => `- ${m.content.split("[2]")[0].trim()}`)
  .join("\n")}

## Support

For issues or questions, please refer to the Discord.py documentation or your bot's support channels.

Generated on: ${new Date(session.created_at).toLocaleDateString()}
`
}

function generateConfig(session: AIPluginSession): string {
  return JSON.stringify(
    {
      name: session.pluginMetadata?.name || "discord_plugin",
      version: session.pluginMetadata?.version || "1.0.0",
      description: session.pluginMetadata?.description || session.description,
      author: session.pluginMetadata?.author || "AI Generator",
      permissions: session.pluginMetadata?.permissions || [],
      dependencies: session.pluginMetadata?.dependencies || [],
      settings: {
        enabled: true,
        debug: false,
      },
    },
    null,
    2,
  )
}

function generateInstallGuide(session: AIPluginSession): string {
  return `# Installation Guide

## Prerequisites
- Python 3.8 or higher
- discord.py 2.3.0 or higher
- A Discord bot token

## Step-by-step Installation

1. **Download the plugin files**
   - Extract all files to your bot's cogs directory

2. **Install dependencies**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. **Configure the plugin**
   - Edit \`config.json\` with your settings
   - Ensure your bot has the required permissions

4. **Load the cog**
   \`\`\`python
   # In your main bot file
   await bot.load_extension('${session.pluginMetadata?.name || "discord_plugin"}')
   \`\`\`

5. **Test the plugin**
   - Use the commands in your Discord server
   - Check console for any error messages

## Troubleshooting

- Ensure your bot has the necessary permissions
- Check that all dependencies are installed
- Verify your Discord.py version is compatible

## Need Help?

This plugin was generated by AI. For Discord.py specific help, visit:
- [Discord.py Documentation](https://discordpy.readthedocs.io/)
- [Discord.py Discord Server](https://discord.gg/r3sSKJJ)
`
}
