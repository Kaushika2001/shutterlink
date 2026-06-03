"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getUserPayments } from "@/services/payments"
import { getCustomerBookings } from "@/services/bookings"
import type { Booking } from "@/services/bookings"
import type { Payment } from "@/services/payments"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { EmptyState } from "@/components/ui/empty-state"
import { CreditCard, Receipt, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const paymentMethods = [
  { value: "onepay", label: "OnePay", description: "Sri Lanka's leading digital wallet" },
  { value: "helapay", label: "HelaPay", description: "Fast and secure local payments" },
  { value: "bank_transfer", label: "Bank Transfer", description: "Direct bank transfer" },
  { value: "card", label: "Credit/Debit Card", description: "Visa, Mastercard, Amex" },
]

interface PendingBookingItem {
  id: string
  provider_business: string
  date: string
  total_amount: number
}

interface PaymentItem {
  id: string
  booking_id: string
  provider_name: string
  method: string
  transaction_ref: string
  created_at: string
  amount: number
  status: string
}

export default function CustomerPaymentsPage() {
  const { user } = useAuth()
  const [selectedMethod, setSelectedMethod] = useState("onepay")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState<string | null>(null)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [pendingBookings, setPendingBookings] = useState<PendingBookingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [allPayments, allBookings] = await Promise.all([getUserPayments(), getCustomerBookings()])
        const mappedPayments: PaymentItem[] = allPayments.map((p) => ({
          id: p.id,
          booking_id: p.booking_id,
          provider_name: "",
          method: p.payment_method,
          transaction_ref: p.transaction_id ?? p.id,
          created_at: p.created_at,
          amount: p.amount,
          status: p.status,
        }))
        const mappedPending: PendingBookingItem[] = allBookings
          .filter(
            (b) =>
              b.status === "confirmed" &&
              !allPayments.some((p) => p.booking_id === b.id && p.status === "completed")
          )
          .map((b) => ({
            id: b.id,
            provider_business: b.provider_business_name ?? "",
            date: b.service_date,
            total_amount: b.total_price,
          }))
        setPayments(mappedPayments)
        setPendingBookings(mappedPending)
      } catch (err: any) {
        toast.error(err.message || "Failed to load payments")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handlePayment() {
    setIsProcessing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setIsProcessing(false)
    toast.success("Payment successful!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">Manage your payments and view transaction history</p>
      </div>

      {pendingBookings.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base text-primary">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="font-medium text-foreground">{booking.provider_business}</p>
                    <p className="text-sm text-muted-foreground">{booking.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">LKR {booking.total_amount.toLocaleString()}</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary text-primary-foreground">Pay Now</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Choose Payment Method</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="font-bold text-foreground">LKR {booking.total_amount.toLocaleString()}</span>
                            </div>
                            <div className="mt-1 flex justify-between text-sm">
                              <span className="text-muted-foreground">Service</span>
                              <span className="text-foreground">{booking.provider_business}</span>
                            </div>
                          </div>
                          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="flex flex-col gap-2">
                            {paymentMethods.map((m) => (
                              <Label
                                key={m.value}
                                htmlFor={`pay-${m.value}`}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                                  selectedMethod === m.value ? "border-primary bg-primary/5" : "border-border"
                                }`}
                              >
                                <RadioGroupItem value={m.value} id={`pay-${m.value}`} />
                                <div>
                                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                                  <p className="text-xs text-muted-foreground">{m.description}</p>
                                </div>
                              </Label>
                            ))}
                          </RadioGroup>
                          <Button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full bg-primary text-primary-foreground"
                          >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                            {isProcessing ? "Processing..." : `Pay LKR ${booking.total_amount.toLocaleString()}`}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-card-foreground">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="flex flex-col gap-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">{payment.provider_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.method.charAt(0).toUpperCase() + payment.method.slice(1).replace("_", " ")} - {payment.transaction_ref}
                    </p>
                    <p className="text-xs text-muted-foreground">{payment.created_at}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-foreground">LKR {payment.amount.toLocaleString()}</p>
                      <StatusBadge status={payment.status} />
                    </div>
                    <Dialog open={showReceipt === payment.id} onOpenChange={(o) => setShowReceipt(o ? payment.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="View receipt">
                          <Receipt className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Payment Receipt</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                          <div className="flex items-center justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          </div>
                          <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Reference</span>
                              <span className="font-mono text-foreground">{payment.transaction_ref}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="font-bold text-foreground">LKR {payment.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Method</span>
                              <span className="text-foreground">{payment.method.replace("_", " ")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date</span>
                              <span className="text-foreground">{payment.created_at}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status</span>
                              <StatusBadge status={payment.status} />
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Provider</span>
                              <span className="text-foreground">{payment.provider_name}</span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CreditCard} title="No transactions" description="Your payment history will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
