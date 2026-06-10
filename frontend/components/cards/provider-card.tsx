"use client"

import Link from "next/link"
import { categoryLabels } from "@/lib/constants"
import type { Provider } from "@/types"
import { MapPin } from "lucide-react"

interface ProviderCardProps {
  provider: Provider
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Link href={`/provider-profile/${provider.id}`} className="block aspect-[4/5]">
      <div className="gallery-item h-full">
        {provider.portfolio[0] ? (
          <img
            src={provider.portfolio[0].image_url}
            alt={`${provider.business_name} portfolio`}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No images</div>
        )}
        <div className="gallery-overlay">
          <p className="font-serif text-xl text-white">{provider.business_name}</p>
          <p className="mt-1 text-sm text-white/75">{provider.name}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {provider.location}
            </span>
            {provider.categories.slice(0, 2).map((cat) => (
              <span key={cat}>{categoryLabels[cat]}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-white">
            LKR {provider.price_range.min.toLocaleString()}+
          </p>
        </div>
      </div>
    </Link>
  )
}
