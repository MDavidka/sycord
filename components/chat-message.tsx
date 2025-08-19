import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Code, AlertCircle, FileText } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  marks?: {
    type: "question" | "plugin-name" | "code" | "missing-details" | "complex-task" | "out-of-scope" | "usage"
    content: string
    pluginName?: string
    missingDetails?: string[]
    files?: { name: string; content: string }[]
  }
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? "text-right" : "text-left"}`}>
        <Card className={`${isUser ? "chat-message user" : "chat-message ai"}`}>
          <CardContent className="p-4">
            {/* Plugin Name Mark [1.1] */}
            {message.marks?.type === "plugin-name" && (
              <div className="mb-3">
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  Plugin: {message.marks.pluginName}
                </Badge>
              </div>
            )}

            {/* Regular message content */}
            <p className="text-sm leading-relaxed">{message.content}</p>

            {/* Code Mark [2] */}
            {message.marks?.type === "code" && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4" />
                  <span className="text-sm font-medium">Generated Code</span>
                </div>
                <div className="code-block">
                  <SyntaxHighlighter
                    language="python"
                    style={oneDark}
                    customStyle={{
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {message.marks.content}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {/* Missing Details Mark [3] */}
            {message.marks?.type === "missing-details" && message.marks.missingDetails && (
              <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Missing Details Required</span>
                </div>
                <ul className="text-sm space-y-1">
                  {message.marks.missingDetails.map((detail, index) => (
                    <li key={index} className="text-muted-foreground">
                      • {detail.replace("-", " ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Usage Instructions Mark [6] */}
            {message.marks?.type === "usage" && (
              <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Usage Instructions</span>
                </div>
                <p className="text-sm">{message.marks.content}</p>
              </div>
            )}

            {/* Complex Task Mark [4] */}
            {message.marks?.type === "complex-task" && message.marks.files && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span className="text-sm font-medium">Complex Task</span>
                </div>
                <div className="space-y-2">
                  {message.marks.files.map((file, index) => (
                    <div key={index} className="text-sm">
                      <Badge variant="outline">{file.name}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}
