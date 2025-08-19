import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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
            content: `You are an AI assistant specialized in Discord bot development with a comprehensive marking system.

MARKING SYSTEM - Use these exact markers:

[1] - Question Check: If user asks non-code questions, respond: "This AI is only for plugin making."

[1.1] - Plugin Name: Assign plugin name (≤20 characters, kebab-case)
Example: [1.1]bad-word-ban-bot[1.1]

[2] - Plugin Code: Generated code content
Example:
[2]
(Python code here)
[2]

[3] - Missing Details Request: Request up to 6 missing details
Example: [3]channel-id[3] or [3]command-name[3]user-id[3]

[4] - Complex Task (Multi-file Plugin): For plugins requiring multiple files
Example:
[4.1] main.py
(code)
[4.2] extra.py
(code)

[5] - Out-of-Scope Request: "If you want a whole new function, start a new chat."

[6] - Usage Instructions: Plain text instructions above plugin card
Example: "Use /banword add <word> to add a banned word."

CODE CONSISTENCY RULES:
- Always include at bottom: async def setup(bot): await bot.add_cog(<CogName>(bot))
- <CogName> = plugin name as valid class name
- Plugin names ≤20 characters
- Usage instructions [6] never inside code blocks
- No duplicate [2]...[2] blocks

FOLLOW-UP ENFORCEMENT:
- Follow-ups are mandatory for extending current plugin
- If unrelated input without new chat: "⚠️ Follow-up required: your message must continue the current plugin or start a new chat. Please provide missing details or context."
- Always return last code state for continuity
- If irrelevant → respond with [5]

Generate complete, functional Python code using discord.py with proper intents, imports, error handling, and production-ready structure.`,
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

    const parseAIResponse = (content: string) => {
      const result: any = {
        type: "normal",
        content: content,
        pluginName: null,
        code: null,
        usageInstructions: null,
        missingDetails: [],
        complexFiles: [],
        isOutOfScope: false,
        isQuestion: false,
      }

      // Check for [1] - Question
      if (content.includes("[1]") || content.includes("This AI is only for plugin making")) {
        result.type = "question"
        result.isQuestion = true
        result.content = content.replace(/\[1\]/g, "").trim()
        return result
      }

      // Check for [5] - Out of scope
      if (content.includes("[5]") || content.includes("start a new chat")) {
        result.type = "out_of_scope"
        result.isOutOfScope = true
        result.content = content.replace(/\[5\]/g, "").trim()
        return result
      }

      // Extract [1.1] - Plugin Name
      const pluginNameMatch = content.match(/\[1\.1\](.*?)\[1\.1\]/)
      if (pluginNameMatch) {
        result.pluginName = pluginNameMatch[1].trim()
        result.type = "plugin"
      }

      // Extract [2] - Plugin Code
      const codeMatch = content.match(/\[2\]([\s\S]*?)\[2\]/)
      if (codeMatch) {
        result.code = codeMatch[1].trim()
        result.type = "plugin"
      }

      // Extract [3] - Missing Details
      const missingDetailsMatches = content.match(/\[3\](.*?)\[3\]/g)
      if (missingDetailsMatches) {
        result.missingDetails = missingDetailsMatches.map((match) => match.replace(/\[3\]/g, "").trim())
        result.type = "missing_details"
      }

      // Extract [4] - Complex Task Files
      const complexFileMatches = content.match(/\[4\.\d+\]\s*(.*?)\n([\s\S]*?)(?=\[4\.\d+\]|$)/g)
      if (complexFileMatches) {
        result.complexFiles = complexFileMatches.map((match) => {
          const lines = match.split("\n")
          const filename = lines[0].replace(/\[4\.\d+\]\s*/, "").trim()
          const code = lines.slice(1).join("\n").trim()
          return { filename, code }
        })
        result.type = "complex_task"
      }

      // Extract [6] - Usage Instructions
      const usageMatch = content.match(/\[6\](.*?)(?=\[|$)/s)
      if (usageMatch) {
        result.usageInstructions = usageMatch[1].trim()
      }

      // Clean content for display
      result.content = content
        .replace(/\[1\.1\].*?\[1\.1\]/g, "")
        .replace(/\[2\][\s\S]*?\[2\]/g, "")
        .replace(/\[3\].*?\[3\]/g, "")
        .replace(/\[4\.\d+\][\s\S]*?(?=\[4\.\d+\]|$)/g, "")
        .replace(/\[6\].*?(?=\[|$)/gs, "")
        .replace(/\[5\]/g, "")
        .trim()

      return result
    }

    const parsedResponse = parseAIResponse(generatedContent)

    return NextResponse.json({
      ...parsedResponse,
      rawContent: generatedContent,
    })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
