"use client"

import Link from "next/link"
import type { PortfolioAlbum } from "@/services/portfolio"
import { Images } from "lucide-react"

interface PortfolioAlbumCardProps {
  album: PortfolioAlbum
}

export function PortfolioAlbumCard({ album }: PortfolioAlbumCardProps) {
  const { provider } = album

  return (
    <Link href={`/explore/portfolio/${album.provider_id}`} className="block aspect-[4/5]">
      <div className="gallery-item h-full">
        {album.cover_image_url ? (
          <img
            src={album.cover_image_url}
            alt={album.cover_title || provider.business_name || "Portfolio"}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Images className="h-10 w-10 opacity-40" />
          </div>
        )}
        <div className="gallery-overlay">
          <p className="font-serif text-xl text-white">{provider.business_name || "Provider"}</p>
          <p className="mt-1 text-sm text-white/75">
            {album.item_count} {album.item_count === 1 ? "photo" : "photos"}
            {album.package_count > 0 && ` · ${album.package_count} packages`}
          </p>
        </div>
      </div>
    </Link>
  )
}
