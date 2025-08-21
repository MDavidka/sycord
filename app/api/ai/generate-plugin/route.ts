import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, followUp, lastCode, step } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    if (step) {
      // Handle step-by-step generation
      return await handleStepGeneration(apiKey, message, step, followUp, lastCode)
    }

    const systemPrompt = `You are an AI assistant specialized in Discord bot plugin development.

MARKING SYSTEM (CRITICAL - Use exactly as specified):
[1] - Questions/explanations (displayed as chat bubble)
[1.1] - Plugin name (max 20 characters, displayed in plugin card header)
[2] - Plugin code (displayed in plugin card code section)
[3] - Missing details request (triggers input fields, max 6 details)
[4] - Complex multi-file tasks
[5] - New chat suggestion
[6] - Usage instructions (displayed as text above plugin cards)

RESPONSE RULES:
1. For QUESTIONS: Start with [1] followed by your answer
2. For PLUGIN REQUESTS: 
   - If missing details: Use [3]detail-name[3] format (max 6)
   - If ready: Generate [1.1]plugin-name[1.1] then [2] with complete Python code
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

async function handleStepGeneration(
  apiKey: string,
  message: string,
  step: number,
  followUp?: boolean,
  lastCode?: string,
) {
  const stepPrompts = {
    1: "Analyze the user request and confirm what plugin needs to be created. Respond with [1] followed by a brief confirmation of what you understand.",
    2: `Plan the structure for the Discord bot plugin. Think about:
- What commands/events it needs
- What Discord.py features to use
- Error handling needed
- Any dependencies required
Respond with [1] followed by your planning thoughts.`,
    3: `Start generating the Discord.py cog code structure. Think through the implementation but don't return the code yet.
Respond with [1] followed by your progress update about what you're working on.`,
    4: "Review and optimize the code structure you've planned. Think about potential bugs and improvements. Respond with [1] followed by your analysis.",
    5: `Now finalize and return the complete Discord.py cog code. Use proper cog structure with:
- Class inheriting from commands.Cog
- Proper command decorators
- Error handling
- Setup function at the end
Respond with [1.1]plugin-name[1.1] followed by [2] and the complete Python code.`,
  }

  const systemPrompt = `You are handling step ${step} of a 5-step Discord bot plugin generation process.

STEP ${step}: ${stepPrompts[step as keyof typeof stepPrompts]}

User's original request: ${message}
${followUp ? `Existing code to work with: ${lastCode}` : ""}

CRITICAL RULES:
- Steps 1-4: Only return [1] with explanations/progress updates
- Step 5 ONLY: Return [1.1]plugin-name[1.1] followed by [2] with complete code
- Plugin names must be under 20 characters
- Always include setup function: "async def setup(bot): await bot.add_cog(PluginName(bot))"

MARKING SYSTEM:
[1] - Questions/explanations/progress updates
[1.1] - Plugin name (max 20 characters) - ONLY in step 5
[2] - Plugin code - ONLY in step 5`

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
                text: systemPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
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

  return NextResponse.json({
    response: generatedContent,
    step: step,
    isComplete: step === 5,
  })
}
