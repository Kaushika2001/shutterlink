"use client"

import { useState, useEffect } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { getProviderPayments } from "@/services/payments"
import type { Payment } from "@/services/payments"
import { StatCard } from "@/components/charts/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { CreditCard, TrendingUp, DollarSign, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ProviderEarningsPage() {
  const { ready, isAuthenticated } = useAuthReady()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return

    const fetchPayments = async () => {
      if (!isAuthenticated) {
        setPayments([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getProviderPayments()
        setPayments(data)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load earnings")
        setPayments([])
      } finally {
        setLoading(false)
      }
    }

    void fetchPayments()
  }, [ready, isAuthenticated])

  const completedPayments = payments.filter((p) => p.status === "completed")
  const pendingPayments = payments.filter((p) => p.status === "pending")
  const totalEarnings = completedPayments.reduce(
    (a, p) => a + (p.provider_amount ?? p.amount ?? 0),
    0
  )
  const pendingAmount = pendingPayments.reduce(
    (a, p) => a + (p.provider_amount ?? p.amount ?? 0),
    0
  )

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground">Track your payouts and payment history from customer bookings</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Earnings"
          value={`LKR ${totalEarnings.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard title="Pending" value={`LKR ${pendingAmount.toLocaleString()}`} icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Transactions" value={payments.length} icon={<CreditCard className="h-5 w-5" />} />
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-card-foreground">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Booking</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Method</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Your payout</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-3 text-foreground">{p.customer_name || "Customer"}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        {p.booking_number || p.booking_id?.slice(0, 8)}
                      </td>
                      <td className="py-3 capitalize text-foreground">
                        {(p.payment_method || "payment").replace("_", " ")}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(p.payment_date || p.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        LKR {(p.provider_amount ?? p.amount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={DollarSign}
              title="No earnings yet"
              description="Completed customer payments for your bookings will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
