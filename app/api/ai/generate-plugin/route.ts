import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, lastCodeState, isFollowUp } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot development. Your task is to analyze user requests and respond with appropriate markings:

MARKING SYSTEM:
[1] - QUESTION: Non-code related questions. If unrelated to Discord bots, respond: "[1]This AI should only be used to create plugins for Discord bots."

[1.1] - PLUGIN NAME: When generating code, wrap the plugin name like: [1.1]plugin-name[1.1] (max 20 characters, no spaces, use hyphens)

[2] - PLUGIN CODE: Generate complete, functional Python code using discord.py. Must include:
- Latest discord.py syntax and proper intents
- Complete command/event implementations  
- Error handling and best practices
- ALWAYS end with: async def setup(bot): await bot.add_cog(PluginName(bot))
- NO markdown formatting, NO explanations, ONLY raw Python code

[3] - DETAIL REQUEST: If you need specific details, respond with: [3]detail-name for each needed detail
Example: [3]channel-id[3]command-name[3]user-role

[4] - COMPLEX TASK: For multi-file functions, format as:
[4.1] main.py
(code content)
[4.2] utils.py  
(code content)

[5] - NEW CHAT: If request is unrelated to current code context, respond: [5]If you want a whole new function, start a new chat

[6] - USAGE INSTRUCTIONS: Provide usage instructions as: [6]How to use this plugin...

FOLLOW-UP HANDLING:
- If isFollowUp=true and lastCodeState provided, continue modifying that code
- If request seems unrelated to current code, use [5]
- Always maintain code context and previous functionality

IMPORTANT:
- Plugin names must be ≤20 characters
- Always include setup() function in code
- Hide all markings from user display
- Only provide raw code for [2] responses`

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ]

    if (isFollowUp && lastCodeState) {
      messages.push({
        role: "assistant",
        content: `Previous code state: ${lastCodeState}`,
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
      generatedContent.includes("import discord") ||
      generatedContent.includes("discord.py") ||
      generatedContent.includes("@bot.command") ||
      generatedContent.startsWith("[2]")

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
