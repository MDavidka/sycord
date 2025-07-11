import * as React from "react"
import { Calendar as CalendarPrimitive } from "react-day-picker"

import { cn } from "@/lib/utils"

const Calendar = React.forwardRef<
  React.ElementRef<typeof CalendarPrimitive>,
  React.ComponentPropsWithoutRef<typeof CalendarPrimitive>
>(({ className, classNames, showOutsideDays = false, ...props }, ref) => {
  return (
    <CalendarPrimitive
      ref={ref}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          "aria-today:font-semibold",
          "aria-disabled:opacity-50",
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground bg-muted hover:bg-muted focus:bg-muted focus:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  )
})
Calendar.displayName = "Calendar"

export { Calendar }
