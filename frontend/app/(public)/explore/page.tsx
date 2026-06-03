"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProviderCard } from "@/components/cards/provider-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { categoryLabels } from "@/data/mock-data"
import type { ServiceCategory, Provider } from "@/types"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"
import { searchProviders } from "@/services/provider"
import { adaptProvidersForUI } from "@/lib/adapters"
import { toast } from "sonner"

const categories: { value: string; label: string }[] = [
  { value: "all", label: "All Categories" },
  ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
]

const ratingOptions = [
  { value: "0", label: "Any Rating" },
  { value: "4", label: "4+ Stars" },
  { value: "4.5", label: "4.5+ Stars" },
  { value: "4.8", label: "4.8+ Stars" },
]

export default function ExplorePage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [minRating, setMinRating] = useState("0")
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  // Load providers from database
  useEffect(() => {
    async function loadProviders() {
      try {
        setLoading(true)
        const { data } = await searchProviders({
          is_verified: true,
        })
        // Adapt database types to UI types
        const adapted = adaptProvidersForUI(data)
        setProviders(adapted)
      } catch (error: any) {
        console.error('Failed to load providers:', error)
        toast.error('Failed to load providers')
      } finally {
        setLoading(false)
      }
    }
    loadProviders()
  }, [])

  // Filter providers locally
  const filtered = providers.filter((provider) => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const match =
        provider.business_name?.toLowerCase().includes(q) ||
        provider.description?.toLowerCase().includes(q) ||
        provider.location?.toLowerCase().includes(q) ||
        provider.categories.some((cat: any) => cat.toLowerCase().includes(q))
      if (!match) return false
    }
    
    // Category filter
    if (selectedCategory !== "all" && !provider.categories.includes(selectedCategory as any)) {
      return false
    }
    
    // Price range filter
    if (provider.price_range.min > priceRange[1] || provider.price_range.max < priceRange[0]) {
      return false
    }
    
    // Rating filter
    if (provider.rating < parseFloat(minRating)) {
      return false
    }
    
    // Availability filter
    if (showAvailableOnly && !provider.availability.some((s: any) => s.is_available)) {
      return false
    }
    
    return true
  })

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setPriceRange([0, 100000])
    setMinRating("0")
    setShowAvailableOnly(false)
  }

  const hasActiveFilters = selectedCategory !== "all" || priceRange[0] > 0 || priceRange[1] < 100000 || minRating !== "0" || showAvailableOnly

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Category</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Minimum Rating</Label>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ratingOptions.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={showAvailableOnly}
          onChange={(e) => setShowAvailableOnly(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-sm text-foreground">Available now only</span>
      </label>
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
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <h1 className="text-3xl font-bold text-foreground">Explore Services</h1>
            <p className="mt-2 text-muted-foreground">Find the perfect photographer, editor, or equipment for your project</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, location, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background pl-10"
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                    {hasActiveFilters && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">!</span>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="mt-6"><FilterPanel /></div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="flex gap-8">
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Filters</h3>
                <FilterPanel />
              </div>
            </aside>
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "provider" : "providers"} found`}
                </p>
              </div>
              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-48 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((p) => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold text-foreground">No providers found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear filters</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
