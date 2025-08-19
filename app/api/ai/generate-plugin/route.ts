import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, missingDetails } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot plugin development. You must use specific marks to categorize your responses:

MARKING SYSTEM:
- [1] - For non-code questions: Respond "This AI is only for plugin making."
- [1.1]plugin-name[1.1] - Plugin name (≤20 characters, kebab-case)
- [2]code[2] - Plugin code block
- [3]detail-name[3] - Missing details request (up to 6 details)
- [5] - Out-of-scope: "If you want a whole new function, start a new chat."
- [6] - Usage instructions (separate from code)

PLUGIN GENERATION RULES:
1. Always include: async def setup(bot): await bot.add_cog(<CogName>(bot))
2. Use proper discord.py syntax with commands.Cog
3. Convert plugin name to valid class name for <CogName>
4. Generate complete, functional Python code
5. Include error handling and best practices
6. No markdown formatting in code blocks

RESPONSE FORMAT:
For plugin requests:
[1.1]plugin-name[1.1]
[6]Usage instructions here
[2]
# Complete Python code here
[2]

For missing details:
[3]detail1[3]detail2[3] (up to 6 details)

For questions: [1] + explanation
For out-of-scope: [5] + message`

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
            content: missingDetails
              ? `${message} Additional details provided: ${JSON.stringify(missingDetails)}`
              : message,
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

    return NextResponse.json({ response: generatedContent })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
