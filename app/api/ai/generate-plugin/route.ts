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

      const modelName = "gemini-2.0-flash-lite"
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

      const planPrompt = 'You are an expert Python and discord.py developer...' // This prompt is simple and less critical
      const codePrompt = `You are S1, an expert AI assistant creating a discord.py plugin. You MUST follow these rules exactly:\n1. Generate a unique, descriptive, kebab-case \`plugin-name\` no more than 20 characters.\n2. Generate the full, complete, and operational Python code for a single Cog.\n3. Generate clear, simple usage instructions.\n\nYour response MUST be ONLY in the following format. Do NOT include any other text, explanations, or markdown.\n\n[1.1]plugin-name-here[1.1]\n[6]Usage instructions here.[6]\n[2]\n# All python code goes here\nimport discord\nfrom discord.ext import commands\n\nclass MyCog(commands.Cog):\n  # ... rest of the code\n\nasync def setup(bot):\n  await bot.add_cog(MyCog(bot))\n[2]`
      const reviewPrompt = `You are a senior code reviewer. Your task is to find and fix bugs in the provided Python code.\n\nYour response MUST be ONLY the corrected, full Python code inside a [2] tag. Do NOT include any other text, tags, or explanations.\n\n[2]\n# corrected python code here\n[2]`

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

      const planPrompt = 'You are an expert Python and discord.py developer...' // Unchanged

      const codePrompt = `You are S1, an expert AI assistant creating a discord.py plugin. You MUST follow these rules exactly:\n1. Generate a unique, descriptive, kebab-case \`plugin-name\` no more than 20 characters.\n2. Generate the full, complete, and operational Python code for a single Cog.\n3. Generate clear, simple usage instructions.\n\nYour response MUST be ONLY in the following format. Do NOT include any other text, explanations, or markdown.\n\n[1.1]plugin-name-here[1.1]\n[6]Usage instructions here.[6]\n[2]\n# All python code goes here\nimport discord\nfrom discord.ext import commands\n\nclass MyCog(commands.Cog):\n  # ... rest of the code\n\nasync def setup(bot):\n  await bot.add_cog(MyCog(bot))\n[2]`

      const reviewPrompt = `You are a senior code reviewer. Your task is to find and fix bugs in the provided Python code.\n\n You MUST return the full, corrected code. Your response MUST be ONLY in the following format, including the original plugin name. Do NOT include any other text or explanations.\n\n[1.1]original-plugin-name-here[1.1]\n[6]Updated usage instructions if necessary.[6]\n[2]\n# All corrected python code goes here\nimport discord\nfrom discord.ext import commands\n\nclass MyCog(commands.Cog):\n  # ... rest of the corrected code\n\nasync def setup(bot):\n  await bot.add_cog(MyCog(bot))\n[2]`

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
