"use client"

import { useState, useEffect } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { getBookingHistory, type Booking } from "@/services/bookings"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, CalendarDays, MapPin } from "lucide-react"
import { toast } from "sonner"

export default function BookingHistoryPage() {
  const { user, ready, isAuthenticated } = useAuthReady()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return

    async function fetchBookings() {
      if (!isAuthenticated || !user) {
        setBookings([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getBookingHistory()
        setBookings(data)
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to load booking history")
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    void fetchBookings()
  }, [user, ready, isAuthenticated])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Booking History</h1>
        <p className="text-muted-foreground">View your past and completed bookings</p>
      </div>

      {bookings.length > 0 ? (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-card-foreground">
                        {booking.provider_business_name || booking.provider_name || "Provider"}
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> {booking.service_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />{" "}
                        {booking.location_type === "on_site"
                          ? "On-site"
                          : booking.location_type === "studio"
                            ? "Studio"
                            : "Remote"}
                      </span>
                    </div>
                    {booking.package_name && (
                      <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {booking.package_name}
                      </span>
                    )}
                    {booking.booking_number && (
                      <p className="mt-2 text-xs text-muted-foreground">Ref: {booking.booking_number}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      LKR {booking.total_price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Clock} title="No history yet" description="Your completed and past bookings will appear here." />
      )}
    </div>
  )
}
