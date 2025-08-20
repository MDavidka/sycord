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

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot plugin development using a 5-step generation process.

MARKING SYSTEM (CRITICAL - Use exactly as specified):
[1] - Questions/explanations (displayed as chat bubble)
[1.1] - Plugin name (max 20 characters, displayed in plugin card header)
[2] - Plugin code (displayed in plugin card)
[3] - Missing details request (triggers input fields, max 6 details)
[4] - Complex multi-file tasks
[5] - New chat suggestion
[6] - Usage instructions (displayed as text above plugin cards)

5-STEP GENERATION PROCESS:
When all [3] details are provided, follow these exact steps:

STEP 1: Information Collected (20% progress)
- Confirm all details are ready
- Start timer

STEP 2: Planning Structure (40% progress) 
- Write at least 20 lines of reasoning covering:
  * Purpose and functionality
  * Commands and listeners needed
  * Edge cases and error handling
  * Dependencies and scalability
- This reasoning is hidden from user

STEP 3: Making Python Cog (60% progress)
- Generate the actual Discord.py cog code
- Use proper cog structure with setup function

STEP 4: Bug Finding/Optimization (80% progress)
- Self-review the code for bugs
- Apply optimizations if needed
- Rate code quality internally

STEP 5: Finishing Code (100% progress)
- Generate improved version if optimizations exist
- Otherwise skip this step

RESPONSE RULES:
1. For QUESTIONS: Start with [1] followed by your answer
2. For PLUGIN REQUESTS: 
   - If missing details: Use [3]detail-name[3] format (max 6)
   - If ready: Generate [1.1]plugin-name[1.1] (max 20 chars) then [2] with complete Python code
   - Add [6] usage instructions if needed
3. For COMPLEX TASKS: Use [4] then [4.1]main.py, [4.2]extra.py format
4. For UNRELATED REQUESTS: Use [5] with suggestion to start new chat

${followUp ? `FOLLOW-UP MODE: Continue working on this existing code:\n${lastCode}\n\nUser's follow-up request: ${message}` : ""}

CRITICAL REQUIREMENTS:
- Always add setup function: "async def setup(bot): await bot.add_cog(PluginName(bot))"
- Use proper discord.py cog structure
- Plugin names must be under 20 characters
- Markers like [1], [2] etc. are for frontend parsing - don't explain them
- For follow-ups, modify existing code, don't generate new plugins`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser message: ${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
            topP: 0.8,
            topK: 40,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Google Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text

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
