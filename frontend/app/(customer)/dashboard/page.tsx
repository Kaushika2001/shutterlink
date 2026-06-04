"use client"

import { useEffect, useState } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { StatCard } from "@/components/charts/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CalendarDays, CreditCard, Clock, Search, Star, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { getCustomerBookings, getUpcomingBookings, type Booking } from "@/services/bookings"
import { getUserPayments, type Payment } from "@/services/payments"
import { getPendingReviews } from "@/services/reviews"
import { getUnreadCount } from "@/services/notifications"

export default function CustomerDashboard() {
  const { user, ready, isAuthenticated } = useAuthReady()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [upcoming, setUpcoming] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return

    const load = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [bookingsRes, upcomingRes, paymentsRes, pendingRes, unreadRes] = await Promise.allSettled([
          getCustomerBookings(),
          getUpcomingBookings(),
          getUserPayments(),
          getPendingReviews(),
          getUnreadCount(),
        ])

        if (bookingsRes.status === "fulfilled") setBookings(bookingsRes.value)
        else toast.error("Could not load bookings")

        if (upcomingRes.status === "fulfilled") setUpcoming(upcomingRes.value)
        if (paymentsRes.status === "fulfilled") setPayments(paymentsRes.value)
        if (pendingRes.status === "fulfilled") setPendingReviewCount(pendingRes.value.length)
        if (unreadRes.status === "fulfilled") setUnreadNotifications(unreadRes.value)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user, ready, isAuthenticated])

  const pendingBookings = bookings.filter((b) => b.status === "pending")
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
  const activeBookings = bookings.filter((b) => b.status === "pending" || b.status === "confirmed")
  const totalSpent = payments
    .filter((p) => p.status === "completed")
    .reduce((a, p) => a + (p.amount || 0), 0)
  const needsPayment = bookings.filter(
    (b) =>
      b.status === "pending" &&
      !b.deposit_paid &&
      !payments.some((p) => p.booking_id === b.id && p.status === "completed")
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-muted-foreground">Here is an overview of your bookings and activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Bookings" value={bookings.length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard title="Awaiting provider" value={pendingBookings.length} icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Confirmed" value={confirmedBookings.length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard
          title="Total Spent"
          value={`LKR ${totalSpent.toLocaleString()}`}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {(needsPayment.length > 0 || pendingReviewCount > 0 || unreadNotifications > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap gap-3 p-4">
            {needsPayment.length > 0 && (
              <Button size="sm" asChild>
                <Link href="/dashboard/payments">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {needsPayment.length} payment{needsPayment.length > 1 ? "s" : ""} due
                </Link>
              </Button>
            )}
            {pendingReviewCount > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/reviews">
                  <Star className="mr-2 h-4 w-4" />
                  {pendingReviewCount} review{pendingReviewCount > 1 ? "s" : ""} pending
                </Link>
              </Button>
            )}
            {unreadNotifications > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/notifications">
                  {unreadNotifications} unread notification{unreadNotifications > 1 ? "s" : ""}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">Upcoming & active</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/bookings" className="text-primary">
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(upcoming.length > 0 ? upcoming : activeBookings).length > 0 ? (
              <div className="flex flex-col gap-3">
                {(upcoming.length > 0 ? upcoming : activeBookings).slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {b.provider_business_name || b.provider_name || "Provider"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {b.service_date} at {b.service_time}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No active bookings</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-card-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="outline" className="justify-start gap-3" asChild>
              <Link href="/explore">
                <Search className="h-4 w-4 text-primary" /> Find a Service Provider
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3" asChild>
              <Link href="/dashboard/bookings">
                <CalendarDays className="h-4 w-4 text-primary" /> View My Bookings
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3" asChild>
              <Link href="/dashboard/payments">
                <CreditCard className="h-4 w-4 text-primary" /> Payment History
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="h-4 w-4 text-primary" /> Messages
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3" asChild>
              <Link href="/dashboard/reviews">
                <Star className="h-4 w-4 text-primary" /> My Reviews
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {payments.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">Recent payments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/payments" className="text-primary">
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {payments.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {p.provider_name || "Payment"} · {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-foreground">
                    LKR {p.amount.toLocaleString()} · {p.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
