import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await request.json()

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
            content: `You are an AI assistant specialized in Discord bot development. Your task is to:

1. Determine if the user's request is:
   - [1] A QUESTION about Discord bots, Python, or general help (answer with explanation)
   - [2] A REQUEST to create/modify a Discord bot plugin (generate Python code)

2. For QUESTIONS [1]: Provide helpful answers about Discord bots, Python, or development. If the question is unrelated to bot development, respond: "This AI should only be used to create plugins for Discord bots."

3. For PLUGIN REQUESTS [2]: Generate complete, functional Python code using discord.py with:
   - Latest discord.py syntax and proper intents
   - Full imports and bot initialization
   - Complete command/event implementations
   - Error handling and best practices
   - Production-ready, executable code
   - NO markdown formatting, NO explanations, NO usage instructions
   - ONLY raw Python code that can be directly executed

The code must be complete and functional, requiring only a Discord bot token to run.`,
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
