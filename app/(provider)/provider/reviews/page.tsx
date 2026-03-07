"use client"

import { useAuth } from "@/context/auth-context"
import { mockReviews } from "@/data/mock-data"
import { StarRating } from "@/components/ui/star-rating"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Star } from "lucide-react"

export default function ProviderReviewsPage() {
  const { user } = useAuth()
  const myReviews = mockReviews.filter((r) => r.provider_id === user?.id)
  const avgRating = myReviews.length > 0 ? myReviews.reduce((a, r) => a + r.rating, 0) / myReviews.length : 0

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: myReviews.filter((r) => r.rating === star).length,
    pct: myReviews.length > 0 ? (myReviews.filter((r) => r.rating === star).length / myReviews.length) * 100 : 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground">See what your clients say about your services</p>
      </div>

      {myReviews.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-5xl font-bold text-primary">{avgRating.toFixed(1)}</p>
              <StarRating rating={avgRating} size={20} className="mt-2" />
              <p className="mt-2 text-sm text-muted-foreground">{myReviews.length} total reviews</p>
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
          {myReviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {myReviews.map((review) => (
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
