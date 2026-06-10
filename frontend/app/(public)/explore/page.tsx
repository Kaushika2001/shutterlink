"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PackageCard } from "@/components/cards/package-card"
import { PortfolioAlbumCard } from "@/components/cards/portfolio-album-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeading } from "@/components/layout/section-heading"
import { Search, SlidersHorizontal, X, Package, Images } from "lucide-react"
import { getExplorePackages } from "@/services/packages"
import { getPublicPortfolioAlbums, type PortfolioAlbum } from "@/services/portfolio"
import type { PackageWithProvider } from "@/services/packages"
import { toast } from "sonner"

const serviceTypes = [
  { value: "all", label: "All Types" },
  { value: "photography", label: "Photography" },
  { value: "editing", label: "Editing" },
  { value: "both", label: "Photo & Editing" },
]

function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get("tab") === "portfolios" ? "portfolios" : "packages"

  const [activeTab, setActiveTab] = useState(initialTab)
  const [packages, setPackages] = useState<PackageWithProvider[]>([])
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [loadingAlbums, setLoadingAlbums] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedServiceType, setSelectedServiceType] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [minRating, setMinRating] = useState("0")
  const [portfolioCategory, setPortfolioCategory] = useState("all")
  const [availabilityOnly, setAvailabilityOnly] = useState(false)

  useEffect(() => {
    async function loadPackages() {
      try {
        setLoadingPackages(true)
        const data = await getExplorePackages()
        setPackages(data)
      } catch {
        toast.error("Failed to load packages")
      } finally {
        setLoadingPackages(false)
      }
    }
    loadPackages()
  }, [])

  useEffect(() => {
    async function loadAlbums() {
      try {
        setLoadingAlbums(true)
        const data = await getPublicPortfolioAlbums()
        setAlbums(data)
      } catch {
        toast.error("Failed to load portfolios")
      } finally {
        setLoadingAlbums(false)
      }
    }
    loadAlbums()
  }, [])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value === "portfolios") {
      params.set("tab", "portfolios")
    } else {
      params.delete("tab")
    }
    const q = params.toString()
    router.replace(q ? `/explore?${q}` : "/explore", { scroll: false })
  }

  const filteredPackages = packages.filter((pkg) => {
    const provider = pkg.provider

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const match =
        pkg.name.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q) ||
        provider?.business_name?.toLowerCase().includes(q) ||
        provider?.coverage_areas?.some((a: string) => a.toLowerCase().includes(q))
      if (!match) return false
    }

    if (selectedServiceType !== "all" && pkg.service_type !== selectedServiceType) {
      return false
    }

    if (pkg.price < priceRange[0] || pkg.price > priceRange[1]) {
      return false
    }

    if (provider && provider.average_rating < parseFloat(minRating)) {
      return false
    }

    if (availabilityOnly && provider?.availability_status !== "available") {
      return false
    }

    return true
  })

  const portfolioCategories = ["all", ...new Set(albums.flatMap((a) => a.categories))]

  const filteredAlbums = albums.filter((album) => {
    const provider = album.provider

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const match =
        provider.business_name?.toLowerCase().includes(q) ||
        provider.bio?.toLowerCase().includes(q) ||
        album.categories.some((c) => c.toLowerCase().includes(q)) ||
        album.cover_title?.toLowerCase().includes(q)
      if (!match) return false
    }

    if (parseFloat(minRating) > 0 && (provider.average_rating || 0) < parseFloat(minRating)) {
      return false
    }

    if (availabilityOnly && provider.availability_status !== "available") {
      return false
    }

    if (
      portfolioCategory !== "all" &&
      !album.categories.includes(portfolioCategory)
    ) {
      return false
    }

    return true
  })

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedServiceType("all")
    setPriceRange([0, 100000])
    setMinRating("0")
    setPortfolioCategory("all")
    setAvailabilityOnly(false)
  }

  const hasActiveFilters =
    selectedServiceType !== "all" ||
    priceRange[0] > 0 ||
    priceRange[1] < 100000 ||
    minRating !== "0" ||
    portfolioCategory !== "all" ||
    availabilityOnly

  const loading = activeTab === "packages" ? loadingPackages : loadingAlbums
  const resultCount =
    activeTab === "packages" ? filteredPackages.length : filteredAlbums.length

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      {activeTab === "packages" && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Service Type</Label>
          <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {activeTab === "packages" && (
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-medium text-foreground">Price Range (LKR)</Label>
          <Slider
            min={0}
            max={100000}
            step={1000}
            value={priceRange}
            onValueChange={setPriceRange}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>LKR {priceRange[0].toLocaleString()}</span>
            <span>LKR {priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      )}
      {activeTab === "portfolios" && portfolioCategories.length > 1 && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Portfolio Category</Label>
          <Select value={portfolioCategory} onValueChange={setPortfolioCategory}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {portfolioCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label className="text-sm font-medium text-foreground">Available providers only</Label>
        <input
          type="checkbox"
          checked={availabilityOnly}
          onChange={(e) => setAvailabilityOnly(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Minimum Rating</Label>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Rating</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="4.5">4.5+ Stars</SelectItem>
            <SelectItem value="4.8">4.8+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
          <X className="mr-1 h-3.5 w-3.5" /> Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <SectionHeading
              align="left"
              label="Discover"
              title="Explore"
              description="Browse service packages and portfolio albums from creators across Sri Lanka."
            />
            <div className="mt-8 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={
                    activeTab === "packages"
                      ? "Search packages, providers, or locations..."
                      : "Search portfolios, providers, or categories..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background pl-10"
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                    {hasActiveFilters && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        !
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-8 h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0 sm:w-auto">
              <TabsTrigger value="packages" className="gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 data-[state=active]:border-foreground data-[state=active]:bg-transparent">
                <Package className="h-4 w-4" />
                Packages
              </TabsTrigger>
              <TabsTrigger value="portfolios" className="gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 data-[state=active]:border-foreground data-[state=active]:bg-transparent">
                <Images className="h-4 w-4" />
                Portfolios
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-8">
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-20 border border-border bg-card p-5">
                  <h3 className="missio-label mb-4 text-muted-foreground">Filters</h3>
                  <FilterPanel />
                </div>
              </aside>

              <div className="flex-1">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {loading
                      ? "Loading..."
                      : activeTab === "packages"
                        ? `${resultCount} ${resultCount === 1 ? "package" : "packages"} found`
                        : `${resultCount} ${resultCount === 1 ? "album" : "albums"} found`}
                  </p>
                </div>

                <TabsContent value="packages" className="mt-0">
                  {loadingPackages ? (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="h-48 w-full rounded-lg" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : filteredPackages.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredPackages.map((pkg) => (
                        <PackageCard key={pkg.id} pkg={pkg} />
                      ))}
                    </div>
                  ) : (
                    <EmptyExplore onClear={clearFilters} type="packages" />
                  )}
                </TabsContent>

                <TabsContent value="portfolios" className="mt-0">
                  {loadingAlbums ? (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="aspect-[16/10] w-full rounded-lg" />
                      ))}
                    </div>
                  ) : filteredAlbums.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredAlbums.map((album) => (
                        <PortfolioAlbumCard key={album.provider_id} album={album} />
                      ))}
                    </div>
                  ) : (
                    <EmptyExplore onClear={clearFilters} type="portfolios" />
                  )}
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function EmptyExplore({
  onClear,
  type,
}: {
  onClear: () => void
  type: "packages" | "portfolios"
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {type === "packages" ? (
        <Package className="mb-4 h-12 w-12 text-muted-foreground/40" />
      ) : (
        <Images className="mb-4 h-12 w-12 text-muted-foreground/40" />
      )}
      <h3 className="text-lg font-semibold text-foreground">
        No {type === "packages" ? "packages" : "portfolios"} found
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Try adjusting your search or filter criteria
      </p>
      <Button variant="outline" className="mt-4" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Skeleton className="h-8 w-48" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  )
}
