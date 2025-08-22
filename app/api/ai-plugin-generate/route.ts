import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Groq } from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const getSystemPrompt = (step: string, sessionId: string) => {
  const basePrompt = `You are an expert Discord Python cog developer with deep knowledge of discord.py library and async/await patterns.

Session ID: ${sessionId}
Current Step: ${step}

CRITICAL RULES:
1. Always use proper Discord.py async/await patterns
2. Follow the marks system: [1] questions, [2] code blocks, [3] missing details, [4] confirmations, [5] errors
3. Generate production-ready, well-documented code
4. Include proper error handling and logging
5. Use modern discord.py features (slash commands, views, etc.)

`

  switch (step) {
    case "Information":
      return (
        basePrompt +
        `
INFORMATION GATHERING PHASE:
- Ask specific questions about the plugin's functionality [1]
- Identify required Discord permissions
- Determine command structure and user interactions
- Clarify data storage needs
- Ask about integration requirements

Focus on gathering complete requirements before proceeding.`
      )

    case "Planning":
      return (
        basePrompt +
        `
PLANNING PHASE:
- Create detailed architecture plan
- Define cog structure and command organization
- Plan database schema if needed
- Identify potential challenges and solutions
- Outline testing strategy

Provide a comprehensive technical plan with clear implementation steps.`
      )

    case "Code Generation":
      return (
        basePrompt +
        `
CODE GENERATION PHASE:
- Generate complete, functional Discord.py cog code [2]
- Include proper imports and setup
- Implement all requested features
- Add comprehensive error handling
- Include docstrings and comments
- Use modern discord.py patterns (slash commands, views, embeds)

Example structure:
\`\`\`python
import discord
from discord.ext import commands
from discord import app_commands

class YourCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name="example", description="Example command")
    async def example_command(self, interaction: discord.Interaction):
        await interaction.response.send_message("Hello!")

async def setup(bot):
    await bot.add_cog(YourCog(bot))
\`\`\`

Generate complete, production-ready code.`
      )

    case "Bug Finding":
      return (
        basePrompt +
        `
BUG FINDING & OPTIMIZATION PHASE:
- Analyze generated code for potential issues
- Check for common Discord.py pitfalls
- Verify proper async/await usage
- Identify performance optimizations
- Suggest security improvements
- Validate error handling

Provide specific fixes and improvements with explanations.`
      )

    case "Finishing":
      return (
        basePrompt +
        `
FINISHING PHASE:
- Provide final polished code
- Include installation instructions
- Add usage examples
- Provide configuration guidance
- Include troubleshooting tips
- Suggest future enhancements

Deliver a complete, deployment-ready Discord cog.`
      )

    default:
      return basePrompt
  }
}

const validateDiscordCode = (code: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = []

  // Check for required imports
  if (!code.includes("import discord") && !code.includes("from discord")) {
    issues.push("Missing discord.py imports")
  }

  // Check for proper cog structure
  if (!code.includes("commands.Cog")) {
    issues.push("Not using proper Cog structure")
  }

  // Check for async/await patterns
  if (code.includes("def ") && !code.includes("async def")) {
    issues.push("Missing async/await patterns for Discord commands")
  }

  // Check for setup function
  if (!code.includes("async def setup(bot)")) {
    issues.push("Missing required setup function")
  }

  // Check for proper error handling
  if (!code.includes("try:") && !code.includes("except")) {
    issues.push("Consider adding error handling")
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

const enhanceCodeWithBestPractices = (code: string): string => {
  let enhancedCode = code

  // Add logging if not present
  if (!enhancedCode.includes("import logging")) {
    enhancedCode = "import logging\n" + enhancedCode
  }

  // Ensure proper error handling wrapper
  if (!enhancedCode.includes("try:") && enhancedCode.includes("@app_commands.command")) {
    enhancedCode = enhancedCode.replace(/(@app_commands\.command.*?\n.*?async def.*?\n)/g, "$1        try:\n")
  }

  return enhancedCode
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, context, step, sessionId, requireCodeGeneration = false } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const systemPrompt = getSystemPrompt(step, sessionId)

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Context: ${context}\n\nUser request: ${prompt}`,
        },
      ],
      model: "llama-3.1-70b-versatile",
      temperature: step === "Code Generation" ? 0.3 : 0.7, // Lower temperature for code generation
      max_tokens: step === "Code Generation" ? 4096 : 2048, // More tokens for code
    })

    let response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 })
    }

    let generatedCode = null
    let codeValidation = null

    if (step === "Code Generation" || requireCodeGeneration) {
      // Extract code blocks from response
      const codeBlockRegex = /```python\n([\s\S]*?)\n```/g
      const codeMatches = [...response.matchAll(codeBlockRegex)]

      if (codeMatches.length > 0) {
        generatedCode = codeMatches[0][1]

        // Validate and enhance the code
        codeValidation = validateDiscordCode(generatedCode)

        if (!codeValidation.isValid) {
          // Add validation issues as marks
          response += `\n\n[5] Code validation found issues: ${codeValidation.issues.join(", ")}`
        } else {
          generatedCode = enhanceCodeWithBestPractices(generatedCode)
        }
      }
    }

    // Parse marks from response
    const marks = []
    const markRegex = /\[(\d+)\]/g
    let match
    while ((match = markRegex.exec(response)) !== null) {
      const markNumber = Number.parseInt(match[1])
      const markType = getMarkType(markNumber)

      // Extract more context around the mark
      const startIndex = Math.max(0, match.index - 50)
      const endIndex = Math.min(response.length, match.index + 150)
      const contextContent = response.substring(startIndex, endIndex)

      marks.push({
        type: markType,
        markNumber,
        content: contextContent,
        resolved: false,
      })
    }

    return NextResponse.json({
      response,
      marks,
      step,
      sessionId,
      generatedCode,
      codeValidation,
      metadata: {
        timestamp: new Date().toISOString(),
        model: "llama-3.1-70b-versatile",
        step,
        hasCode: !!generatedCode,
        isValid: codeValidation?.isValid ?? true,
        issues: codeValidation?.issues ?? [],
      },
    })
  } catch (error) {
    console.error("Error generating AI plugin response:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getMarkType(markNumber: number): string {
  switch (markNumber) {
    case 1:
      return "question"
    case 2:
      return "code"
    case 3:
      return "missing_detail"
    case 4:
      return "confirmation"
    case 5:
      return "error"
    default:
      return "question"
  }
}
