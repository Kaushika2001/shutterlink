"use client"

import { useState, useEffect } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { CalendarDays, MapPin, Clock, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getProviderBookings, confirmBooking, rejectBooking, completeBooking } from "@/services/bookings"
import type { Booking } from "@/services/bookings"

export default function ProviderBookingsPage() {
  const { ready, isAuthenticated } = useAuthReady()
  const [statusFilter, setStatusFilter] = useState("all")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    void loadBookings()
  }, [ready, isAuthenticated])

  async function loadBookings() {
    if (!isAuthenticated) {
      setBookings([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getProviderBookings()
      setBookings(data)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load bookings")
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter)

  async function handleAction(bookingId: string, action: "accept" | "reject") {
    setLoadingId(bookingId)
    try {
      const updated = action === "accept" ? await confirmBooking(bookingId) : await rejectBooking(bookingId)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)))
      toast.success(`Booking ${action === "accept" ? "accepted" : "rejected"}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      toast.error(message)
    } finally {
      setLoadingId(null)
    }
  }

  async function updateStatus(bookingId: string, newStatus: string) {
    if (newStatus !== "completed") return
    setLoadingId(bookingId)
    try {
      const updated = await completeBooking(bookingId)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)))
      toast.success("Booking completed")
    } catch {
      toast.error("Failed to update booking")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground">Accept, reject, and manage your booking requests</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map((booking) => (
            <Card key={booking.id} className="border-border bg-card transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-card-foreground">{booking.customer_name || "Customer"}</h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {booking.package_name && (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{booking.package_name}</span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {booking.service_date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {booking.service_time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {booking.location_address || booking.location_type}</span>
                    </div>
                    {booking.special_requests && <p className="mt-2 text-sm text-muted-foreground">{booking.special_requests}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-lg font-bold text-foreground">LKR {Number(booking.total_price).toLocaleString()}</p>
                    {booking.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(booking.id, "accept")}
                          disabled={loadingId === booking.id}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {loadingId === booking.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(booking.id, "reject")}
                          disabled={loadingId === booking.id}
                        >
                          <X className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                    {booking.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(booking.id, "completed")}
                        disabled={loadingId === booking.id}
                      >
                        {loadingId === booking.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={CalendarDays} title="No bookings" description="Booking requests will appear here." />
      )}
    </div>
  )
}
