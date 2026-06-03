"use client"

import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api"
import { ChartCard } from "@/components/charts/chart-card"
import { StatCard } from "@/components/charts/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
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
import { Download, FileText, TrendingUp, BookOpen, CreditCard, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"

const COLORS = [
  "oklch(0.457 0.24 277)",
  "oklch(0.6 0.20 280)",
  "oklch(0.70 0.15 285)",
  "oklch(0.55 0.22 270)",
  "oklch(0.80 0.10 275)",
  "oklch(0.45 0.18 300)",
]

export default function AdminReportsPage() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("yearly")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: any = await apiRequest('/admin/reports', {}, true)
        setDashboardData(data)
      } catch (error: any) {
        toast.error(error.message || 'Failed to load report data')
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

  const totalRevenue = dashboardData?.revenue ?? 0
  const completedBookings = dashboardData?.completed_bookings ?? 0
  const activeProviders = dashboardData?.active_providers ?? 0
  const monthlyRevenueData = dashboardData?.revenueData ?? []
  const userGrowthData = dashboardData?.userGrowthData ?? []
  const bookingsByCategory = dashboardData?.bookingsByCategory ?? []
  const providerPerformance = dashboardData?.providerPerformance ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Generate and view platform reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => toast.success("Report downloaded")}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`LKR ${(totalRevenue / 1000).toFixed(0)}K`}
          icon={<TrendingUp className="h-5 w-5" />}
          change={22.1}
          trend="up"
        />
        <StatCard
          title="Completed Bookings"
          value={completedBookings}
          icon={<BookOpen className="h-5 w-5" />}
          change={15.2}
          trend="up"
        />
        <StatCard
          title="Active Providers"
          value={activeProviders}
          icon={<Users className="h-5 w-5" />}
          change={8.3}
          trend="up"
        />
        <StatCard
          title="Avg. Booking Value"
          value={`LKR ${Math.round(totalRevenue / (completedBookings || 1)).toLocaleString()}`}
          icon={<CreditCard className="h-5 w-5" />}
          change={5.8}
          trend="up"
        />
      </div>

      {/* Revenue Chart */}
      <ChartCard title="Revenue Overview" description="Monthly revenue trend for the year">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={monthlyRevenueData}>
            <defs>
              <linearGradient id="reportRevenueGrad" x1="0" y1="0" x2="0" y2="1">
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
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="oklch(0.457 0.24 277)"
              strokeWidth={2}
              fill="url(#reportRevenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Growth + Category Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Platform Growth" description="Customer and provider growth">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" tick={{ fill: "oklch(0.50 0.03 265)" }} />
              <YAxis className="text-xs" tick={{ fill: "oklch(0.50 0.03 265)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.90 0.02 265)",
                  borderRadius: "0.75rem",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Customers"
                stroke="oklch(0.457 0.24 277)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="providers"
                name="Providers"
                stroke="oklch(0.70 0.15 285)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Booking Distribution" description="Bookings by service category">
          <ResponsiveContainer width="100%" height={300}>
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
      </div>

      {/* Provider Performance Table */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-card-foreground">Provider Performance</CardTitle>
            <p className="text-sm text-muted-foreground">Top performing service providers</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => toast.success("Report generated")}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Generate Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex flex-col gap-3">
              {providerPerformance
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .map((provider: any, index: number) => (
                  <div
                    key={provider.name}
                    className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">{provider.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="hidden text-xs sm:inline-flex">
                        {provider.rating} stars
                      </Badge>
                      <span className="text-sm font-semibold text-card-foreground">
                        LKR {provider.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
