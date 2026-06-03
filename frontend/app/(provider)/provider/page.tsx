"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getProviderBookings } from "@/services/bookings"
import { getUserPayments } from "@/services/payments"
import { getProviderReviews } from "@/services/reviews"
import { getProviderProfile } from "@/services/provider"
import { toast } from "sonner"
import { StatCard } from "@/components/charts/stat-card"
import { ChartCard } from "@/components/charts/chart-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CalendarDays, CreditCard, Star, Users, TrendingUp, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function ProviderDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        const [bookingData, paymentData, profileData] = await Promise.all([
          getProviderBookings(),
          getUserPayments(),
          getProviderProfile(user.id),
        ])
        setBookings(
          bookingData.map((b: any) => ({
            id: b.id,
            customer_id: b.customer_id,
            customer_name: b.customer_name || "Customer",
            provider_id: b.provider_id,
            service_category: b.package_name || "Photography",
            date: b.service_date,
            start_time: b.service_time,
            location: b.location_address || b.location_type,
            total_amount: b.total_price,
            status: b.status,
          }))
        )
        setPayments(paymentData || [])
        if (profileData?.id) {
          const reviewData = await getProviderReviews(profileData.id)
          setReviews(reviewData)
        }
      } catch {
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const pendingBookings = bookings.filter((b) => b.status === "pending")
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
  const totalEarnings = bookings
    .filter((b) => b.status === "completed" || b.status === "confirmed")
    .reduce((a, b) => a + b.total_amount, 0)
  const avgRating =
    reviews.length > 0 ? (reviews.reduce((a: number, r: any) => a + (r.rating || 0), 0) / reviews.length).toFixed(1) : "N/A"

  const monthlyData = [
    { name: "Jan", bookings: 5, revenue: 45000 },
    { name: "Feb", bookings: 8, revenue: 72000 },
    { name: "Mar", bookings: 12, revenue: 110000 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Provider Dashboard</h1>
        <p className="text-muted-foreground">Manage your services, bookings, and earnings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Bookings" value={bookings.length} change={12} trend="up" icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard title="Pending" value={pendingBookings.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Total Earnings" value={`LKR ${totalEarnings.toLocaleString()}`} change={18} trend="up" icon={<CreditCard className="h-5 w-5" />} />
        <StatCard title="Avg Rating" value={avgRating} icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly Performance" description="Bookings and revenue overview">
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
              <Link href="/provider/bookings" className="text-primary">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingBookings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pendingBookings.slice(0, 4).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">{b.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{b.date} - {b.service_category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">LKR {b.total_amount.toLocaleString()}</span>
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
          <CardTitle className="text-base font-semibold text-card-foreground">Upcoming Bookings</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/provider/bookings" className="text-primary">Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {confirmedBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {confirmedBookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{b.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{b.date} at {b.start_time} - {b.location}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No upcoming bookings</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
