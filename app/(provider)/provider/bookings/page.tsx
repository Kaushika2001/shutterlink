"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { mockBookings, categoryLabels } from "@/data/mock-data"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { CalendarDays, MapPin, Clock, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { BookingStatus } from "@/types"

export default function ProviderBookingsPage() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState("all")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [bookings, setBookings] = useState(mockBookings.filter((b) => b.provider_id === user?.id))

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter)

  async function handleAction(bookingId: string, action: "confirmed" | "rejected") {
    setLoadingId(bookingId)
    await new Promise((r) => setTimeout(r, 800))
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: action as BookingStatus } : b))
    )
    setLoadingId(null)
    toast.success(`Booking ${action === "confirmed" ? "accepted" : "rejected"}`)
  }

  async function updateStatus(bookingId: string, newStatus: BookingStatus) {
    setLoadingId(bookingId)
    await new Promise((r) => setTimeout(r, 600))
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    )
    setLoadingId(null)
    toast.success(`Status updated to ${newStatus.replace("_", " ")}`)
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
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map((booking) => (
            <Card key={booking.id} className="border-border bg-card transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-card-foreground">{booking.customer_name}</h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{booking.customer_email}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {booking.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {booking.start_time} - {booking.end_time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {booking.location}</span>
                    </div>
                    <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {categoryLabels[booking.service_category]}
                    </span>
                    {booking.notes && <p className="mt-2 text-sm text-muted-foreground">{booking.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-lg font-bold text-foreground">LKR {booking.total_amount.toLocaleString()}</p>
                    {booking.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(booking.id, "confirmed")}
                          disabled={loadingId === booking.id}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {loadingId === booking.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(booking.id, "rejected")}
                          disabled={loadingId === booking.id}
                        >
                          <X className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                    {booking.status === "confirmed" && (
                      <Select
                        value={booking.status}
                        onValueChange={(v) => updateStatus(booking.id, v as BookingStatus)}
                      >
                        <SelectTrigger className="w-36 bg-card text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
