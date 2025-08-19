export interface ParsedAIResponse {
  type: "question" | "plugin" | "missing-details" | "complex-task" | "out-of-scope" | "usage-instructions"
  pluginName?: string
  code?: string
  files?: { name: string; content: string }[]
  missingDetails?: string[]
  message?: string
  usageInstructions?: string
}

export interface MissingDetail {
  name: string
  value: string
}

export class AIMarksParser {
  static parseResponse(response: string): ParsedAIResponse {
    // [1] - Question Check
    if (response.includes("[1]") && !response.includes("[1.1]")) {
      return {
        type: "question",
        message: "This AI is only for plugin making.",
      }
    }

    // [5] - Out-of-Scope Request
    if (response.includes("[5]")) {
      return {
        type: "out-of-scope",
        message: "If you want a whole new function, start a new chat.",
      }
    }

    // [6] - Usage Instructions
    const usageMatch = response.match(/\[6\](.*?)\[6\]/s)
    let usageInstructions: string | undefined
    if (usageMatch) {
      usageInstructions = usageMatch[1].trim()
    }

    // [1.1] - Plugin Name
    const pluginNameMatch = response.match(/\[1\.1\](.*?)\[1\.1\]/)
    const pluginName = pluginNameMatch ? pluginNameMatch[1].trim() : undefined

    // [3] - Missing Details Request
    const missingDetailsMatch = response.match(/\[3\](.*?)\[3\]/g)
    if (missingDetailsMatch) {
      const missingDetails = missingDetailsMatch.map((match) => match.replace(/\[3\]/g, "").trim())
      return {
        type: "missing-details",
        missingDetails,
        pluginName,
      }
    }

    // [4] - Complex Task (Multi-file Plugin)
    const complexTaskMatch = response.match(/\[4\.(\d+)\]\s*(\S+)\s*([\s\S]*?)(?=\[4\.\d+\]|$)/g)
    if (complexTaskMatch) {
      const files = complexTaskMatch.map((match) => {
        const fileMatch = match.match(/\[4\.(\d+)\]\s*(\S+)\s*([\s\S]*)/)
        if (fileMatch) {
          return {
            name: fileMatch[2].trim(),
            content: fileMatch[3].trim(),
          }
        }
        return { name: "unknown.py", content: "" }
      })

      return {
        type: "complex-task",
        pluginName,
        files,
        usageInstructions,
      }
    }

    // [2] - Plugin Code
    const codeMatch = response.match(/\[2\]([\s\S]*?)\[2\]/)
    if (codeMatch) {
      return {
        type: "plugin",
        pluginName,
        code: codeMatch[1].trim(),
        usageInstructions,
      }
    }

    // Default fallback
    return {
      type: "question",
      message: response,
    }
  }

  static validatePluginName(name: string): boolean {
    // Must be ≤20 characters and kebab-case
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    return name.length <= 20 && kebabCaseRegex.test(name)
  }

  static formatMissingDetailsRequest(details: string[], lastMessage: string): string {
    return `I requested this feature before "${lastMessage}", but missed these details: ${details.join(", ")}.`
  }

  static generateSampleResponse(type: "simple" | "complex" | "missing-details"): string {
    switch (type) {
      case "simple":
        return `[1.1]bad-word-ban-bot[1.1]

[6]Use \`/banword add <word>\` to add a banned word.[6]

[2]
import discord
from discord.ext import commands

class bad_word_ban_bot(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.banned_words = []

    @commands.Cog.listener()
    async def on_message(self, message):
        if any(word in message.content for word in self.banned_words):
            await message.delete()

    @commands.command()
    async def banword(self, ctx, word: str):
        self.banned_words.append(word)
        await ctx.send(f"Added \`{word}\` to banned words.")

async def setup(bot):
    await bot.add_cog(bad_word_ban_bot(bot))
[2]`

      case "complex":
        return `[1.1]advanced-moderation-bot[1.1]

[6]Use \`/setup\` to configure the bot, then \`/moderate\` to start monitoring.[6]

[4.1] main.py
import discord
from discord.ext import commands
from .config import Config
from .database import Database

class AdvancedModerationBot(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.config = Config()
        self.db = Database()

async def setup(bot):
    await bot.add_cog(AdvancedModerationBot(bot))

[4.2] config.py
class Config:
    def __init__(self):
        self.max_warnings = 3
        self.auto_ban = True
        self.log_channel = None`

      case "missing-details":
        return `[1.1]welcome-bot[1.1]

[3]channel-id[3]welcome-message[3]`

      default:
        return "[1]This AI is only for plugin making."
    }
  }
}
