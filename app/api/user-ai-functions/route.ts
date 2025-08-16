import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { UserAIFunction } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const functionsCollection = db.collection<UserAIFunction>("user_ai_functions")

    const userFunctions = await functionsCollection
      .find({ created_by: session.user.email })
      .sort({ created_at: -1 })
      .toArray()

    return NextResponse.json({ functions: userFunctions })
  } catch (error) {
    console.error("Error fetching user AI functions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, code, thumbnailUrl, profileUrl, usageInstructions, chatSessionId } = body

    if (!name || !description || !code) {
      return NextResponse.json({ error: "Name, description, and code are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const functionsCollection = db.collection<UserAIFunction>("user_ai_functions")

    const initialChatId = chatSessionId || `chat_${Date.now()}`
    const initialCodeVersion = {
      id: `version_${Date.now()}`,
      code,
      usageInstructions: usageInstructions || "",
      version: 1,
      created_at: new Date().toISOString(),
      prompt: "Initial creation",
    }

    const initialChatSession = {
      id: initialChatId,
      name: "Main Chat",
      messages: [],
      codeVersions: [initialCodeVersion],
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }

    const newFunction: UserAIFunction = {
      name,
      description,
      code,
      created_by: session.user.email,
      created_at: new Date().toISOString(),
      thumbnailUrl: thumbnailUrl || "",
      profileUrl: profileUrl || "",
      usageInstructions: usageInstructions || "",
      chatSessions: [initialChatSession],
      currentChatId: initialChatId,
    }

    const result = await functionsCollection.insertOne(newFunction)

    return NextResponse.json({
      message: "AI function saved successfully",
      function: { ...newFunction, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error saving AI function:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { _id } = body

    if (!_id) {
      return NextResponse.json({ error: "Function ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("dash-bot")
    const functionsCollection = db.collection<UserAIFunction>("user_ai_functions")

    const result = await functionsCollection.deleteOne({
      _id: new (await import("mongodb")).ObjectId(_id),
      created_by: session.user.email,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Function not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "AI function deleted successfully" })
  } catch (error) {
    console.error("Error deleting AI function:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { functionId, chatSessionId, messages, newCodeVersion, action } = body

    const client = await clientPromise
    const db = client.db("dash-bot")
    const functionsCollection = db.collection<UserAIFunction>("user_ai_functions")

    if (action === "updateChat") {
      // Update chat session messages
      const result = await functionsCollection.updateOne(
        {
          _id: new (await import("mongodb")).ObjectId(functionId),
          created_by: session.user.email,
          "chatSessions.id": chatSessionId,
        },
        {
          $set: {
            "chatSessions.$.messages": messages,
            "chatSessions.$.last_updated": new Date().toISOString(),
          },
        },
      )

      return NextResponse.json({ message: "Chat updated successfully" })
    }

    if (action === "addCodeVersion") {
      // Add new code version to chat session
      const result = await functionsCollection.updateOne(
        {
          _id: new (await import("mongodb")).ObjectId(functionId),
          created_by: session.user.email,
          "chatSessions.id": chatSessionId,
        },
        {
          $push: {
            "chatSessions.$.codeVersions": newCodeVersion,
          },
          $set: {
            "chatSessions.$.last_updated": new Date().toISOString(),
            code: newCodeVersion.code,
            usageInstructions: newCodeVersion.usageInstructions,
          },
        },
      )

      return NextResponse.json({ message: "Code version added successfully" })
    }

    if (action === "createNewChat") {
      // Create new chat session for existing function
      const newChatSession = {
        id: `chat_${Date.now()}`,
        name: body.chatName || "New Chat",
        messages: [],
        codeVersions: [],
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }

      const result = await functionsCollection.updateOne(
        {
          _id: new (await import("mongodb")).ObjectId(functionId),
          created_by: session.user.email,
        },
        {
          $push: {
            chatSessions: newChatSession,
          },
          $set: {
            currentChatId: newChatSession.id,
          },
        },
      )

      return NextResponse.json({
        message: "New chat created successfully",
        chatSession: newChatSession,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating AI function:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
