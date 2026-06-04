"use client"

import { useState, useEffect } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { getProviderReviews, getProviderReviewStats } from "@/services/reviews"
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
  const { user, ready, isAuthenticated } = useAuthReady()
  const [reviews, setReviews] = useState<ReviewDisplay[]>([])
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0, distribution: {} as Record<number, number> })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return

    const fetchReviews = async () => {
      if (!isAuthenticated || !user) {
        setReviews([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const profile = await getProviderProfile(user.id)
        if (!profile) {
          toast.error("Create your provider profile first")
          setLoading(false)
          return
        }

        const [data, stats] = await Promise.all([
          getProviderReviews(profile.id),
          getProviderReviewStats(profile.id),
        ])
        setReviews(
          data.map((r: ServiceReview) => ({
            id: r.id,
            booking_id: r.booking_id,
            customer_id: r.customer_id || r.reviewer_id || "",
            customer_name: r.customer_name || r.reviewer_name || "Customer",
            provider_id: r.provider_id,
            rating: r.rating,
            comment: r.comment || "",
            created_at: r.created_at,
          }))
        )
        setStats({
          average_rating: stats.average_rating,
          total_reviews: stats.total_reviews,
          distribution: {
            1: stats.one_star_count,
            2: stats.two_star_count,
            3: stats.three_star_count,
            4: stats.four_star_count,
            5: stats.five_star_count,
          },
        })
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load reviews")
      } finally {
        setLoading(false)
      }
    }

    void fetchReviews()
  }, [user, ready, isAuthenticated])

  const avgRating = stats.total_reviews > 0 ? stats.average_rating : 0
  const totalReviews = stats.total_reviews

  const ratingDist = [5, 4, 3, 2, 1].map((star) => {
    const count = stats.distribution[star] || 0
    return {
      star,
      count,
      pct: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    }
  })

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

      {totalReviews > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-5xl font-bold text-primary">{avgRating.toFixed(1)}</p>
              <StarRating rating={avgRating} size={20} className="mt-2" />
              <p className="mt-2 text-sm text-muted-foreground">{totalReviews} total reviews</p>
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
