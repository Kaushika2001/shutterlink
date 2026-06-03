"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import type { PackageWithProvider } from "@/services/packages"
import { MapPin, Clock, Camera } from "lucide-react"

interface PackageCardProps {
  pkg: PackageWithProvider
  coverImageUrl?: string
}

const serviceTypeLabels: Record<string, string> = {
  photography: "Photography",
  editing: "Editing",
  both: "Photo & Editing",
}

export function PackageCard({ pkg, coverImageUrl }: PackageCardProps) {
  const provider = pkg.provider
  const imageSrc = coverImageUrl

  return (
    <Link href={`/book/${provider.id}/${pkg.id}`}>
      <Card className="group overflow-hidden border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={pkg.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Camera className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur-sm">
              {serviceTypeLabels[pkg.service_type] || pkg.service_type}
            </span>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-card-foreground">{pkg.name}</h3>
              <p className="text-sm text-muted-foreground">{provider?.business_name || "Provider"}</p>
            </div>
            <span className="shrink-0 text-lg font-bold text-primary">
              LKR {pkg.price.toLocaleString()}
            </span>
          </div>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {pkg.description}
          </p>
          {provider && (
            <div className="mb-3 flex items-center gap-2">
              <StarRating rating={provider.average_rating || 0} size={14} />
              <span className="text-sm font-medium text-foreground">
                {provider.average_rating?.toFixed(1) || "0.0"}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {pkg.duration_hours && (
              <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {pkg.duration_hours}h
              </span>
            )}
            {pkg.turnaround_days && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {pkg.turnaround_days} day turnaround
              </span>
            )}
          </div>
          {provider?.coverage_areas && provider.coverage_areas.length > 0 && (
            <div className="mt-3 flex items-center gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {provider.coverage_areas[0]}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
