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
[1.1] - PLUGIN NAME: Generate a short plugin name (max 20 chars) like [1.1]ban-hammer[1.1]
[2] - PLUGIN CODE: Single-file Discord bot plugin code
[3] - DETAILS REQUEST: Missing information needed, format: [3]channel-id[3]command-name
[4] - COMPLEX TASK: Multi-file plugins, format: [4.1]main.py\n(code)\n[4.2]utils.py\n(code)
[5] - NEW CHAT: Suggest starting new chat for unrelated requests
[6] - USAGE: Instructions for using generated plugins

RESPONSE RULES:
1. For QUESTIONS [1]: Answer helpfully. If unrelated to bot development, respond: "[1]This AI should only be used to create plugins for Discord bots."

2. For PLUGIN REQUESTS [2]: 
   - First provide plugin name: [1.1]plugin-name[1.1]
   - Then provide ONLY raw Python code (no markdown, no explanations)
   - Use latest discord.py syntax with proper intents
   - Include complete imports and bot initialization
   - Make code production-ready and executable

3. For MISSING DETAILS [3]: Request specific information like [3]channel-id[3]command-name (max 6 details)

4. For COMPLEX TASKS [4]: Use multi-file format [4.1]filename\n(code)\n[4.2]filename\n(code)

5. For FOLLOW-UPS: If user has existing code and requests changes, modify the existing code. If request is unrelated, use [5].

6. For USAGE [6]: Provide setup/usage instructions as separate message.

IMPORTANT: 
- Plugin names must be under 20 characters
- Only provide raw code, no explanations within code blocks
- Detect if request continues existing project vs new function
- Use [5] for completely unrelated follow-up requests`

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

    return NextResponse.json({ response: generatedContent })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
