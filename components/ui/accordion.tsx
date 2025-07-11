import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.AccordionTrigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.AccordionTrigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.AccordionTrigger
    ref={ref}
    className={cn(
      "flex items-center justify-between py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-180",
      className,
    )}
    {...props}
  >
    {children}
  </AccordionPrimitive.AccordionTrigger>
))
AccordionTrigger.displayName = AccordionPrimitive.AccordionTrigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.AccordionContent>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.AccordionContent>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.AccordionContent
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className,
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </AccordionPrimitive.AccordionContent>
))
AccordionContent.displayName = AccordionPrimitive.AccordionContent.displayName

export { Accordion, AccordionTrigger, AccordionContent }
