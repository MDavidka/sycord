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

    // --- Start of Prompts ---
    const planPrompt = 'You are an expert Python and discord.py developer. The user wants to create a Discord bot plugin. Your task is to generate a detailed step-by-step plan for creating this plugin. The plan must be a maximum of 20 lines and cover the main features requested.'

    const codePrompt = `Your task is to write a Python discord.py Cog based on a plan.\n\n**RULES:**\n- Your response MUST contain a plugin name. Use the format: \`[1.1]plugin-name[1.1]\`\n- Your response MUST contain the full Python code. Use the format: \`[2]\\ncode_here\\n[2]\`\n- Your response MUST contain usage instructions. Use the format: \`[6]usage_instructions[6]\`\n- Do NOT write any other text or explanations.`

    const reviewPrompt = `You are a code reviewer. The user provides Python code. Your task is to find and fix all bugs.\n\n**RULES:**\n- Your response MUST contain the full, corrected Python code.\n- You MUST use this format: \`[2]\\ncorrected_code_here\\n[2]\`\n- Do NOT write any other text, tags, or explanations.`
    // --- End of Prompts ---

    if (provider === 'google') {
      const apiKey = process.env.GOOGLE_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
      }

      const modelName = "gemini-2.0-flash-lite"
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

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
