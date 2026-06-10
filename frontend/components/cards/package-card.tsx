"use client"

import Link from "next/link"
import type { PackageWithProvider } from "@/services/packages"
import { Camera, Clock, MapPin } from "lucide-react"

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
    <Link href={`/book/${provider.id}/${pkg.id}`} className="group block">
      <div className="gallery-item aspect-[4/5]">
        {imageSrc ? (
          <img src={imageSrc} alt={pkg.name} />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <Camera className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="gallery-overlay">
          <p className="missio-label text-white/60">
            {serviceTypeLabels[pkg.service_type] || pkg.service_type}
          </p>
          <p className="mt-1 font-serif text-xl text-white">{pkg.name}</p>
          <p className="mt-1 text-sm text-white/75">{provider?.business_name}</p>
          <p className="mt-3 text-sm font-medium text-white">
            LKR {pkg.price.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 text-sm text-muted-foreground">{pkg.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {pkg.duration_hours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pkg.duration_hours}h
            </span>
          )}
          {provider?.coverage_areas?.[0] && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {provider.coverage_areas[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
