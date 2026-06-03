"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getCustomerBookings, type Booking } from "@/services/bookings"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CalendarDays, MapPin, Clock, Search } from "lucide-react"

export default function CustomerBookingsPage() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState("all")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const data = await getCustomerBookings()
        setBookings(data)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user])

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter)

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">Manage and track all your bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary text-primary-foreground" asChild>
            <Link href="/explore">
              <Search className="mr-2 h-4 w-4" /> Book New
            </Link>
          </Button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map((booking) => (
            <Card key={booking.id} className="border-border bg-card transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-card-foreground">{booking.provider_business_name || 'Unknown Provider'}</h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{booking.provider_name}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> {booking.service_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {booking.service_time} ({booking.duration_hours}h)
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {booking.location_type === 'on_site' ? 'On-site' : booking.location_type === 'studio' ? 'Studio' : 'Remote'}
                      </span>
                    </div>
                    {booking.location_address && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {booking.location_address}
                      </p>
                    )}
                    {booking.package_name && (
                      <div className="mt-2">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {booking.package_name}
                        </span>
                      </div>
                    )}
                    {booking.special_requests && (
                      <p className="mt-2 text-sm text-muted-foreground">Note: {booking.special_requests}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">LKR {booking.total_price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Booked {new Date(booking.created_at).toLocaleDateString()}</p>
                    {booking.status === "completed" && (
                      <Button variant="outline" size="sm" className="mt-2" asChild>
                        <Link href="/dashboard/reviews">Leave Review</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No bookings found"
          description="You haven't made any bookings yet. Start exploring service providers."
          actionLabel="Explore Services"
          onAction={() => window.location.href = "/explore"}
        />
      )}
    </div>
  )
}
