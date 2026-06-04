"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import {
  createReview,
  getPendingReviewsForProvider,
  type Review,
} from "@/services/reviews"
import { StarRating } from "@/components/ui/star-rating"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Star, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  providerId: string
  providerUserId: string
  providerName: string
  existingReviews: Review[]
  onReviewSubmitted?: () => void
}

export function WriteProviderReview({
  providerId,
  providerUserId,
  providerName,
  existingReviews,
  onReviewSubmitted,
}: Props) {
  const { user, isAuthenticated } = useAuth()
  const [pending, setPending] = useState<
    { id: string; service_date?: string; booking_number?: string; status?: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const myReviewsForProvider = existingReviews.filter(
    (r) =>
      r.provider_id === providerUserId ||
      r.provider_id === providerId
  )

  useEffect(() => {
    if (!user || user.role !== "customer") {
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const forProvider = await getPendingReviewsForProvider(providerId)
        setPending(forProvider)
        if (forProvider.length === 1) {
          setSelectedBookingId(forProvider[0].id)
        }
      } catch (err: unknown) {
        setPending([])
        const msg = err instanceof Error ? err.message : ""
        if (msg && !msg.includes("Unauthorized")) {
          toast.error(msg)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [user, providerId])

  async function handleSubmit() {
    if (!selectedBookingId || rating === 0) {
      toast.error("Select a rating before submitting")
      return
    }

    setSubmitting(true)
    try {
      await createReview({
        booking_id: selectedBookingId,
        rating,
        comment: comment.trim() || undefined,
      })
      toast.success("Thank you for your review!")
      setRating(0)
      setComment("")
      setPending((prev) => prev.filter((b) => b.id !== selectedBookingId))
      setSelectedBookingId(null)
      onReviewSubmitted?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <Star className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p>Log in as a customer to leave a review after a confirmed or completed booking.</p>
          <Button className="mt-4" asChild>
            <Link href={`/login?redirect=/provider-profile/${providerId}`}>Log in</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (user?.role !== "customer") {
    return (
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Only customers can submit reviews for completed bookings.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (pending.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {myReviewsForProvider.length > 0 ? (
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              You already reviewed {providerName}.
            </p>
          ) : (
            <p>
              Book with {providerName}, get your booking confirmed, then return here to leave a review.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/book/${providerId}`}>Book this provider</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/bookings">My bookings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Write a review</CardTitle>
        <p className="text-sm text-muted-foreground">
          Share feedback for your booking with {providerName}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {pending.length > 1 && (
          <div className="flex flex-col gap-2">
            <Label>Booking</Label>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedBookingId || ""}
              onChange={(e) => setSelectedBookingId(e.target.value)}
            >
              <option value="" disabled>
                Select a booking
              </option>
              {pending.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.booking_number || b.id.slice(0, 8)} — {b.service_date}
                  {b.status ? ` (${b.status})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mb-2 block">Rating</Label>
          <StarRating rating={rating} interactive onRatingChange={setRating} size={28} />
        </div>
        <div>
          <Label htmlFor="provider-review-comment">Comment (optional)</Label>
          <Textarea
            id="provider-review-comment"
            rows={3}
            placeholder="How was the shoot, delivery, and communication?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-2 bg-background"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || !selectedBookingId}
          className="bg-primary text-primary-foreground"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Submit review
        </Button>
      </CardContent>
    </Card>
  )

}
