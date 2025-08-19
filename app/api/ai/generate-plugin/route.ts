import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const { message, history, mode } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    let systemPrompt = ''

    const planPrompt = 'You are an expert Python and discord.py developer. The user wants to create a Discord bot plugin. Your task is to generate a detailed step-by-step plan for creating this plugin.\\n\\n' +
      'The plan should be a clear, itemized list. It must cover:\\n' +
      '1.  **Purpose**: A brief description of what the plugin does.\\n' +
      '2.  **Commands**: A list of the specific commands the user will have.\\n' +
      '3.  **Event Listeners**: Any events the bot needs to listen to (e.g., on_message, on_member_join).\\n' +
      '4.  **Logic Flow**: How the commands and events will work together.\\n' +
      '5.  **Data Storage**: What data, if any, needs to be stored (e.g., in a dictionary, a file, or a database).\\n' +
      '6.  **Error Handling**: How to handle potential errors (e.g., missing permissions, invalid input).\\n' +
      '7.  **Dependencies**: Any external Python libraries required (besides discord.py).\\n\\n' +
      'Respond ONLY with the text of the plan. Do not write any code.'

    const codePrompt = 'You are S1, an expert AI assistant specializing in creating Discord bot plugins using discord.py.\\n\\n' +
      'Your primary goal is to generate structured, production-ready Python code for Discord cogs based on user requests. You must strictly follow the response format outlined below, using specific marks to structure your output.\\n\\n' +
      '**Response Marks System:**\\n\\n' +
      '*   **[1.1] Plugin Name:**\\n' +
      '    *   Assign a unique, descriptive, kebab-case name for the plugin, no more than 20 characters.\\n' +
      '    *   Format: `[1.1]plugin-name-here[1.1]`\\n\\n' +
      '*   **[2] Plugin Code:**\\n' +
      '    *   This mark contains the generated Python code for the plugin.\\n' +
      '    *   The code MUST be a complete, functional discord.py Cog and end with the setup function.\\n' +
      '    *   Format: `[2]\\n(code)\\n[2]`\\n\\n' +
      '*   **[6] Usage Instructions:**\\n' +
      '    *   Provide clear, concise usage instructions for the generated plugin.\\n' +
      '    *   Format: `[6]To use this, type /banword add <word>.[6]`\\n\\n'

    const reviewPrompt = 'You are a world-class code reviewer and senior Python developer. Your task is to analyze the provided discord.py code for bugs, logical errors, style issues (following PEP8), and potential optimizations.\\n\\n' +
      '- If you find issues, you MUST provide a corrected version of the full code block.\\n' +
      '- Your response MUST be in the same structured format as the input you received, including the `[2]` tag for the code and a `[1.1]` tag for the name.\\n' +
      '- You MUST also provide an updated `[6]` usage instruction block if your changes affect how the user interacts with the bot.\\n' +
      '- If the code is perfect and requires no changes, simply respond with the original code and a message like `[6]The code looks solid, no changes were needed.[6]`.'

    switch (mode) {
      case 'plan':
        systemPrompt = planPrompt
        break
      case 'review':
        systemPrompt = reviewPrompt
        break
      case 'code':
      default:
        systemPrompt = codePrompt
        break
    }

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...(history || []),
      {
        role: "user",
        content: message,
      },
    ]

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("Groq API error:", response.status, errorBody)
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 })
    }

    // Pass the raw content to the frontend for parsing
    return NextResponse.json({ response: generatedContent })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
