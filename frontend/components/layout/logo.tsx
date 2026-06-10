import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  href?: string
  className?: string
  light?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ href = "/", className, light = false, size = "md" }: LogoProps) {
  const sizeClass =
    size === "sm"
      ? "text-lg"
      : size === "lg"
        ? "text-3xl md:text-4xl"
        : "text-xl md:text-2xl"

  const content = (
    <span
      className={cn(
        "font-serif font-medium tracking-wide",
        sizeClass,
        light ? "text-white" : "text-foreground",
        className
      )}
    >
      ShutterLink
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    )
  }

  return content
}
