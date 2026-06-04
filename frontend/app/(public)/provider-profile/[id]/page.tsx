"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { StarRating } from "@/components/ui/star-rating"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { categoryLabels } from "@/lib/constants"
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Camera,
  Loader2,
} from "lucide-react"
import { PackageCard } from "@/components/cards/package-card"
import { getProviderWithDetails } from "@/services/provider"
import { getProviderReviews } from "@/services/reviews"
import type { PackageWithProvider } from "@/services/packages"
import { toast } from "sonner"

export default function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [provider, setProvider] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Load provider data
  useEffect(() => {
    async function loadProviderData() {
      try {
        setLoading(true)
        const providerData = await getProviderWithDetails(id)
        
        if (!providerData) {
          toast.error('Provider not found')
          return
        }
        
        setProvider(providerData)

        try {
          const reviewsData = await getProviderReviews(id)
          setReviews(reviewsData)
        } catch {
          setReviews([])
        }
      } catch (error: any) {
        console.error('Failed to load provider:', error)
        toast.error('Failed to load provider details')
      } finally {
        setLoading(false)
      }
    }
    
    loadProviderData()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <Skeleton className="mb-6 h-8 w-32" />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
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
          <Camera className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-xl font-semibold text-foreground">Provider not found</h2>
          <Link href="/explore" className="mt-4 text-sm text-primary hover:underline">Back to Explore</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <Link
            href="/explore"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Explore
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Header */}
              <Card className="mb-6 border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-card-foreground">{provider.business_name || 'Provider'}</h1>
                        {provider.is_verified && (
                          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-muted-foreground">{provider.user?.name}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <StarRating rating={provider.average_rating || 0} size={16} />
                          <span className="font-medium text-foreground">{provider.average_rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {provider.coverage_areas?.[0] || 'Location not specified'}</span>
                        {provider.user?.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {provider.user.email}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {provider.hourly_rate && (
                        <>
                          <p className="text-sm text-muted-foreground">Hourly Rate</p>
                          <p className="text-2xl font-bold text-primary">LKR {provider.hourly_rate.toLocaleString()}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.specializations?.map((spec: string) => (
                      <span key={spec} className="rounded-lg bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {spec}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{provider.bio || 'No description available'}</p>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="portfolio">
                <TabsList className="mb-4 w-full justify-start bg-muted">
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="packages">
                    Packages ({(provider.service_packages || []).filter((p: any) => p.is_active).length})
                  </TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio">
                  {provider.portfolio_items && provider.portfolio_items.length > 0 && (
                    <div className="mb-4 flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/explore/portfolio/${provider.id}`}>View full album</Link>
                      </Button>
                    </div>
                  )}
                  {provider.portfolio_items && provider.portfolio_items.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {provider.portfolio_items.map((item: any) => (
                        <Card
                          key={item.id}
                          className="cursor-pointer overflow-hidden border-border bg-card transition-all hover:shadow-md"
                          onClick={() => setSelectedImage(item.image_url)}
                        >
                          <div className="aspect-[4/3] overflow-hidden">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform hover:scale-105"
                              crossOrigin="anonymous"
                            />
                          </div>
                          <CardContent className="p-3">
                            <h4 className="text-sm font-medium text-card-foreground">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">No portfolio items yet.</div>
                  )}
                </TabsContent>

                <TabsContent value="packages">
                  {(() => {
                    const activePackages: PackageWithProvider[] = (provider.service_packages || [])
                      .filter((p: any) => p.is_active)
                      .map((pkg: any) => ({
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
                    const cover =
                      provider.portfolio_items?.find((i: any) => i.is_featured)?.image_url ||
                      provider.portfolio_items?.[0]?.image_url
                    return activePackages.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {activePackages.map((pkg) => (
                          <PackageCard key={pkg.id} pkg={pkg} coverImageUrl={cover} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">No packages listed yet.</div>
                    )
                  })()}
                </TabsContent>

                <TabsContent value="reviews">
                  {reviews.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {reviews.map((review: any) => (
                        <Card key={review.id} className="border-border bg-card">
                          <CardContent className="p-5">
                            <div className="mb-2 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-card-foreground">{review.reviewer?.full_name || 'Anonymous'}</p>
                                <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                              <StarRating rating={review.rating} size={14} />
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">No reviews yet.</div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 flex flex-col gap-4">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-card-foreground">Book This Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                      <Link href={`/dashboard/book/${provider.id}`}>
                        <Calendar className="mr-2 h-4 w-4" /> Book Now
                      </Link>
                    </Button>
                    {provider.hourly_rate && (
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        LKR {provider.hourly_rate.toLocaleString()} per hour
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
                      <Calendar className="h-4 w-4 text-primary" /> Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <span className={`text-sm font-medium ${
                        provider.availability_status === 'available' ? 'text-green-600' :
                        provider.availability_status === 'busy' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {provider.availability_status === 'available' ? '● Available' :
                         provider.availability_status === 'busy' ? '● Busy' :
                         '● Unavailable'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">{provider.total_bookings}</p>
                        <p className="text-xs text-muted-foreground">Bookings</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{reviews.length}</p>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Portfolio full view"
            className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            crossOrigin="anonymous"
          />
        </div>
      )}
      <Footer />
    </div>
  )
}
