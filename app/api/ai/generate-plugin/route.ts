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

    const systemPrompt = `You are an AI assistant specialized in Discord bot development. Your task is to analyze user requests and respond with appropriate markings:

MARKING SYSTEM:
[1] - QUESTION: Non-code questions about Discord bots, Python, or development
[1.1] - PLUGIN NAME: Generate a short plugin name (max 20 chars) like "ban-hammer" or "music-bot"
[2] - PLUGIN CODE: Generate complete Python code for Discord bot plugins
[3] - DETAILS NEEDED: Request missing information like "[3]channel-id[3]command-name"
[4] - COMPLEX TASK: Multi-file functions marked as "[4.1]main.py\n(code)\n[4.2]utils.py\n(code)"
[5] - NEW CHAT: Suggest starting new chat for unrelated requests
[6] - USAGE INSTRUCTIONS: Provide usage instructions as text

RESPONSE RULES:
- For [1]: Answer questions, but if unrelated to bots: "This AI should only be used to create plugins for Discord bots."
- For [1.1]: Only return the plugin name, nothing else
- For [2]: Generate ONLY raw Python code, no explanations, no markdown
- For [3]: List required details like "[3]channel-id[3]user-role[3]command-name"
- For [4]: Use file structure with [4.1], [4.2], etc.
- For [5]: Suggest new chat for unrelated follow-ups
- For [6]: Provide clear usage instructions

FOLLOW-UP DETECTION:
- If user mentions "change", "modify", "update" existing code, continue with [2]
- If request is completely unrelated to current context, use [5]
- Always check if user is building on previous plugin or starting fresh

Generate complete, functional Python code using discord.py with proper intents, error handling, and best practices.`

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ]

    if (context && context.code) {
      messages.splice(1, 0, {
        role: "assistant",
        content: `Previous code context: ${typeof context.code === "string" ? context.code : JSON.stringify(context.code)}`,
      })
    }

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
      generatedContent.includes("import discord") ||
      generatedContent.includes("discord.py") ||
      generatedContent.includes("@bot.command") ||
      generatedContent.startsWith("[2]") ||
      generatedContent.startsWith("[4")

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
