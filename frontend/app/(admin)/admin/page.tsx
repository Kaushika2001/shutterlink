"use client"

import { useState, useEffect } from "react"
import { Users, Camera, BookOpen, CreditCard, TrendingUp, AlertTriangle, Loader2 } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { StatCard } from "@/components/charts/stat-card"
import { ChartCard } from "@/components/charts/chart-card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const COLORS = [
  "oklch(0.457 0.24 277)",
  "oklch(0.6 0.20 280)",
  "oklch(0.70 0.15 285)",
  "oklch(0.55 0.22 270)",
  "oklch(0.80 0.10 275)",
  "oklch(0.45 0.18 300)",
]

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: any = await apiRequest('/admin/dashboard', {}, true)
        setDashboardData({
          ...data,
          recentBookings: (data.recentBookings ?? []).map((b: any) => ({
            ...b,
            provider_business: b.provider_business_name ?? b.provider_business,
            date: b.service_date ?? b.date,
            total_amount: b.total_price ?? b.total_amount,
          })),
        })
      } catch (error: any) {
        toast.error(error.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const stats = [
    {
      title: "Total Users",
      value: dashboardData?.total_users ?? 0,
      change: 12.5,
      icon: <Users className="h-5 w-5" />,
      trend: "up" as const,
    },
    {
      title: "Service Providers",
      value: dashboardData?.total_providers ?? 0,
      change: 8.3,
      icon: <Camera className="h-5 w-5" />,
      trend: "up" as const,
    },
    {
      title: "Total Bookings",
      value: dashboardData?.total_bookings ?? 0,
      change: 15.2,
      icon: <BookOpen className="h-5 w-5" />,
      trend: "up" as const,
    },
    {
      title: "Revenue",
      value: `LKR ${((dashboardData?.revenue ?? 0) / 1000).toFixed(0)}K`,
      change: 22.1,
      icon: <CreditCard className="h-5 w-5" />,
      trend: "up" as const,
    },
  ]

  const monthlyRevenueData = dashboardData?.revenueData ?? []
  const userGrowthData = dashboardData?.userGrowthData ?? []
  const bookingsByCategory = dashboardData?.bookingsByCategory ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your platform performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Monthly Revenue" description="Revenue trend over the past 12 months">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.457 0.24 277)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.457 0.24 277)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" tick={{ fill: "oklch(0.50 0.03 265)" }} />
              <YAxis
                className="text-xs"
                tick={{ fill: "oklch(0.50 0.03 265)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value: number) => [`LKR ${value.toLocaleString()}`, "Revenue"]}
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.90 0.02 265)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="oklch(0.457 0.24 277)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Growth" description="Customers and providers growth">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" tick={{ fill: "oklch(0.50 0.03 265)" }} />
              <YAxis className="text-xs" tick={{ fill: "oklch(0.50 0.03 265)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.90 0.02 265)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend />
              <Bar dataKey="value" name="Customers" fill="oklch(0.457 0.24 277)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="providers" name="Providers" fill="oklch(0.70 0.15 285)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pie + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Bookings by Category" description="Distribution of service categories">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={bookingsByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {bookingsByCategory.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.90 0.02 265)",
                  borderRadius: "0.75rem",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="border-border bg-card shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-card-foreground">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {(dashboardData?.recentBookings ?? []).slice(0, 5).map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-card-foreground">
                      {booking.customer_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {booking.provider_business} &middot; {booking.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-card-foreground">
                      LKR {booking.total_amount?.toLocaleString() ?? booking.total_amount}
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Disputes */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle className="text-base font-semibold text-card-foreground">Active Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          {(dashboardData?.active_disputes ?? []).filter((d: any) => d.status === "open").length === 0 ? (
            <p className="text-sm text-muted-foreground">No active disputes</p>
          ) : (
            <div className="flex flex-col gap-3">
              {(dashboardData?.active_disputes ?? [])
                .filter((d: any) => d.status === "open")
                .map((dispute: any) => (
                  <div
                    key={dispute.id}
                    className="flex items-center justify-between rounded-xl border border-border p-4"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-card-foreground">
                        {dispute.customer_name} vs {dispute.provider_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{dispute.reason}</span>
                    </div>
                    <StatusBadge status={dispute.status} />
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
