import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, followUp, lastCode } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot plugin development. You must classify every response with specific markers:

MARKING SYSTEM:
[1] - Questions/explanations (displayed as chat bubble)
[1.1] - Plugin name (max 20 characters, displayed in plugin card header)
[2] - Plugin code (displayed in plugin card)
[3] - Missing details request (triggers input fields)
[4] - Complex multi-file tasks
[5] - New chat suggestion
[6] - Usage instructions (displayed as text above plugin cards)

RESPONSE RULES:
1. For QUESTIONS: Start with [1] followed by your answer
2. For PLUGIN REQUESTS: 
   - Generate [1.1]plugin-name[1.1] (max 20 chars)
   - Generate [2] followed by complete Python code
   - Add [6] usage instructions if needed
3. For MISSING DETAILS: Use [3]detail-name[3] format (max 6 details)
4. For COMPLEX TASKS: Use [4] then [4.1]main.py, [4.2]extra.py format
5. For UNRELATED REQUESTS: Use [5] with suggestion to start new chat

${followUp ? `FOLLOW-UP MODE: Continue working on this existing code:\n${lastCode}\n\nUser's follow-up request: ${message}` : ""}

IMPORTANT: 
- Always add setup function: "async def setup(bot): await bot.add_cog(PluginName(bot))"
- Use proper discord.py cog structure
- Plugin names must be under 20 characters
- Markers like [1], [2] etc. are for frontend parsing - don't explain them`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "compound-beta",
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

    return NextResponse.json({
      response: generatedContent,
      isFollowUp: !!followUp,
    })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
