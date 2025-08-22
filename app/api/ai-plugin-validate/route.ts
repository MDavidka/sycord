import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, validationType = "full" } = body

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    const validation = await validateCode(code, validationType)
    const suggestions = await generateSuggestions(code, validation)

    return NextResponse.json({
      validation,
      suggestions,
      enhancedCode: validation.isValid ? enhanceCode(code) : null,
    })
  } catch (error) {
    console.error("Error validating code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function validateCode(code: string, type: string) {
  const issues: Array<{ type: string; message: string; line?: number; severity: string }> = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Syntax validation
  if (!code.includes("import discord")) {
    issues.push({
      type: "import",
      message: "Missing required discord.py import",
      severity: "error",
    })
  }

  // Structure validation
  if (!code.includes("class") || !code.includes("commands.Cog")) {
    issues.push({
      type: "structure",
      message: "Code should use Discord.py Cog structure",
      severity: "error",
    })
  }

  // Async/await validation
  const functionMatches = code.match(/def\s+\w+/g) || []
  const asyncMatches = code.match(/async\s+def\s+\w+/g) || []

  if (functionMatches.length > asyncMatches.length) {
    warnings.push("Consider using async/await for Discord commands")
  }

  // Error handling validation
  if (!code.includes("try:") && code.includes("@app_commands.command")) {
    suggestions.push("Add error handling to commands for better user experience")
  }

  // Permission validation
  if (code.includes("manage_messages") || code.includes("administrator")) {
    warnings.push("Command requires elevated permissions - ensure proper permission checks")
  }

  // Rate limiting validation
  if (code.includes("@app_commands.command") && !code.includes("cooldown")) {
    suggestions.push("Consider adding cooldowns to prevent spam")
  }

  return {
    isValid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    warnings,
    suggestions,
    score: Math.max(0, 100 - issues.length * 20 - warnings.length * 5),
  }
}

async function generateSuggestions(code: string, validation: any) {
  const suggestions = [...validation.suggestions]

  // Performance suggestions
  if (code.includes("for ") && code.includes("await")) {
    suggestions.push("Consider using asyncio.gather() for concurrent operations")
  }

  // Security suggestions
  if (code.includes("eval(") || code.includes("exec(")) {
    suggestions.push("Avoid using eval() or exec() for security reasons")
  }

  // Best practices
  if (!code.includes('"""') && !code.includes("'''")) {
    suggestions.push("Add docstrings to document your cog and commands")
  }

  return suggestions
}

function enhanceCode(code: string): string {
  let enhanced = code

  // Add logging if missing
  if (!enhanced.includes("import logging")) {
    enhanced = "import logging\n" + enhanced
  }

  // Add error handling wrapper
  if (enhanced.includes("@app_commands.command") && !enhanced.includes("try:")) {
    enhanced = enhanced.replace(/(@app_commands\.command.*?\n.*?async def.*?$$.*?$$:.*?\n)/gs, "$1        try:\n")
  }

  return enhanced
}
