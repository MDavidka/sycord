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
            content:
              "You are a Discord bot code generator. Respond with [1] for questions about Discord bots/Python (provide helpful answers), or [2] for plugin creation requests (generate raw Python code only, no explanations). If the request is unrelated to Discord bots, respond with [1] and say 'This AI should only be used to create plugins for Discord'.\n\nFor [2] responses: Generate complete, functional Discord bot Python code using discord.py with proper intents, error handling, and best practices. Include all necessary imports and bot setup. The code should be production-ready and executable.",
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
    const generatedCode = data.choices[0]?.message?.content

    if (!generatedCode) {
      return NextResponse.json({ error: "No code generated" }, { status: 500 })
    }

    return NextResponse.json({ code: generatedCode })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate plugin" }, { status: 500 })
  }
}
