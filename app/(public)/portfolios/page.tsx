"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Image, Star, AlertCircle, Package, User } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface PortfolioItem {
  id: string
  provider_id: string
  title: string
  description?: string
  image_url: string
  category?: string
  is_featured: boolean
  display_order: number
  created_at: string
}

interface ProviderProfile {
  id: string
  user_id: string
  business_name?: string
  service_type?: string[]
}

export default function ViewAllPortfoliosPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProviderProfile>>({})
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    setError("")

    try {
      // Load portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (portfolioError) throw portfolioError

      // Load provider profiles
      const { data: profileData, error: profileError } = await supabase
        .from('provider_profiles')
        .select('id, user_id, business_name, service_type')

      if (profileError) throw profileError

      setItems(portfolioData || [])

      // Create profile lookup map
      const profileMap: Record<string, ProviderProfile> = {}
      profileData?.forEach(p => {
        profileMap[p.id] = p
      })
      setProfiles(profileMap)

    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load portfolios')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Get stats
  const totalItems = items.length
  const featuredItems = items.filter(i => i.is_featured).length
  const categoryCounts: Record<string, number> = {}
  items.forEach(item => {
    const cat = item.category || 'Uncategorized'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  const providerCounts: Record<string, number> = {}
  items.forEach(item => {
    providerCounts[item.provider_id] = (providerCounts[item.provider_id] || 0) + 1
  })

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">All Portfolios</h1>
        <p className="text-muted-foreground">Browse all portfolio items in the database</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Featured</p>
                <p className="text-2xl font-bold text-foreground">{featuredItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Providers</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(providerCounts).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(categoryCounts).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      {Object.keys(categoryCounts).length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <Badge key={category} variant="secondary">
                    {category}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Grid */}
      {items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const provider = profiles[item.provider_id]
            return (
              <Card key={item.id} className="overflow-hidden border-border bg-card">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                  {item.is_featured && (
                    <div className="absolute left-2 top-2">
                      <div className="flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                        <Star className="h-3 w-3" />
                        Featured
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-card-foreground">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    {item.category && (
                      <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {item.category}
                      </span>
                    )}
                    {provider && (
                      <span className="text-xs text-muted-foreground">
                        {provider.business_name || 'Provider'}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Image className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No Portfolio Items</h3>
            <p className="text-center text-sm text-muted-foreground">
              No portfolio items found in the database yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Provider Breakdown */}
      {Object.keys(providerCounts).length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>By Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(providerCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([providerId, count]) => {
                  const provider = profiles[providerId]
                  return (
                    <div key={providerId} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {provider?.business_name || 'Unnamed Provider'}
                        </p>
                        {provider?.service_type && provider.service_type.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {provider.service_type.join(', ')}
                          </p>
                        )}
                      </div>
                      <Badge>{count} items</Badge>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
