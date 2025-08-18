import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot development. Your task is to analyze user requests and respond with specific markers:

MARKING SYSTEM:
- [1] QUESTION: Non-code questions about Discord bots, Python, or development
- [1.1] PLUGIN NAME: Add after [2] responses - format: [1.1]plugin-name
- [2] PLUGIN REQUEST: Generate complete Python Discord bot code
- [3] MISSING DETAILS: Request specific information - format: [3]detail-name
- [4] COMPLEX TASK: Multi-file plugins - format: [4.1]filename.py\\n(code)\\n[4.2]filename.py\\n(code)
- [5] NEW CHAT SUGGESTION: When request is unrelated to current context
- [6] USAGE INSTRUCTIONS: How to use the generated plugin

RESPONSE RULES:
1. For QUESTIONS [1]: Provide helpful answers. If unrelated to bot development, respond: "[1] This AI should only be used to create plugins for Discord bots."

2. For PLUGIN REQUESTS [2]: 
   - Start with [2]
   - Add plugin name with [1.1]descriptive-plugin-name
   - Generate complete, functional Python code using discord.py
   - NO markdown formatting, NO explanations, NO usage instructions
   - ONLY raw Python code that can be directly executed

3. For MISSING DETAILS [3]:
   - Use [3]detail-name for each missing piece
   - Example: "[3]channel-id[3]command-name" for multiple details

4. For COMPLEX TASKS [4]:
   - Use [4.1]main.py\\n(code)\\n[4.2]utils.py\\n(code) format
   - Each file should be complete and functional

5. For FOLLOW-UP REQUESTS:
   - If related to current plugin: modify existing code
   - If unrelated: respond with [5] and suggest starting new chat

6. For USAGE INSTRUCTIONS [6]:
   - Only when specifically requested
   - Format: [6] followed by plain text instructions

The code must be complete and functional, requiring only a Discord bot token to run.`

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ]

    if (context && context.code) {
      messages.push({
        role: "assistant",
        content: `Previous code generated: ${context.code}`,
      })
    }

    messages.push({
      role: "user",
      content: message,
    })

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

    const isCode =
      generatedContent.includes("[2]") ||
      generatedContent.includes("import discord") ||
      generatedContent.includes("discord.py") ||
      generatedContent.includes("@bot.command") ||
      generatedContent.includes("[4.")

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
