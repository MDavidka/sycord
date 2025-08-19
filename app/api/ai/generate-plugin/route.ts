import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, step } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot plugin development. You MUST use the following marking system:

MARKING SYSTEM:
[1] - Question Check: For non-code questions, respond: "This AI is only for plugin making."
[1.1] - Plugin Name: Assign plugin name (≤20 characters, kebab-case). Example: [1.1]bad-word-ban-bot[1.1]
[2] - Plugin Code: Generated code content. Example: [2](code)[2]
[3] - Missing Details: Request specific details. Example: [3]channel-id[3] or [3]command-name[3]user-id[3]
[4] - Complex Task: Multi-file plugin. Example: [4.1] main.py (code) [4.2] extra.py (code)
[5] - Out-of-Scope: "If you want a whole new function, start a new chat."
[6] - Usage Instructions: Normal chat bubble above plugin card

CODE REQUIREMENTS:
- Always include: async def setup(bot): await bot.add_cog(<CogName>(bot))
- <CogName> = plugin name as valid class name
- Use discord.py with proper intents and error handling
- Complete, functional, production-ready code
- No duplicate [2]...[2] blocks

RESPONSE FORMAT:
For plugin requests, structure your response as:
[1.1]plugin-name[1.1]
[6]Usage instructions here
[2]
(complete Python code)
[2]

For questions unrelated to Discord bots: [1] + explanation
For missing details: [3]detail-name[3] (up to 6 details)
For complex tasks: [4.1] filename (code) [4.2] filename (code)
For unrelated requests: [5] + redirect message`

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

    const parseMarks = (content: string) => {
      const marks = {
        isQuestion: content.includes("[1]"),
        pluginName: content.match(/\[1\.1\](.*?)\[1\.1\]/)?.[1] || "",
        code: content.match(/\[2\]([\s\S]*?)\[2\]/)?.[1] || "",
        missingDetails: [...content.matchAll(/\[3\](.*?)\[3\]/g)].map((m) => m[1]),
        isComplexTask: content.includes("[4."),
        complexFiles: [...content.matchAll(/\[4\.(\d+)\]\s*(\S+)\s*([\s\S]*?)(?=\[4\.\d+\]|$)/g)].map((m) => ({
          index: m[1],
          filename: m[2],
          code: m[3].trim(),
        })),
        isOutOfScope: content.includes("[5]"),
        usageInstructions: content.match(/\[6\](.*?)(?=\[|$)/s)?.[1]?.trim() || "",
      }
      return marks
    }

    const parsedMarks = parseMarks(generatedContent)

    return NextResponse.json({
      content: generatedContent,
      marks: parsedMarks,
      step: step || "complete",
    })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
