"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import type { PortfolioAlbum } from "@/services/portfolio"
import { Images, MapPin, Package, CheckCircle2 } from "lucide-react"

interface PortfolioAlbumCardProps {
  album: PortfolioAlbum
}

export function PortfolioAlbumCard({ album }: PortfolioAlbumCardProps) {
  const { provider } = album

  return (
    <Link href={`/explore/portfolio/${album.provider_id}`}>
      <Card className="group overflow-hidden border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {album.cover_image_url ? (
            <img
              src={album.cover_image_url}
              alt={album.cover_title || provider.business_name || "Portfolio"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Images className="h-10 w-10 opacity-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="truncate text-sm font-semibold text-white">
              {provider.business_name || "Provider"}
            </p>
            <p className="text-xs text-white/80">
              {album.item_count} {album.item_count === 1 ? "photo" : "photos"}
              {album.package_count > 0 && ` · ${album.package_count} packages`}
            </p>
          </div>
          <div className="absolute left-3 top-3">
            {provider.is_verified && (
              <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-primary-foreground backdrop-blur-sm">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <StarRating rating={provider.average_rating || 0} size={14} />
            <span className="text-sm font-medium text-foreground">
              {(provider.average_rating || 0).toFixed(1)}
            </span>
          </div>
          {album.categories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {album.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {provider.coverage_areas && provider.coverage_areas[0] && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {provider.coverage_areas[0]}
              </span>
            )}
            {album.package_count > 0 && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {album.package_count} packages
              </span>
            )}
          </div>
          {album.preview_items.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-1">
              {album.preview_items.slice(0, 4).map((item) => (
                <div key={item.id} className="aspect-square overflow-hidden rounded-md bg-muted">
                  <img
                    src={item.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
