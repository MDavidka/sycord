import type * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLElement> {
  href?: string
  title: string
  isLast?: boolean
}

const BreadcrumbItem = ({ href, title, isLast, className }: BreadcrumbItemProps) => {
  return (
    <li className={cn("flex items-center", className)}>
      {href ? (
        <Link
          href={href}
          className={cn(
            "text-sm text-gray-400 hover:text-gray-200 transition-colors",
            isLast && "font-semibold text-white",
          )}
        >
          {title}
        </Link>
      ) : (
        <span className={cn("text-sm text-white font-semibold")}>{title}</span>
      )}
      {!isLast && <span className="mx-2 text-gray-500">/</span>}
    </li>
  )
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: { href?: string; title: string }[]
}

const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="list-none p-0 flex items-center">
        {items.map((item, index) => (
          <BreadcrumbItem key={index} href={item.href} title={item.title} isLast={index === items.length - 1} />
        ))}
      </ol>
    </nav>
  )
}

export { Breadcrumb, BreadcrumbItem }
