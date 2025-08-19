import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, step, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    if (step) {
      return await handleGenerationStep(step, message, context, apiKey)
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
            content: `You are an AI assistant specialized in Discord bot plugin creation with a structured marking system.

MARKING SYSTEM - You MUST use these exact markers:

[1] - Question Check: If user asks non-code questions, respond: "This AI is only for plugin making."
[1.1] - Plugin Name: Assign kebab-case name ≤20 chars. Format: [1.1]plugin-name[1.1]
[2] - Plugin Code: Wrap generated code. Format: [2](code)[2]
[3] - Missing Details: Request up to 6 details. Format: [3]detail-name[3] or [3]detail1[3]detail2[3]
[4] - Complex Task: Multi-file plugins. Format: [4.1]filename1(code)[4.2]filename2(code)
[5] - Out-of-Scope: "If you want a whole new function, start a new chat."
[6] - Usage Instructions: Plain text above plugin card

CODE RULES:
- Always include: async def setup(bot): await bot.add_cog(ClassName(bot))
- Use plugin name as class name (converted to valid Python class)
- Complete, functional discord.py code
- No markdown formatting in code blocks
- Plugin names must be ≤20 characters, kebab-case

EXAMPLES:
User: "Make a bad word ban bot"
Response: 
[1.1]bad-word-ban-bot[1.1]
[6]Use /banword add <word> to add a banned word.
[2]
import discord
from discord.ext import commands

class BadWordBanBot(commands.Cog):
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
    await bot.add_cog(BadWordBanBot(bot))
[2]`,
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

    const parsedResponse = parseMarkings(generatedContent)
    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

async function handleGenerationStep(step: number, message: string, context: any, apiKey: string) {
  const stepPrompts = {
    1: "Information collected. Confirm all details are ready for plugin generation.",
    2: `Planning structure for: ${message}. Write at least 20 lines covering purpose, commands, listeners, edge cases, errors, dependencies, scalability.`,
    3: `Generate complete Discord bot plugin code for: ${message}. Include all necessary imports, commands, and setup function.`,
    4: `Review and optimize the generated code. Find bugs, apply optimizations, and mark changes inline.`,
    5: `Finalize code with any remaining improvements. If no optimizations needed, return the current version.`,
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
          content: stepPrompts[step as keyof typeof stepPrompts] || stepPrompts[3],
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

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  return NextResponse.json({
    step,
    content,
    completed: step === 5,
  })
}

function parseMarkings(content: string) {
  const result: any = {
    type: "normal",
    content: content,
  }

  // Check for question [1]
  if (content.includes("This AI is only for plugin making")) {
    result.type = "question"
    result.content = content.replace(/\[1\]/g, "").trim()
    return result
  }

  // Extract plugin name [1.1]
  const nameMatch = content.match(/\[1\.1\](.*?)\[1\.1\]/s)
  if (nameMatch) {
    result.pluginName = nameMatch[1].trim()
  }

  // Extract plugin code [2]
  const codeMatch = content.match(/\[2\](.*?)\[2\]/s)
  if (codeMatch) {
    result.type = "plugin"
    result.code = codeMatch[1].trim()
  }

  // Extract missing details [3]
  const detailsMatches = content.match(/\[3\](.*?)\[3\]/g)
  if (detailsMatches) {
    result.type = "missing_details"
    result.missingDetails = detailsMatches.map((match) => match.replace(/\[3\]/g, "").trim())
  }

  // Extract complex task [4]
  const complexMatches = content.match(/\[4\.(\d+)\]\s*(\w+\.py)?\s*(.*?)(?=\[4\.\d+\]|$)/gs)
  if (complexMatches) {
    result.type = "complex_task"
    result.files = complexMatches.map((match, index) => {
      const fileMatch = match.match(/\[4\.(\d+)\]\s*(\w+\.py)?\s*(.*)/s)
      return {
        id: fileMatch?.[1] || (index + 1).toString(),
        filename: fileMatch?.[2] || `file${index + 1}.py`,
        code: fileMatch?.[3]?.trim() || "",
      }
    })
  }

  // Check for out-of-scope [5]
  if (content.includes("start a new chat")) {
    result.type = "out_of_scope"
    result.content = content.replace(/\[5\]/g, "").trim()
  }

  // Extract usage instructions [6]
  const usageMatch = content.match(/\[6\](.*?)(?=\[|$)/s)
  if (usageMatch) {
    result.usageInstructions = usageMatch[1].trim()
  }

  // Clean content of all markers
  result.content = content
    .replace(/\[1\.1\].*?\[1\.1\]/gs, "")
    .replace(/\[2\].*?\[2\]/gs, "")
    .replace(/\[3\].*?\[3\]/g, "")
    .replace(/\[4\.\d+\].*?(?=\[4\.\d+\]|$)/gs, "")
    .replace(/\[5\]/g, "")
    .replace(/\[6\].*?(?=\[|$)/gs, "")
    .trim()

  return result
}
