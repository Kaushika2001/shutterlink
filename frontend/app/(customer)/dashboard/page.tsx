"use client"

import { useAuth } from "@/context/auth-context"
import { StatCard } from "@/components/charts/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CalendarDays, CreditCard, Clock, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { getCustomerBookings, type Booking } from "@/services/bookings"
import { getUserPayments, type Payment } from "@/services/payments"

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const [bookingsData, paymentsData] = await Promise.all([
          getCustomerBookings(),
          getUserPayments()
        ])
        setBookings(bookingsData)
        setPayments(paymentsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const pendingBookings = bookings.filter((b) => b.status === "pending")
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
  const totalSpent = payments.filter((p) => p.status === "completed").reduce((a, p) => a + p.amount, 0)

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
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground">{"Here's an overview of your bookings and activity."}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Bookings" value={bookings.length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard title="Pending" value={pendingBookings.length} icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Confirmed" value={confirmedBookings.length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard title="Total Spent" value={`LKR ${totalSpent.toLocaleString()}`} icon={<CreditCard className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">Upcoming Bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/bookings" className="text-primary">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {confirmedBookings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {confirmedBookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">{b.provider_business_name || 'Unknown Provider'}</p>
                      <p className="text-sm text-muted-foreground">{b.service_date} at {b.service_time}</p>
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

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-card-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="outline" className="justify-start gap-3" asChild>
              <Link href="/explore"><Search className="h-4 w-4 text-primary" /> Find a Service Provider</Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3" asChild>
              <Link href="/dashboard/bookings"><CalendarDays className="h-4 w-4 text-primary" /> View My Bookings</Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3" asChild>
              <Link href="/dashboard/payments"><CreditCard className="h-4 w-4 text-primary" /> Payment History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
