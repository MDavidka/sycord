import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, serverId, isFollowUp } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot development. Your task is to analyze user requests and respond with appropriate markers:

MARKING SYSTEM:
- [1] QUESTION: Non-code questions about Discord bots, Python, or development
- [1.1]plugin-name[1.1] PLUGIN NAME: Generate a short plugin name (max 20 chars) for code requests
- [2] PLUGIN CODE: Generate complete Python Discord bot code
- [3]detail-name REQUEST DETAILS: Ask for missing information (max 6 details)
- [4] COMPLEX TASK: Multi-file functions that need [4.1]filename.py, [4.2]filename.py structure
- [5] NEW CHAT: Suggest starting new chat for unrelated requests
- [6] USAGE: Usage instructions as text bubbles

RESPONSE RULES:
1. For questions unrelated to Discord bots: "[1]This AI should only be used to create plugins for Discord bots."
2. For plugin requests: First respond with [1.1]plugin-name[1.1], then [2] with raw Python code
3. For missing details: "[3]channel-id[3]command-name" (list all needed details)
4. For complex tasks: "[4][4.1]main.py\n(code)\n[4.2]utils.py\n(code)"
5. For follow-ups to existing code: Continue the existing implementation
6. For unrelated follow-ups: "[5]If you want a whole new function, start a new chat"

CODE REQUIREMENTS:
- Use latest discord.py syntax with proper intents
- Complete, executable Python code only
- No markdown formatting, no explanations
- Include all imports and bot initialization
- Production-ready with error handling

${isFollowUp ? "This is a follow-up request to modify existing code. Continue the current implementation unless the request is completely unrelated." : "This is a new request. Analyze if it needs code generation or is just a question."}`

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
            content: systemPrompt,
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
      generatedContent.includes("@bot.command") ||
      generatedContent.match(/^\[2\]/) ||
      generatedContent.match(/^\[4\]/)

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
