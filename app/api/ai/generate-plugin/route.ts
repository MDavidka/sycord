import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, conversationHistory, lastCodeState } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot plugin development. You MUST use specific markers to categorize your responses:

MARKING SYSTEM:
[1] - Non-code questions: Answer normally, then wrap in [1]...[1]
[1.1] - Plugin name: Generate max 20 chars, use hyphens, format: [1.1]plugin-name[1.1]
[2] - Plugin code: Wrap complete code in [2]...[2]
[3] - Missing details: Request specific info, format: [3]detail-name[3] (max 6 requests)
[4] - Complex multi-file: Use [4.1] main.py, [4.2] extra.py format
[5] - Out-of-scope: Respond "If you want a whole new function, start a new chat."
[6] - Usage instructions: Plain text above plugin card

RULES:
1. Always include "async def setup(bot): await bot.add_cog(<CogName>(bot))" at end of code
2. Plugin names ≤ 20 characters, use hyphens not spaces
3. If user asks unrelated to current plugin context → use [5]
4. After [3] detail request, generate code immediately when details provided
5. For follow-ups, include last known code state if continuing same plugin

EXAMPLE FLOW:
User: "Make a bad word ban bot"
Response:
[1.1]bad-word-ban-bot[1.1]

[6]Use \`/banword add <word>\` to add a banned word.[6]

[2]
import discord
from discord.ext import commands

class BadWordBanBot(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.banned_words = []

    @commands.Cog.listener()
    async def on_message(self, message):
        if any(word in message.content.lower() for word in self.banned_words):
            await message.delete()

    @commands.command()
    async def banword(self, ctx, *, word: str):
        self.banned_words.append(word.lower())
        await ctx.send(f"Added \`{word}\` to banned words.")

async def setup(bot):
    await bot.add_cog(BadWordBanBot(bot))
[2]`

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: lastCodeState ? `${message}\n\nLast code state:\n${lastCodeState}` : message },
    ]

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 })
    }

    const parseResponse = (content: string) => {
      const result: any = { rawContent: content }

      // Extract plugin name [1.1]
      const nameMatch = content.match(/\[1\.1\](.*?)\[1\.1\]/)
      if (nameMatch) {
        result.pluginName = nameMatch[1]
      }

      // Extract code [2]
      const codeMatch = content.match(/\[2\]([\s\S]*?)\[2\]/)
      if (codeMatch) {
        result.code = codeMatch[1].trim()
        result.type = "plugin"
      }

      // Extract complex files [4.1], [4.2], etc.
      const complexMatches = content.match(/\[4\.\d+\][\s\S]*?(?=\[4\.\d+\]|$)/g)
      if (complexMatches) {
        result.complexFiles = complexMatches
          .map((match) => {
            const fileMatch = match.match(/\[4\.(\d+)\]\s*(\S+)\s*([\s\S]*)/)
            if (fileMatch) {
              return {
                index: fileMatch[1],
                filename: fileMatch[2],
                code: fileMatch[3].trim(),
              }
            }
            return null
          })
          .filter(Boolean)
        result.type = "complex"
      }

      // Extract missing details [3]
      const detailMatches = content.match(/\[3\](.*?)\[3\]/g)
      if (detailMatches) {
        result.missingDetails = detailMatches.map((match) => {
          const detail = match.replace(/\[3\]/g, "")
          return detail
        })
        result.type = "missing_details"
      }

      // Extract usage instructions [6]
      const usageMatch = content.match(/\[6\](.*?)\[6\]/)
      if (usageMatch) {
        result.usageInstructions = usageMatch[1]
      }

      // Check for out-of-scope [5]
      if (content.includes("If you want a whole new function, start a new chat.")) {
        result.type = "out_of_scope"
      }

      // Check for question [1]
      const questionMatch = content.match(/\[1\]([\s\S]*?)\[1\]/)
      if (questionMatch) {
        result.answer = questionMatch[1].trim()
        result.type = "question"
      }

      // If no specific type detected, treat as question
      if (!result.type) {
        result.type = "question"
        result.answer = content
      }

      return result
    }

    const parsedResponse = parseResponse(generatedContent)

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
