"use client"

import { use, useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PackageCard } from "@/components/cards/package-card"
import { StarRating } from "@/components/ui/star-rating"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Images,
  Package,
  X,
} from "lucide-react"
import { getProviderWithDetails } from "@/services/provider"
import { getProviderReviews } from "@/services/reviews"
import type { PackageWithProvider } from "@/services/packages"
import type { PortfolioItem } from "@/services/portfolio"
import { toast } from "sonner"

export default function ExplorePortfolioAlbumPage({
  params,
}: {
  params: Promise<{ providerId: string }>
}) {
  const { providerId } = use(params)
  const [provider, setProvider] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("all")

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [providerData, reviewsData] = await Promise.all([
          getProviderWithDetails(providerId),
          getProviderReviews(providerId),
        ])
        if (!providerData) {
          toast.error("Portfolio not found")
          return
        }
        setProvider(providerData)
        setReviews(reviewsData)
      } catch {
        toast.error("Failed to load portfolio")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [providerId])

  const portfolioItems: PortfolioItem[] = useMemo(
    () =>
      [...(provider?.portfolio_items || [])].sort(
        (a: PortfolioItem, b: PortfolioItem) =>
          (a.display_order ?? 0) - (b.display_order ?? 0)
      ),
    [provider]
  )

  const categories = useMemo(() => {
    const cats = new Set<string>()
    portfolioItems.forEach((item) => {
      if (item.category) cats.add(item.category)
    })
    return ["all", ...Array.from(cats)]
  }, [portfolioItems])

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return portfolioItems
    return portfolioItems.filter((item) => item.category === activeCategory)
  }, [portfolioItems, activeCategory])

  const packages: PackageWithProvider[] = useMemo(() => {
    if (!provider) return []
    const list = (provider.service_packages || []).filter((p: any) => p.is_active)
    return list.map((pkg: any) => ({
      ...pkg,
      provider: {
        id: provider.id,
        user_id: provider.user_id,
        business_name: provider.business_name,
        service_type: provider.service_type || [],
        specializations: provider.specializations || [],
        coverage_areas: provider.coverage_areas || [],
        average_rating: provider.average_rating || 0,
        is_verified: provider.is_verified,
        availability_status: provider.availability_status,
        total_bookings: provider.total_bookings || 0,
        created_at: provider.created_at,
        updated_at: provider.updated_at,
      },
    }))
  }, [provider])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 lg:px-8">
          <Skeleton className="mb-6 h-8 w-40" />
          <Skeleton className="mb-8 h-48 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center py-20">
          <Images className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-xl font-semibold">Portfolio not found</h2>
          <Link href="/explore" className="mt-4 text-sm text-primary hover:underline">
            Back to Explore
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <Link
              href="/explore"
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Explore
            </Link>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    {provider.business_name || "Provider Portfolio"}
                  </h1>
                  {provider.is_verified && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground line-clamp-2">
                  {provider.bio || "Browse this provider's work and book a package."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <StarRating rating={provider.average_rating || 0} size={14} />
                    <span className="font-medium text-foreground">
                      {(provider.average_rating || 0).toFixed(1)}
                    </span>
                    <span>({reviews.length} reviews)</span>
                  </div>
                  {provider.coverage_areas?.[0] && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {provider.coverage_areas[0]}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Images className="h-4 w-4" />
                    {portfolioItems.length} photos
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {packages.length} packages
                  </span>
                </div>
              </div>
              <Button asChild className="shrink-0 bg-primary text-primary-foreground">
                <Link href={`/provider-profile/${provider.id}`}>Full profile</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Tabs defaultValue="album">
            <TabsList className="mb-6 w-full justify-start bg-muted sm:w-auto">
              <TabsTrigger value="album">
                Portfolio Album ({portfolioItems.length})
              </TabsTrigger>
              <TabsTrigger value="packages">
                Service Packages ({packages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="album" className="space-y-6">
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(cat)}
                      className={activeCategory === cat ? "bg-primary text-primary-foreground" : ""}
                    >
                      {cat === "all" ? "All" : cat}
                    </Button>
                  ))}
                </div>
              )}

              {filteredItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer overflow-hidden border-border bg-card transition-shadow hover:shadow-md"
                      onClick={() => setSelectedImage(item.image_url)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                        {item.is_featured && (
                          <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                            Featured
                          </span>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-card-foreground">{item.title}</h3>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        {item.category && (
                          <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {item.category}
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  No portfolio photos in this category yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="packages">
              {packages.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {packages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      coverImageUrl={
                        portfolioItems.find((i) => i.is_featured)?.image_url ||
                        portfolioItems[0]?.image_url
                      }
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-border bg-card">
                  <CardContent className="flex flex-col items-center py-16 text-center">
                    <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      This provider has not published any packages yet.
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/provider-profile/${provider.id}`}>View profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-card p-2 shadow-lg"
            onClick={() => setSelectedImage(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={selectedImage}
            alt="Portfolio full view"
            className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <Footer />
    </div>
  )
}
