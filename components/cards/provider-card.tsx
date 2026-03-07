"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { categoryLabels } from "@/data/mock-data"
import type { Provider } from "@/types"
import { MapPin, CheckCircle2 } from "lucide-react"

interface ProviderCardProps {
  provider: Provider
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const hasAvailability = provider.availability.some((s) => s.is_available)

  return (
    <Link href={`/provider-profile/${provider.id}`}>
      <Card className="group overflow-hidden border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {provider.portfolio[0] ? (
            <img
              src={provider.portfolio[0].image_url}
              alt={`${provider.business_name} portfolio`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No images</div>
          )}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {hasAvailability && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Available
              </span>
            )}
          </div>
          {provider.is_approved && (
            <div className="absolute left-3 top-3">
              <span className="flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-card-foreground">{provider.business_name}</h3>
              <p className="text-sm text-muted-foreground">{provider.name}</p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {provider.provider_type === "photographer"
                ? "Photographer"
                : provider.provider_type === "editor"
                ? "Editor"
                : "Rental"}
            </span>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <StarRating rating={provider.rating} size={14} />
            <span className="text-sm font-medium text-foreground">{provider.rating}</span>
            <span className="text-xs text-muted-foreground">({provider.total_reviews} reviews)</span>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {provider.categories.slice(0, 3).map((cat) => (
              <span key={cat} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {categoryLabels[cat]}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {provider.location}
            </span>
            <span className="font-semibold text-foreground">
              LKR {provider.price_range.min.toLocaleString()}+
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
