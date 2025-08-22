import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, step = 1 } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    const stepPrompts = {
      1: `You are analyzing a Discord bot plugin request. This is STEP 1 of 5: Information Collection.

Analyze the user's request: "${message}"

Respond with [1] followed by a brief confirmation that you understand the request and what plugin needs to be created. Keep it short and focused.

Example: [1] I understand you want to create a moderation plugin with kick and ban commands. Moving to planning phase.`,

      2: `You are planning a Discord bot plugin. This is STEP 2 of 5: Planning Structure.

For the request: "${message}"

Respond with [1] followed by a brief outline of the plugin structure, main components, and approach. Keep it concise.

Example: [1] Planning a moderation plugin with: command handlers for kick/ban, permission checks, logging system, and error handling.`,

      3: `You are generating a Discord bot plugin. This is STEP 3 of 5: Making Python Cog.

For the request: "${message}"

Respond with [1] followed by a brief update that you're writing the core functionality. Do NOT include code yet.

Example: [1] Writing the main command functions, setting up permission decorators, and implementing the core moderation logic.`,

      4: `You are optimizing a Discord bot plugin. This is STEP 4 of 5: Finding bugs/optimizing.

For the request: "${message}"

Respond with [1] followed by a brief update about reviewing and optimizing the code. Do NOT include code yet.

Example: [1] Reviewing code for edge cases, optimizing error handling, and ensuring proper Discord API usage.`,

      5: `You are finalizing a Discord bot plugin. This is STEP 5 of 5: Finishing Code.

For the request: "${message}"

Now generate the complete, functional Python code. Respond with:
[1.1] Plugin Name
[2] Complete Python code using discord.py with:
- Latest discord.py syntax and proper intents
- Full imports and bot initialization  
- Complete command/event implementations
- Error handling and best practices
- Production-ready, executable code
- NO markdown formatting, NO explanations
- ONLY raw Python code that can be directly executed

The code must be complete and functional, requiring only a Discord bot token to run.`,
    }

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
                  text: stepPrompts[step as keyof typeof stepPrompts] || stepPrompts[1],
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedContent) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 })
    }

    return NextResponse.json({
      response: generatedContent,
      step: step,
      isComplete: step === 5,
    })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
