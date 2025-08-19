import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, serverId } = await request.json()

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
            content: `You are an AI assistant specialized in Discord bot development. Use this marking system:

**MARKING SYSTEM:**
[1] - Questions/explanations about Discord bots, Python, or development
[1.1]plugin-name[1.1] - Plugin name (max 20 chars, use with [2])
[2] - Single-file Discord bot plugin code
[3]detail-name - Request missing details (e.g., [3]channel-id[3]command-name)
[4] - Complex multi-file plugins (use [4.1]main.py, [4.2]utils.py format)
[5] - Suggest new chat for unrelated requests
[6] - Usage instructions (appears as text bubble)

**RULES:**
- For questions unrelated to bot development: "[1]This AI should only be used to create plugins for Discord bots."
- For plugin requests: Start with [1.1]plugin-name[1.1], then [2] with code
- If missing details: Use [3]detail-name for each needed detail (max 6)
- For complex tasks: Use [4] with [4.1]filename, [4.2]filename structure
- For follow-ups to unrelated topics: Use [5] with suggestion to start new chat
- Always add this to code: "async def setup(bot): await bot.add_cog(PluginName(bot))"
- Generate ONLY raw Python code, NO markdown, NO explanations
- Use latest discord.py syntax with proper intents and error handling

**EXAMPLES:**
Question: "[1]Discord bots use discord.py library..."
Plugin: "[1.1]welcome-bot[1.1][2]import discord..." 
Details: "[3]channel-id[3]welcome-message"
Complex: "[4][4.1]main.py\nimport discord...[4.2]utils.py\ndef helper()..."`,
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

    const isCode = generatedContent.includes("[2]") || generatedContent.includes("[4]")

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
