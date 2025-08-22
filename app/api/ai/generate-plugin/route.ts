import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { UserAIFunction } from "@/lib/types"

//
// AI Plugin-Maker Pipeline
// This API route is the core of the AI chat functionality. It follows a strict, stateful process
// to guide the user from a high-level request to a complete, deployable Discord bot plugin.
//
// Core Flow:
// 1. Classify Input: Determine if it's a new plugin, a follow-up, or a detail fulfillment.
// 2. Assign Name & Gather Details: For new plugins, assign a name and ask for missing details.
// 3. Generation Pipeline: Once all details are present, generate the code via an internal pipeline.
// 4. Output: Format the response with specific markers ([1.1], [2], [3], [6], etc.) for the frontend.
// 5. Persistence: Handle follow-ups by loading/saving chat state (via another API).
//

// Basic rate limiting
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
})

// Helper to generate a unique, kebab-case name for a plugin
function generatePluginName(prompt: string): string {
  const sanitized = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with one
    .trim()

  const words = sanitized.split("-")
  // Take the most relevant words, up to a max length
  let name = words.slice(0, 5).join("-")
  if (name.length > 20) {
    name = name.substring(0, 20)
  }
  // Ensure it doesn't end with a hyphen
  if (name.endsWith("-")) {
    name = name.slice(0, -1)
  }
  if (name.length === 0) {
    return `plugin-${Date.now()}` // Fallback
  }
  return name
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Apply rate limiting
    const { success } = await ratelimit.limit(session.user.id)
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const { message, chatSessionId, functionId, details } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      // Per requirements, return a user-friendly message with the [6] mark
      return NextResponse.json({
        response: "[6]Missing Google API configuration. Please set GOOGLE_API_KEY in the environment and retry.[6]",
      })
    }

    // =================================================================================
    // INPUT CLASSIFICATION
    // =================================================================================

    // Case 1: New plugin request
    if (!chatSessionId && !details) {
      const pluginName = generatePluginName(message)

      // First AI interaction: Ask for details
      const detailRequestPrompt = `
        You are a requirements analyst for a Discord bot plugin generator.
        A user has requested a new plugin with the following prompt: "${message}".

        Based on this, identify up to 6 critical pieces of information needed to build the plugin.
        These should be specific details the user must provide, like a channel name, a specific number, a role, etc.
        Do NOT ask for the command name itself, as that is usually in the prompt.
        Format your response ONLY with [3] tokens. Do not include any other text.

        Example 1:
        User prompt: "make a welcome bot"
        Your response: [3]welcome-channel-id[3]welcome-message-text[3]role-to-assign

        Example 2:
        User prompt: "a bot that bans bad words"
        Your response: [3]words-to-ban-list[3]moderator-role-id[3]log-channel-id

        Now, analyze the user prompt and provide the required detail tokens.
        User prompt: "${message}"
      `
      const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`

      const response = await fetch(googleApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: detailRequestPrompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 500,
            topP: 1,
            topK: 1,
          },
        }),
      })

      if (!response.ok) {
        console.error("Google API error:", await response.text())
        throw new Error(`Google API error: ${response.status}`)
      }

      const data = await response.json()
      const requestedDetails = data.candidates?.[0]?.content?.parts?.[0]?.text.trim()

    // This helper function encapsulates the generation logic.
    const performGeneration = async (userMessage: string, providedDetails: object | null = null) => {
      const generationPrompt = `
        You are a world-class expert at creating Discord.py cogs. Your task is to generate a complete, production-ready, and safe Python cog plugin based on a user's request.
        **AI Chat Logic (Full, Enforced)**
        **1. Internal Planning (Hidden from User):**
        Before writing any code, you MUST create a detailed internal plan (at least 20 lines). This plan is for your use only and MUST NOT be in the final output. It should cover:
        - Purpose & scope, Commands & parameters, Events/listeners, Permissions & roles, Data model & persistence, Error handling, edge cases, rate limits, Required Discord intents.
        **2. Final Output Generation (Strict Format):**
        After planning, generate the user-visible output. It MUST strictly follow this format:
        - Start with [6]usage instructions[6].
        - Follow with the code, wrapped in [2]...[2].
        - The code MUST be a single, complete Python file for a discord.py cog, including imports, a PascalCase Cog class, and the \`async def setup(bot)\` hook.
        - If multiple files are needed, use [4.1] file.py, [4.2] other.py markers.
        **User Request:**
        - Original Prompt: "${userMessage}"
        ${providedDetails ? `- Provided Details: ${JSON.stringify(providedDetails)}` : ""}
        Now, begin your internal planning, then generate the final output in the specified format.
      `
      const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`
      const response = await fetch(googleApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: generationPrompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 8000, topP: 0.95 },
        }),
      })
      if (!response.ok) {
        console.error("Google API error:", await response.text())
        throw new Error(`Google API error: ${response.status}`)
      }
      const data = await response.json()
      const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text.trim()
      if (!generatedContent) throw new Error("No content generated by the API.")
      return generatedContent
    }

    // =================================================================================
    // INPUT CLASSIFICATION
    // =================================================================================

    // Case 1: New plugin request
    if (!chatSessionId && !details) {
      const pluginName = generatePluginName(message)
      // First AI interaction: Ask for details
      const detailRequestPrompt = `
        You are a requirements analyst for a Discord bot plugin generator.
        A user has requested a new plugin with the following prompt: "${message}".
        Based on this, identify up to 6 critical pieces of information needed to build the plugin.
        Format your response ONLY with [3] tokens. Do not include any other text.
        Example: [3]welcome-channel-id[3]welcome-message-text[3]role-to-assign
        Now, analyze the user prompt and provide the required detail tokens.
      `
      const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`
      const response = await fetch(googleApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: detailRequestPrompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 500, topP: 1, topK: 1 },
        }),
      })

      if (!response.ok) throw new Error(`Google API error: ${response.status}`)
      const data = await response.json()
      const requestedDetails = data.candidates?.[0]?.content?.parts?.[0]?.text.trim()

      if (!requestedDetails || !requestedDetails.includes("[3]")) {
        const generatedCode = await performGeneration(message)
        const responseContent = `[1.1]${pluginName}[1.1]\n${generatedCode}`
        return NextResponse.json({ response: responseContent })
      }

      const responseContent = `[1.1]${pluginName}[1.1]\n${requestedDetails}`
      return NextResponse.json({ response: responseContent })
    }

    // Case 2: User has provided details
    if (details) {
      const pluginName = generatePluginName(message)
      const generatedCode = await performGeneration(message, details)
      const responseContent = `[1.1]${pluginName}[1.1]\n${generatedCode}`
      return NextResponse.json({ response: responseContent })
    }

    // Case 3: Follow-up on an existing plugin
    if (chatSessionId) {
      if (!functionId) {
        return NextResponse.json({ error: "Function ID is required for follow-ups" }, { status: 400 })
      }

      const client = await clientPromise
      const db = client.db("dash-bot")
      const functionsCollection = db.collection<UserAIFunction>("user_ai_functions")

      const existingFunction = await functionsCollection.findOne({
        _id: new ObjectId(functionId),
        "created_by": session.user.email,
      })

      if (!existingFunction) {
        return NextResponse.json({ error: "Function not found or unauthorized" }, { status: 404 })
      }

      const latestCode = existingFunction.code

      const performFollowUpGeneration = async (previousCode: string, newUserRequest: string) => {
        const followUpPrompt = `
          You are a world-class expert at creating Discord.py cogs. You are continuing a session to modify an existing plugin.
          **Context: The user's current code is as follows:**
          \`\`\`python
          ${previousCode}
          \`\`\`
          **Your Task:** Modify the user's code based on their new request. You must generate the COMPLETE, new version of the code. Do not output diffs or snippets.
          **Internal Planning (Hidden from User):** Create a detailed internal plan on how to modify the code.
          **Final Output Generation (Strict Format):** The output must follow the same strict format as before: [6] new usage instructions [6] followed by [2] the full, modified code [2].
          **User's New Request:** "${newUserRequest}"
          Now, begin your internal planning, then generate the complete, modified plugin output.
        `
        const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`
        const response = await fetch(googleApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: followUpPrompt }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 8000, topP: 0.95 },
          }),
        })
        if (!response.ok) throw new Error(`Google API error: ${response.status}`)
        const data = await response.json()
        const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text.trim()
        if (!generatedContent) throw new Error("No content generated by the API.")
        return generatedContent
      }

      const generatedCode = await performFollowUpGeneration(latestCode, message)

      // --- PERSISTENCE ---
      // Parse the generated content
      const usageMatch = generatedCode.match(/\[6\]([\s\S]*?)\[6\]/)
      const codeMatch = generatedCode.match(/\[2\]([\s\S]*?)\[2\]/)
      const newUsage = usageMatch ? usageMatch[1].trim() : ""
      const newCode = codeMatch ? codeMatch[1].trim() : generatedCode

      // Create new message and code version objects
      const userMessageObj = {
        id: `msg_${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      }
      const aiMessageObj = {
        id: `msg_${Date.now() + 1}`,
        role: "ai",
        content: generatedCode,
        isCode: true,
        timestamp: new Date(),
      }

      const lastVersion = existingFunction.chatSessions
        ?.find((s) => s.id === chatSessionId)
        ?.codeVersions.slice(-1)[0]

      const newCodeVersion = {
        id: `version_${Date.now()}`,
        code: newCode,
        usageInstructions: newUsage,
        version: (lastVersion?.version || 0) + 1,
        created_at: new Date().toISOString(),
        prompt: message,
      }

      // Get the absolute URL for the API call
      const absoluteUrl = new URL(request.url)
      const updateUrl = `${absoluteUrl.origin}/api/user-ai-functions`

      // Persist the new data by calling our own API
      await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cookie": request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          action: "addCodeVersion",
          functionId,
          chatSessionId,
          newCodeVersion,
          newMessages: [userMessageObj, aiMessageObj],
        }),
      })

      const responseContent = `[1.1]${existingFunction.name}[1.1]\n${generatedCode}`
      return NextResponse.json({ response: responseContent })
    }

    // Fallback for any other case
    return NextResponse.json({ error: "Invalid request state" }, { status: 400 })
  } catch (error) {
    console.error("AI Plugin Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
