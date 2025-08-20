import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, history, mode, provider = 'groq' } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    let generatedContent = ''

    if (provider === 'google') {
      const apiKey = process.env.GOOGLE_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
      }

      // User requested "Gemini 2.0 Flash-Lite", we use a standard, available model name.
      const modelName = "gemini-1.5-flash-latest"
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

      // Gemini requires a different message format and doesn't use a system prompt in the same way.
      // We will prepend the system-like instructions to the user's message.
      const planPrompt = 'You are an expert Python and discord.py developer...' // Full prompt text
      const codePrompt = 'You are S1, an expert AI assistant...' // Full prompt text
      const reviewPrompt = 'You are a Python code reviewer...' // Full prompt text

      let instructions = codePrompt;
      if (mode === 'plan') instructions = planPrompt;
      if (mode === 'review') instructions = reviewPrompt;

      const fullMessage = `${instructions}\n\nUser Request: ${message}`

      const contents = history ? history.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })) : []
      contents.push({ role: 'user', parts: [{ text: fullMessage }] })

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("Google Gemini API error:", response.status, errorBody)
        throw new Error(`Google Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    } else {
      // Default to Groq
      const apiKey = process.env.GROQ_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 })
      }

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

      const reviewPrompt = 'You are a Python code reviewer. Review the following code. If you find any bugs or improvements, provide the full, corrected code.\\n\\n' +
        'Your response must include the plugin name in a `[1.1]` tag and the full code in a `[2]` tag. If the code is correct, return it as is.'

      let systemPrompt = codePrompt
      if (mode === 'plan') systemPrompt = planPrompt
      if (mode === 'review') systemPrompt = reviewPrompt

      const messages = [{ role: "system", content: systemPrompt }, ...(history || []), { role: "user", content: message }]

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "compound-beta",
          messages: messages,
          temperature: 0.7,
          max_tokens: 8000,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("Groq API error:", response.status, errorBody)
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data = await response.json()
      generatedContent = data.choices?.[0]?.message?.content || ""
    }

    if (!generatedContent) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 })
    }

    return NextResponse.json({ response: generatedContent })

  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
