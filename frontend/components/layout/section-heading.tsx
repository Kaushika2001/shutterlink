import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  label?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
  light?: boolean
}

export function SectionHeading({
  label,
  title,
  description,
  align = "center",
  className,
  light = false,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        align === "center" && "text-center",
        className
      )}
    >
      {label && (
        <p
          className={cn(
            "missio-label mb-3",
            light ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
      )}
      <h2
        className={cn(
          "font-serif text-3xl font-normal tracking-tight md:text-4xl lg:text-5xl",
          light ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 max-w-2xl text-base leading-relaxed",
            align === "center" && "mx-auto",
            light ? "text-white/80" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
