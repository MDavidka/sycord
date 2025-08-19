import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, followUp, currentCode, serverId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot development. Your task is to analyze user requests and respond with specific markers:

MARKING SYSTEM:
- [1] QUESTION: Non-code related questions. Respond: "[1]This AI should only be used to create plugins for Discord bots.[1]"
- [1.1] PLUGIN NAME: Generate a short plugin name (max 20 chars). Format: "[1.1]plugin-name[1.1]"
- [2] PLUGIN CODE: Generate complete Python Discord bot code
- [3] MISSING DETAILS: Request specific details. Format: "[3]detail-name[3]" (max 6 details)
- [4] COMPLEX TASK: Multiple files needed. Format: "[4.1]main.py\n(code)\n[4.2]extra.py\n(code)"
- [5] NEW CHAT: Suggest new chat for unrelated requests. Format: "[5]If you want a whole new function, start a new chat[5]"
- [6] USAGE INSTRUCTIONS: Display as normal text above plugin cards

FOLLOW-UP RULES:
${
  followUp && currentCode
    ? `
- You are continuing work on existing code
- Current code state: ${currentCode}
- Modify/enhance the existing code, don't create new
- If request is unrelated to current project, use [5] marker
`
    : `
- This is a new request
- Generate fresh code if it's a plugin request
`
}

CODE REQUIREMENTS:
- Always include: async def setup(bot): await bot.add_cog(<PluginName>(bot))
- Use discord.py with proper intents
- Complete, functional code only
- No markdown formatting
- Production-ready

DETAIL REQUESTS:
Common details to request: channel-id, command-name, user-id, role-id, message-content, time-duration

Analyze the user request and respond with appropriate markers.`

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

    const parseResponse = (content: string) => {
      const result: any = {
        type: "unknown",
        content: content,
      }

      // Check for [1] - Question
      if (content.includes("[1]")) {
        result.type = "question"
        result.content = content.replace(/\[1\](.*?)\[1\]/g, "$1")
        return result
      }

      // Check for [3] - Missing details
      if (content.startsWith("[3]")) {
        result.type = "missing_details"
        const details = content.match(/\[3\](.*?)\[3\]/g)?.map((match) => match.replace(/\[3\](.*?)\[3\]/, "$1")) || []
        result.details = details
        return result
      }

      // Check for [4] - Complex task
      if (content.includes("[4.")) {
        result.type = "complex_task"
        const files: any[] = []
        const fileMatches = content.match(/\[4\.\d+\](.*?)\n([\s\S]*?)(?=\[4\.\d+\]|$)/g)

        if (fileMatches) {
          fileMatches.forEach((match) => {
            const [, filename] = match.match(/\[4\.\d+\](.*?)\n/) || []
            const code = match.replace(/\[4\.\d+\].*?\n/, "").trim()
            if (filename && code) {
              files.push({ filename: filename.trim(), code })
            }
          })
        }
        result.files = files

        // Extract plugin name
        const nameMatch = content.match(/\[1\.1\](.*?)\[1\.1\]/)
        if (nameMatch) {
          result.pluginName = nameMatch[1]
        }
        return result
      }

      // Check for [5] - New chat suggestion
      if (content.includes("[5]")) {
        result.type = "new_chat_suggestion"
        result.content = content.replace(/\[5\](.*?)\[5\]/g, "$1")
        return result
      }

      // Check for [2] - Plugin code (single file)
      if (content.includes("import discord") || content.includes("@bot.command") || content.includes("discord.py")) {
        result.type = "plugin"

        // Extract plugin name
        const nameMatch = content.match(/\[1\.1\](.*?)\[1\.1\]/)
        if (nameMatch) {
          result.pluginName = nameMatch[1]
          result.content = content.replace(/\[1\.1\].*?\[1\.1\]/, "").trim()
        }

        // Extract usage instructions
        const usageMatch = content.match(/\[6\](.*?)\[6\]/s)
        if (usageMatch) {
          result.usage = usageMatch[1].trim()
          result.content = result.content.replace(/\[6\].*?\[6\]/s, "").trim()
        }

        result.code = result.content
        return result
      }

      return result
    }

    const parsedResponse = parseResponse(generatedContent)

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
