"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getUserReviews, getPendingReviews, createReview, type Review, type CreateReviewData } from "@/services/reviews"
import { StarRating } from "@/components/ui/star-rating"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function CustomerReviewsPage() {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewingBooking, setReviewingBooking] = useState<string | null>(null)
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [pendingReviews, setPendingReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const [reviewsData, pendingData] = await Promise.all([
          getUserReviews(),
          getPendingReviews()
        ])
        setMyReviews(reviewsData)
        setPendingReviews(pendingData)
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [user])

  async function handleSubmitReview(bookingId: string, providerId: string) {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const reviewData: CreateReviewData = {
        booking_id: bookingId,
        provider_id: providerId,
        rating: rating,
        comment: comment || undefined,
        would_recommend: rating >= 4,
      }
      
      await createReview(reviewData)
      
      // Refresh the reviews lists
      const [reviewsData, pendingData] = await Promise.all([
        getUserReviews(),
        getPendingReviews()
      ])
      setMyReviews(reviewsData)
      setPendingReviews(pendingData)
      
      setReviewingBooking(null)
      setRating(0)
      setComment("")
      toast.success("Review submitted successfully!")
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error(error.message || "Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Reviews</h1>
        <p className="text-muted-foreground">Leave reviews for completed services and view your past feedback</p>
      </div>

      {pendingReviews.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base text-primary">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingReviews.map((booking: any) => (
              <div key={booking.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{booking.provider_business_name || 'Unknown Provider'}</p>
                    <p className="text-sm text-muted-foreground">{booking.service_date}</p>
                  </div>
                  {reviewingBooking === booking.id ? (
                    <Button variant="ghost" size="sm" onClick={() => setReviewingBooking(null)}>Cancel</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setReviewingBooking(booking.id)}>
                      Write Review
                    </Button>
                  )}
                </div>
                {reviewingBooking === booking.id && (
                  <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Rating</Label>
                      <StarRating rating={rating} interactive onRatingChange={setRating} size={24} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Your Review</Label>
                      <Textarea
                        placeholder="Share your experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="bg-background"
                      />
                    </div>
                    <Button
                      onClick={() => handleSubmitReview(booking.id, booking.provider_id)}
                      disabled={isSubmitting || rating === 0}
                      className="bg-primary text-primary-foreground"
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Submit Review
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-card-foreground">Your Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {myReviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {myReviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-foreground">{review.provider_name || "Provider"}</p>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Star} title="No reviews yet" description="Reviews you leave will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
