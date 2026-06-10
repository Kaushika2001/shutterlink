"use client"

import { useState, useEffect, useMemo } from "react"
import { apiRequest } from "@/lib/api"
import { StatCard } from "@/components/charts/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, CreditCard, TrendingUp, Clock, CheckCircle, Filter, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [methodFilter, setMethodFilter] = useState<string>("all")

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data: any[] = await apiRequest('/admin/payments', {}, true)
        setPayments(data ?? [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        (p.customer_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.provider_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.transaction_ref ?? "").toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || p.status === statusFilter
      const matchMethod = methodFilter === "all" || p.method === methodFilter
      return matchSearch && matchStatus && matchMethod
    })
  }, [search, statusFilter, methodFilter, payments])

  const totalCompleted = payments
    .filter((p) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)

  const methodLabels: Record<string, string> = {
    stripe: "Stripe",
    bank_transfer: "Bank Transfer",
    card: "Card",
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Records</h1>
        <p className="text-sm text-muted-foreground">Monitor all transactions on the platform</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={`LKR ${totalCompleted.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
          change={22.1}
          trend="up"
        />
        <StatCard
          title="Pending Payments"
          value={`LKR ${totalPending.toLocaleString()}`}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Completed Transactions"
          value={payments.filter((p) => p.status === "completed").length}
          icon={<CheckCircle className="h-5 w-5" />}
          change={15}
          trend="up"
        />
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">
              All Transactions ({filtered.length})
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full pl-9 sm:w-56"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-36">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="h-9 w-full sm:w-40">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden lg:table-cell">Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-accent/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {payment.transaction_ref}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-card-foreground">
                      {payment.customer_name}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {payment.provider_name}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-card-foreground">
                      LKR {(payment.amount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary" className="text-xs">
                        {methodLabels[payment.method] ?? payment.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
