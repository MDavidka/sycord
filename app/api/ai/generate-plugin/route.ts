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
              "Your task is to build a Discord bot using the latest discord.py module with the correct intents. Interpret the user's request, understand what they are trying to achieve, and generate the complete Python code for that functionality. When responding, follow this exact format:\n\n<Full raw Python code> (no ``` or any extra formatting, only the code itself)\n\n2. <Step-by-step explanation of how to use the function/bot>\n\nDo not include anything else besides these two parts.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
