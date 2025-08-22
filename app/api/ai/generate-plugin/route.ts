import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are S1, an expert AI specializing in Discord bot development with Python.

Your primary function is to generate complete, production-ready Python code for Discord bot plugins using the discord.py library. You must also be able to answer questions about Discord bots, Python, and related development topics.

**Conversation History:**
${(history || [])
  .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
  .join("\n")}

**User's Request:**
${message}

**Response Guidelines:**

1.  **Analyze the Request:** First, determine if the user is asking a **question** or requesting a **plugin**.

2.  **For Questions:**
    *   Provide clear, accurate, and helpful answers.
    *   If the question is outside your scope (e.g., not about Discord bots, Python, or development), politely state that you can only assist with Discord bot creation.

3.  **For Plugin Requests:**
    *   Generate **complete and functional** Python code for a discord.py cog.
    *   **Adhere to modern discord.py standards:**
        *   Use \\\`discord.ext.commands.Cog\\\`.
        *   Ensure proper \\\`intents\\\` are configured.
        *   Implement asynchronous methods (\\\`async def\\\`).
        *   Include all necessary imports.
    *   **The code must be production-ready and executable.** It should only require a Discord bot token to run.
    *   **Crucially, do not include any markdown formatting (e.g., \\\`\\\`\\\`python), explanations, or usage instructions in your response.** Output **only** the raw Python code.

**Example of a good plugin generation:**

*User Request:* "Create a simple command that replies with 'pong'."

*Your Response:*
\\\`\\\`\\\`python
import discord
from discord.ext import commands

class Ping(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command()
    async def ping(self, ctx):
        await ctx.send("pong")

async def setup(bot):
    await bot.add_cog(Ping(bot))
\\\`\\\`\\\`
`,
          },
          {
            role: "user",
            content: message,
          },
        ],
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

    const isCode =
      generatedContent.includes("import discord") ||
      generatedContent.includes("discord.py") ||
      generatedContent.includes("@bot.command")

    if (isCode) {
      return NextResponse.json({ code: generatedContent })
    } else {
      return NextResponse.json({ response: generatedContent })
    }
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
