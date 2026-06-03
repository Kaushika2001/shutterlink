"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getProviderReviews } from "@/services/reviews"
import { getProviderProfile } from "@/services/provider"
import { StarRating } from "@/components/ui/star-rating"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Review as ServiceReview } from "@/services/reviews"

interface ReviewDisplay {
  id: string
  booking_id: string
  customer_id: string
  customer_name: string
  provider_id: string
  rating: number
  comment: string
  created_at: string
}

export default function ProviderReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewDisplay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchReviews = async () => {
      try {
        const profile = await getProviderProfile(user.id)
        if (!profile) {
          toast.error("Provider profile not found")
          setLoading(false)
          return
        }

        const data = await getProviderReviews(profile.id)
        setReviews(
          data.map((r: ServiceReview) => ({
            id: r.id,
            booking_id: r.booking_id,
            customer_id: r.reviewer_id,
            customer_name: r.reviewer_name || "Anonymous",
            provider_id: r.provider_id,
            rating: r.rating,
            comment: r.comment || "",
            created_at: r.created_at,
          }))
        )
      } catch (err) {
        toast.error("Failed to load reviews")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [user])

  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground">See what your clients say about your services</p>
      </div>

      {reviews.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-5xl font-bold text-primary">{avgRating.toFixed(1)}</p>
              <StarRating rating={avgRating} size={20} className="mt-2" />
              <p className="mt-2 text-sm text-muted-foreground">{reviews.length} total reviews</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-2 p-6">
              {ratingDist.map((d) => (
                <div key={d.star} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-medium text-foreground">{d.star}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                  <span className="w-8 text-right text-xs text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-card-foreground">All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{review.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{review.created_at}</p>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Star} title="No reviews yet" description="Customer reviews will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
