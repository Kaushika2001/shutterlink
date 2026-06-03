"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: number
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1
        const filled = interactive ? starValue <= (hoverRating || rating) : starValue <= rating
        const halfFilled = !interactive && !filled && starValue - 0.5 <= rating

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110"
            )}
            onClick={() => interactive && onRatingChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <Star
              size={size}
              className={cn(
                filled
                  ? "fill-amber-400 text-amber-400"
                  : halfFilled
                  ? "fill-amber-400/50 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
