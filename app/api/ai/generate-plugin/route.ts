import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, serverId, hasExistingCode } = await request.json()

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
[1.1] - PLUGIN NAME: Generate a short plugin name (max 20 chars) like "ban-hammer" or "welcome-bot"
[2] - PLUGIN CODE: Generate complete Python code for Discord bot plugins
[3] - DETAILS REQUEST: Request missing information like "[3]channel-id[3]command-name"
[4] - COMPLEX TASK: Multi-file functions that need multiple Python files
[4.1] - COMPLEX FILE: Individual files in complex tasks like "[4.1]main.py" then "[4.2]utils.py"
[5] - NEW CHAT: Suggest starting new chat for unrelated requests
[6] - USAGE INSTRUCTIONS: How to use the generated plugin

RESPONSE RULES:
- For QUESTIONS [1]: Answer helpfully. If unrelated to bots: "This AI should only be used to create plugins for Discord bots."
- For PLUGIN NAMES [1.1]: Generate short, descriptive names without spaces
- For PLUGIN CODE [2]: Generate complete, functional Python code with discord.py
- For DETAILS [3]: Request specific missing info like channel IDs, command names, user IDs
- For COMPLEX [4]: Use when multiple files are needed, then follow with [4.1], [4.2], etc.
- For NEW CHAT [5]: When request is unrelated to current plugin context
- For USAGE [6]: Provide setup instructions as text

CODE REQUIREMENTS:
- Use latest discord.py syntax with proper intents
- Include complete imports and bot initialization
- Add error handling and best practices
- Generate production-ready, executable code
- NO markdown formatting, NO explanations in code responses
- Plugin names must be under 20 characters

FOLLOW-UP HANDLING:
- If user has existing code context, modify the existing code
- If request is unrelated to current plugin, suggest [5] new chat
- Continue plugin development when user requests changes

${hasExistingCode ? "CONTEXT: User has existing plugin code. Modify the existing code based on their request." : ""}`

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

    const markPattern = /^\[(\d+(?:\.\d+)?)\]/
    const match = generatedContent.match(markPattern)

    if (match) {
      const mark = match[1]

      // Handle complex multi-file responses
      if (mark === "4" || mark.startsWith("4.")) {
        const files: { [key: string]: string } = {}
        const filePattern = /\[4\.(\d+)\]\s*([^[]+)/g
        let fileMatch

        while ((fileMatch = filePattern.exec(generatedContent)) !== null) {
          const fileNumber = fileMatch[1]
          const fileName = `file_${fileNumber}.py`
          const codeStart = fileMatch.index + fileMatch[0].length
          const nextFileIndex = generatedContent.indexOf(`[4.${Number.parseInt(fileNumber) + 1}]`, codeStart)
          const codeEnd = nextFileIndex === -1 ? generatedContent.length : nextFileIndex
          const code = generatedContent.substring(codeStart, codeEnd).trim()

          files[fileName] = code
        }

        if (Object.keys(files).length > 0) {
          return NextResponse.json({ code: files, type: "complex" })
        }
      }

      // Handle single file code responses
      if (mark === "2" || mark === "1.1") {
        const isCode =
          generatedContent.includes("import discord") ||
          generatedContent.includes("discord.py") ||
          generatedContent.includes("@bot.command")

        if (isCode) {
          return NextResponse.json({ code: generatedContent, type: mark === "1.1" ? "plugin-name" : "plugin" })
        }
      }
    }

    // Default to response for questions and other types
    return NextResponse.json({ response: generatedContent })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
