import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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

    const systemPrompt = `You are an AI assistant specialized in Discord bot plugin development. Your task is to analyze user requests and respond with specific markers:

MARKING SYSTEM:
- [1] - Question Check: For non-code questions, respond: "This AI is only for plugin making."
- [1.1] - Plugin Name: Assign a plugin name (≤20 characters, kebab-case). Example: [1.1]bad-word-ban-bot[1.1]
- [2] - Plugin Code: Generated code content wrapped in [2]...[2]
- [3] - Missing Details: Request missing info. Example: [3]channel-id[3] or [3]command-name[3]user-id[3]
- [4] - Complex Task: Multi-file plugins. Example: [4.1] main.py ... [4.2] extra.py ...
- [5] - Out-of-Scope: "If you want a whole new function, start a new chat."
- [6] - Usage Instructions: Normal text above plugin card

CODE REQUIREMENTS:
- Always include: async def setup(bot): await bot.add_cog(<CogName>(bot))
- Use discord.py with proper intents
- Complete, functional Python code
- Plugin name converted to valid class name
- No duplicate [2]...[2] blocks

For plugin requests, always provide [1.1]plugin-name[1.1], optional [6] usage instructions, and [2] code block.`

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
      const marks: any = {}

      // Extract plugin name [1.1]name[1.1]
      const nameMatch = content.match(/\[1\.1\](.*?)\[1\.1\]/)
      if (nameMatch) {
        marks.pluginName = nameMatch[1]
      }

      // Extract code [2]...[2]
      const codeMatch = content.match(/\[2\]([\s\S]*?)\[2\]/)
      if (codeMatch) {
        marks.code = codeMatch[1].trim()
      }

      // Extract usage instructions [6]
      const usageMatch = content.match(/\[6\](.*?)(?=\[|$)/)
      if (usageMatch) {
        marks.usage = usageMatch[1].trim()
      }

      return marks
    }

    const marks = parseMarks(generatedContent)

    // Determine response type
    if (generatedContent.includes("[1]")) {
      return NextResponse.json({
        type: "question",
        response: generatedContent.replace(/\[1\]\s*/, ""),
      })
    } else if (marks.code || generatedContent.includes("import discord")) {
      return NextResponse.json({
        type: "plugin",
        code: marks.code || generatedContent,
        pluginName: marks.pluginName || "untitled-plugin",
        marks: marks,
      })
    } else {
      return NextResponse.json({
        type: "question",
        response: generatedContent,
      })
    }
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
