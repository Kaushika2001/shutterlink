"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getUserPayments } from "@/services/payments"
import type { Payment as ServicePayment } from "@/services/payments"
import { StatCard } from "@/components/charts/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { CreditCard, TrendingUp, DollarSign, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PaymentDisplay {
  id: string
  booking_id: string
  customer_id: string
  customer_name: string
  provider_id: string
  provider_name: string
  amount: number
  method: string
  status: string
  transaction_ref: string
  created_at: string
}

export default function ProviderEarningsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentDisplay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchPayments = async () => {
      try {
        const data = await getUserPayments()
        setPayments(
          data.map((p: ServicePayment) => ({
            id: p.id,
            booking_id: p.booking_id,
            customer_id: p.payer_id,
            customer_name: "Customer",
            provider_id: user.id,
            provider_name: user.name,
            amount: p.amount,
            method: p.payment_method,
            status: p.status,
            transaction_ref: p.transaction_id || p.id,
            created_at: p.payment_date || p.created_at,
          }))
        )
      } catch (err) {
        toast.error("Failed to load earnings")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [user])

  const completedPayments = payments.filter((p) => p.status === "completed")
  const pendingPayments = payments.filter((p) => p.status === "pending")
  const totalEarnings = completedPayments.reduce((a, p) => a + p.amount, 0)
  const pendingAmount = pendingPayments.reduce((a, p) => a + p.amount, 0)

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
        <p className="text-muted-foreground">Track your earnings and payment history</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Earnings" value={`LKR ${totalEarnings.toLocaleString()}`} change={18} trend="up" icon={<TrendingUp className="h-5 w-5" />} />
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
                    <th className="pb-3 text-left font-medium text-muted-foreground">Reference</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Method</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-3 text-foreground">{p.customer_name}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{p.transaction_ref}</td>
                      <td className="py-3 capitalize text-foreground">{p.method.replace("_", " ")}</td>
                      <td className="py-3 text-muted-foreground">{p.created_at}</td>
                      <td className="py-3 text-right font-medium text-foreground">LKR {p.amount.toLocaleString()}</td>
                      <td className="py-3 text-right"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={DollarSign} title="No earnings yet" description="Your earnings will appear here once you receive payments." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
