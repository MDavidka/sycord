import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
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
            content:
              "Your task is to build a Discord bot using the latest discord.py module with the correct intents and best coding practices. You must interpret the user's request deeply, understand what they are trying to achieve, and generate a complete, fully functional Python code that implements the requested functionality. The bot must handle errors gracefully, be optimized for concurrency, and include scalable structures for commands, events, and data management.\n\nInstructions for code generation:\n1. Always produce the full raw Python code without any markdown, comments about formatting, or additional explanations outside the code. The code should be production-ready, clean, and organized.\n2. Use the latest discord.py module, async conventions, and correct intents for members, messages, reactions, and presences as needed by the requested functionality.\n3. Include all necessary imports, bot initialization, commands, events, and any auxiliary functions or helper classes required.\n4. If the request involves dynamic content, APIs, or databases, generate fully working code that includes API calls with error handling, JSON parsing and validation, and async database interactions (or simulated storage if no DB specified).\n5. For multi-user, multi-channel, or tournament-style functionality: implement scalable data structures for players, channels, scores, and leaderboards; ensure real-time updates without blocking other commands; include power-ups or modifiers fully implemented with per-user state.\n6. For reactions, buttons, or interactions: properly handle events like on_reaction_add, on_button_click, or discord.ui.View interactions; include reaction validation, timers, and dynamic embed updates.\n7. Implement robust error handling for missing permissions, missing channels or users, API failures, and invalid inputs.\n8. Ensure the bot is scalable and modular, so commands can easily be moved to cogs or separate files if required.\n9. If the user requests a game, quiz, or tournament: include timers, scoring, power-ups, difficulty adjustments, and a leaderboard; include global and per-channel leaderboards with dynamic updates; ensure concurrency and race conditions are properly handled.\n10. The generated code must be fully executable by pasting directly into a Python environment, only requiring the user to insert their bot token.\n11. Include a second part after the code: a step-by-step instruction to use the bot, max 3 lines only, explaining setup and how to run or invoke main commands. Do not add any extra commentary.",
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
    const generatedCode = data.choices[0]?.message?.content

    if (!generatedCode) {
      return NextResponse.json({ error: "No code generated" }, { status: 500 })
    }

    return NextResponse.json({ code: generatedCode })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate plugin" }, { status: 500 })
  }
}
