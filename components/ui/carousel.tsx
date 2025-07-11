"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CarouselProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(({ className, children, ...props }, ref) => {
  return (
    <div className={cn("relative", className)} ref={ref} {...props}>
      {children}
    </div>
  )
})
Carousel.displayName = "Carousel"

interface CarouselContentProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const CarouselContent = React.forwardRef<HTMLDivElement, CarouselContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("flex overflow-auto scroll-smooth snap-x snap-mandatory", className)} ref={ref} {...props}>
        {children}
      </div>
    )
  },
)
CarouselContent.displayName = "CarouselContent"

interface CarouselItemProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(({ className, children, ...props }, ref) => {
  return (
    <div className={cn("flex-none snap-start", className)} ref={ref} {...props}>
      {children}
    </div>
  )
})
CarouselItem.displayName = "CarouselItem"

interface CarouselPreviousProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const CarouselPrevious = React.forwardRef<HTMLButtonElement, CarouselPreviousProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-1 text-gray-400 hover:bg-white/30",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  },
)
CarouselPrevious.displayName = "CarouselPrevious"

interface CarouselNextProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const CarouselNext = React.forwardRef<HTMLButtonElement, CarouselNextProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-1 text-gray-400 hover:bg-white/30",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  },
)
CarouselNext.displayName = "CarouselNext"

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
