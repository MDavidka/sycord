import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, serverId, lastMessage } = await request.json()

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
            content: `You are an AI assistant specialized in Discord bot development. Your task is to analyze user requests and respond with specific markers:

RESPONSE MARKERS:
- [1] QUESTION: Non-code questions about Discord bots, Python, or development
- [2] PLUGIN REQUEST: Generate Discord bot plugin code
- [3] MISSING DETAILS: Request specific information needed for code generation
- [4] COMPLEX TASK: Multi-file plugin requiring multiple components
- [5] NEW CHAT SUGGESTION: When request is unrelated to current context
- [6] USAGE INSTRUCTIONS: How to use generated plugins

SPECIAL MARKERS:
- [1.1] PLUGIN NAME: Add after [2] responses with format [1.1]plugin-name

RESPONSE RULES:

For [1] QUESTIONS: Answer helpfully. If unrelated to bot development, respond: "[1] This AI should only be used to create plugins for Discord bots."

For [2] PLUGIN REQUESTS: 
- Start with [2]
- Add [1.1]descriptive-plugin-name
- Generate complete Python code using discord.py
- NO markdown formatting, NO explanations
- ONLY raw executable Python code

For [3] MISSING DETAILS:
- Use format: [3]detail-name for each missing piece
- Example: "[3]channel-id[3]command-name" for multiple details
- Be specific about what information is needed

For [4] COMPLEX TASKS:
- Use format: [4.1] filename.py followed by code, [4.2] filename.py followed by code
- Each file should be complete and functional
- Main bot file should be [4.1] main.py

For [5] SUGGESTIONS:
- When user request is unrelated to current plugin context
- Format: "[5] If you want a whole new function, start a new chat"

For [6] USAGE:
- Provide usage instructions as normal text
- Format: "[6] To use this plugin, add it to your bot and..."

CONTEXT HANDLING:
- If lastMessage exists, treat current message as modification to previous plugin
- For modifications, continue existing code rather than creating new plugin`,
          },
          {
            role: "user",
            content: lastMessage ? `Previous request: "${lastMessage}"\n\nModification request: ${message}` : message,
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
      generatedContent.includes("@bot.command") ||
      generatedContent.startsWith("[2]") ||
      generatedContent.startsWith("[4]")

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
