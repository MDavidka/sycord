import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are an expert AI assistant for creating Discord bot plugins. Your task is to generate a complete, production-ready, and reviewed discord.py Cog based on the user's request.

Your internal thought process (which you must NOT output) should be:
1.  **Plan**: Create a step-by-step plan for the plugin.
2.  **Code**: Write the initial version of the code based on the plan.
3.  **Review and Refine**: Critically review your own code for bugs, errors, and improvements. Fix them to produce the final version.

Your final output to the user MUST be ONLY in the following format. Do not include any other text, explanations, or markdown.

[1.1]plugin-name-here[1.1]
[6]Usage instructions here.[6]
[2]
# Final, reviewed, and corrected Python code here
import discord
from discord.ext import commands

class MyCog(commands.Cog):
  # ... rest of the code
  pass

async def setup(bot):
  await bot.add_cog(MyCog(bot))
[2]`

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
    const generatedContent = data.choices?.[0]?.message?.content || ""

    if (!generatedContent) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 })
    }

    return NextResponse.json({ response: generatedContent })

  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
