import * as React from "react"
import { cn } from "@/lib/utils"

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-lg border p-4 [&>[svg]]:h-4 [&>[svg]]:w-4 [&>[svg]]:text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
        {children}
      </p>
    )
  },
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("text-sm opacity-70", className)} {...props}>
        {children}
      </div>
    )
  },
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
