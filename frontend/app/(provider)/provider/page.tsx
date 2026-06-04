"use client"

import { useState, useEffect } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { getProviderBookings } from "@/services/bookings"
import { getProviderPayments } from "@/services/payments"
import { getProviderReviewStats } from "@/services/reviews"
import { buildMonthlyBookingChart } from "@/lib/chart-utils"
import { getProviderProfile } from "@/services/provider"
import { getUnreadCount } from "@/services/notifications"
import { toast } from "sonner"
import { StatCard } from "@/components/charts/stat-card"
import { ChartCard } from "@/components/charts/chart-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  CalendarDays,
  CreditCard,
  Star,
  Users,
  Loader2,
  MessageSquare,
  Bell,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type DashboardBooking = {
  id: string
  customer_name: string
  service_category: string
  date: string
  start_time: string
  location: string
  total_amount: number
  status: string
}

export default function ProviderDashboard() {
  const { user, ready, isAuthenticated } = useAuthReady()
  const [bookings, setBookings] = useState<DashboardBooking[]>([])
  const [avgRating, setAvgRating] = useState("N/A")
  const [monthlyData, setMonthlyData] = useState<{ name: string; bookings: number; revenue: number }[]>(
    []
  )
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return

    const loadData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false)
        return
      }

      const errors: string[] = []

      const [bookingsResult, paymentsResult, profileResult, unreadResult] =
        await Promise.allSettled([
          getProviderBookings(),
          getProviderPayments(),
          getProviderProfile(user.id),
          getUnreadCount(),
        ])

      let bookingData: Awaited<ReturnType<typeof getProviderBookings>> = []
      if (bookingsResult.status === "fulfilled") {
        bookingData = bookingsResult.value
      } else {
        errors.push("bookings")
      }

      if (paymentsResult.status === "fulfilled") {
        const earned = paymentsResult.value
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + (p.provider_amount ?? p.amount ?? 0), 0)
        setTotalEarnings(earned)
      } else {
        errors.push("payments")
      }

      const profileData = profileResult.status === "fulfilled" ? profileResult.value : null
      if (profileResult.status === "rejected") errors.push("profile")

      if (unreadResult.status === "fulfilled") {
        setUnreadNotifications(unreadResult.value)
      }

      setBookings(
        bookingData.map((b) => ({
          id: b.id,
          customer_name: b.customer_name || "Customer",
          service_category: b.package_name || "Service",
          date: b.service_date,
          start_time: b.service_time,
          location: b.location_address || b.location_type || "",
          total_amount: Number(b.total_price) || 0,
          status: b.status,
        }))
      )
      setMonthlyData(buildMonthlyBookingChart(bookingData))

      if (profileData?.id) {
        try {
          const stats = await getProviderReviewStats(profileData.id)
          setAvgRating(stats.total_reviews > 0 ? stats.average_rating.toFixed(1) : "N/A")
        } catch {
          setAvgRating("N/A")
        }
      }

      if (errors.length > 0) {
        toast.error(`Some dashboard data could not be loaded (${errors.join(", ")})`)
      }

      setLoading(false)
    }

    void loadData()
  }, [user, ready, isAuthenticated])

  const pendingBookings = bookings.filter((b) => b.status === "pending")
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed")

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {user?.name?.split(" ")[0] || "Provider"}
        </h1>
        <p className="text-muted-foreground">Manage your services, bookings, and earnings.</p>
      </div>

      {unreadNotifications > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <span className="text-sm text-muted-foreground">
              {unreadNotifications} unread notification{unreadNotifications > 1 ? "s" : ""}
            </span>
            <Button size="sm" variant="outline" asChild>
              <Link href="/provider/notifications">
                <Bell className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Bookings" value={bookings.length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard title="Pending" value={pendingBookings.length} icon={<Users className="h-5 w-5" />} />
        <StatCard
          title="Total Earnings"
          value={`LKR ${totalEarnings.toLocaleString()}`}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard title="Avg Rating" value={avgRating} icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly Performance" description="Bookings and revenue (last 6 months)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="bookings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">Pending Requests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/provider/bookings" className="text-primary">
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingBookings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pendingBookings.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{b.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.date} — {b.service_category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        LKR {b.total_amount.toLocaleString()}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No pending requests</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-card-foreground">Confirmed bookings</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/provider/bookings" className="text-primary">
              Manage
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {confirmedBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {confirmedBookings.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{b.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.date} at {b.start_time} — {b.location}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No confirmed bookings</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-card-foreground">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/bookings">
              <CalendarDays className="mr-2 h-4 w-4" />
              Bookings
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/earnings">
              <CreditCard className="mr-2 h-4 w-4" />
              Earnings
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/messages">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/packages">Packages</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/portfolio">Portfolio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
