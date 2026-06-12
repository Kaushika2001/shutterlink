"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import {
  getUserPayments,
  checkoutPayment,
  completePayment,
  scheduleInPersonBalance,
  getPaymentSandboxMode,
  type CheckoutPaymentType,
} from "@/services/payments"
import { getCustomerBookings } from "@/services/bookings"
import type { Booking } from "@/services/bookings"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { CreditCard, Receipt, Loader2, CheckCircle2, FlaskConical, MapPin, Banknote } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

const PAYMENT_METHOD = "stripe"

interface DuePaymentItem {
  id: string
  provider_business: string
  date: string
  amount: number
  payment_type: CheckoutPaymentType
  label: string
  location_address?: string
  service_time?: string
}

interface PaymentItem {
  id: string
  booking_id: string
  provider_name: string
  method: string
  payment_type: string
  transaction_ref: string
  created_at: string
  amount: number
  status: string
}

function getBalanceAmount(booking: Booking): number {
  const total = Number(booking.total_price) || 0
  const deposit =
    Number(booking.deposit_amount) || Math.round(total * 0.5 * 100) / 100
  return Math.max(0, Math.round((total - deposit) * 100) / 100)
}

function isDepositPayment(p: { payment_type?: string }) {
  const t = (p.payment_type || "deposit").toLowerCase()
  return t === "deposit" || t === ""
}

function isBalancePayment(p: { payment_type?: string }) {
  const t = (p.payment_type || "").toLowerCase()
  return t === "balance" || t === "full_payment"
}

function isInPersonMethod(method?: string) {
  const m = (method || "").toLowerCase()
  return m === "in_person" || m === "cash" || m === "cash_at_location"
}

export default function CustomerPaymentsPage() {
  const { user, ready, isAuthenticated } = useAuthReady()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState<string | null>(null)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [depositDue, setDepositDue] = useState<DuePaymentItem[]>([])
  const [balanceDue, setBalanceDue] = useState<DuePaymentItem[]>([])
  const [inPersonScheduled, setInPersonScheduled] = useState<DuePaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sandboxMode, setSandboxMode] = useState(false)

  const mapPayments = useCallback(
    (allPayments: Awaited<ReturnType<typeof getUserPayments>>): PaymentItem[] =>
      allPayments.map((p) => ({
        id: p.id,
        booking_id: p.booking_id,
        provider_name: p.provider_name || "",
        method: p.payment_method || "unknown",
        payment_type: p.payment_type || "deposit",
        transaction_ref: p.transaction_id ?? p.id,
        created_at: new Date(p.created_at).toLocaleString(),
        amount: p.amount,
        status: p.status,
      })),
    []
  )

  useEffect(() => {
    void getPaymentSandboxMode().then(setSandboxMode)
  }, [])

  useEffect(() => {
    if (!ready) return

    async function load() {
      if (!isAuthenticated || !user) {
        setPayments([])
        setDepositDue([])
        setBalanceDue([])
        setInPersonScheduled([])
        setLoading(false)
        return
      }

      try {
        const allBookings = await getCustomerBookings()
        let allPayments: Awaited<ReturnType<typeof getUserPayments>> = []
        try {
          allPayments = await getUserPayments()
        } catch (payErr: any) {
          toast.error(payErr?.message || "Failed to load payment history")
        }

        setPayments(mapPayments(allPayments))

        const deposits: DuePaymentItem[] = allBookings
          .filter(
            (b) =>
              ["pending", "confirmed"].includes(b.status) &&
              !b.deposit_paid &&
              !allPayments.some(
                (p) => p.booking_id === b.id && p.status === "completed" && isDepositPayment(p)
              )
          )
          .map((b) => ({
            id: b.id,
            provider_business: b.provider_business_name ?? "",
            date: b.service_date,
            amount: Number(b.deposit_amount) || Math.round(Number(b.total_price) * 0.5 * 100) / 100,
            payment_type: "deposit" as const,
            label: "Deposit (50%)",
          }))

        const balances: DuePaymentItem[] = []
        const inPerson: DuePaymentItem[] = []

        allBookings.forEach((b) => {
          const depositPaid =
            b.deposit_paid ||
            allPayments.some(
              (p) => p.booking_id === b.id && p.status === "completed" && isDepositPayment(p)
            )
          const balancePaid =
            b.balance_paid ||
            allPayments.some(
              (p) => p.booking_id === b.id && p.status === "completed" && isBalancePayment(p)
            )
          const pendingInPerson = allPayments.some(
            (p) =>
              p.booking_id === b.id &&
              p.status === "pending" &&
              isBalancePayment(p) &&
              isInPersonMethod(p.payment_method)
          )

          if (
            b.status !== "completed" ||
            !depositPaid ||
            balancePaid ||
            getBalanceAmount(b) <= 0
          ) {
            return
          }

          const item: DuePaymentItem = {
            id: b.id,
            provider_business: b.provider_business_name ?? "",
            date: b.service_date,
            amount: getBalanceAmount(b),
            payment_type: "balance",
            label: "Balance after shoot",
            location_address: b.location_address || b.location_type,
            service_time: b.service_time,
          }

          if (pendingInPerson) {
            inPerson.push(item)
          } else {
            balances.push(item)
          }
        })

        setDepositDue(deposits)
        setBalanceDue(balances)
        setInPersonScheduled(inPerson)
      } catch (err: any) {
        toast.error(err?.message || "Failed to load bookings for payments")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [ready, isAuthenticated, user, mapPayments])

  async function handlePayment(bookingId: string, paymentType: CheckoutPaymentType) {
    setIsProcessing(true)
    try {
      const checkout = await checkoutPayment(bookingId, PAYMENT_METHOD, paymentType)

      if (checkout.mode === "redirect" && checkout.redirect_url && !checkout.sandbox) {
        window.location.href = checkout.redirect_url
        return
      }

      if (!checkout.sandbox && checkout.gateway_configured) {
        toast.error("Complete payment on the gateway page. If you already paid, open Payments again to sync.")
        return
      }

      await completePayment(
        checkout.payment.id,
        PAYMENT_METHOD,
        checkout.sandbox ? `SBX-${paymentType.toUpperCase()}-${Date.now()}` : undefined
      )

      const isBalance = paymentType === "balance"
      toast.success(
        checkout.sandbox
          ? isBalance
            ? "Sandbox balance payment recorded."
            : "Sandbox deposit recorded."
          : isBalance
            ? "Balance paid — thank you!"
            : "Deposit paid — your booking is secured."
      )

      if (paymentType === "deposit") {
        setDepositDue((prev) => prev.filter((b) => b.id !== bookingId))
      } else {
        setBalanceDue((prev) => prev.filter((b) => b.id !== bookingId))
      }

      const refreshed = await getUserPayments()
      setPayments(mapPayments(refreshed))
    } catch (err: any) {
      toast.error(err.message || "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleScheduleInPerson(booking: DuePaymentItem) {
    setIsProcessing(true)
    try {
      const result = await scheduleInPersonBalance(booking.id)
      toast.success(result.message)
      setBalanceDue((prev) => prev.filter((b) => b.id !== booking.id))
      setInPersonScheduled((prev) => [
        ...prev,
        {
          ...booking,
          location_address: result.location_address || booking.location_address,
          service_time: result.service_time || booking.service_time,
        },
      ])
      const refreshed = await getUserPayments()
      setPayments(mapPayments(refreshed))
    } catch (err: any) {
      toast.error(err.message || "Could not schedule in-person payment")
    } finally {
      setIsProcessing(false)
    }
  }

  function PaymentDueCard({ items, title, accent }: { items: DuePaymentItem[]; title: string; accent: string }) {
    if (items.length === 0) return null
    return (
      <Card className={accent}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {items.map((booking) => (
              <div
                key={`${booking.id}-${booking.payment_type}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{booking.provider_business}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.date} · {booking.label}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">LKR {booking.amount.toLocaleString()}</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary text-primary-foreground">
                        {booking.payment_type === "balance" ? "Pay Balance" : "Pay Deposit"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">
                          {booking.payment_type === "balance"
                            ? "Pay remaining balance"
                            : "Pay deposit with Stripe"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{booking.label}</span>
                            <span className="font-bold text-foreground">LKR {booking.amount.toLocaleString()}</span>
                          </div>
                          <div className="mt-1 flex justify-between text-sm">
                            <span className="text-muted-foreground">Provider</span>
                            <span className="text-foreground">{booking.provider_business}</span>
                          </div>
                          {booking.payment_type === "balance" && booking.location_address && (
                            <p className="mt-3 flex items-start gap-1 text-xs text-muted-foreground">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                              Shoot location: {booking.location_address}
                            </p>
                          )}
                        </div>
                        {booking.payment_type === "balance" ? (
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handlePayment(booking.id, booking.payment_type)}
                              disabled={isProcessing}
                              className="w-full bg-primary text-primary-foreground"
                            >
                              {isProcessing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CreditCard className="mr-2 h-4 w-4" />
                              )}
                              Pay online (Stripe)
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleScheduleInPerson(booking)}
                              disabled={isProcessing}
                              className="w-full"
                            >
                              {isProcessing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Banknote className="mr-2 h-4 w-4" />
                              )}
                              Pay at shoot location
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                              Choose online payment now, or pay cash to your provider on site. They will confirm receipt.
                            </p>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handlePayment(booking.id, booking.payment_type)}
                            disabled={isProcessing}
                            className="w-full bg-primary text-primary-foreground"
                          >
                            {isProcessing ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            {isProcessing
                              ? "Processing..."
                              : sandboxMode
                                ? `Pay (Sandbox) LKR ${booking.amount.toLocaleString()}`
                                : `Pay LKR ${booking.amount.toLocaleString()}`}
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
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
        <p className="text-muted-foreground">
          Pay 50% deposit when you book. After your shoot, pay the balance online or in person at the shoot location.
        </p>
      </div>

      {sandboxMode && (
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <FlaskConical className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-foreground">Payment sandbox</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Test mode is on — no real charges. Use Pay (Sandbox) to simulate payments without Stripe.
          </AlertDescription>
        </Alert>
      )}

      <PaymentDueCard
        items={depositDue}
        title="Deposit due"
        accent="border-primary/20 bg-primary/5"
      />
      <PaymentDueCard
        items={balanceDue}
        title="Balance due (after shoot)"
        accent="border-emerald-500/20 bg-emerald-500/5"
      />

      {inPersonScheduled.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Pay at shoot — scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {inPersonScheduled.map((booking) => (
                <div
                  key={`in-person-${booking.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{booking.provider_business}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.date}
                      {booking.service_time ? ` · ${booking.service_time}` : ""} · Pay on site
                    </p>
                    {booking.location_address && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {booking.location_address}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-foreground">LKR {booking.amount.toLocaleString()}</span>
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
                      {(isBalancePayment(payment) ? "Balance" : "Deposit")} ·{" "}
                      {(payment.method || "payment").replace("_", " ")} · {payment.transaction_ref}
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
                              <span className="text-muted-foreground">Type</span>
                              <span className="text-foreground">
                                {isBalancePayment(payment) ? "Balance" : "Deposit"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Reference</span>
                              <span className="font-mono text-foreground">{payment.transaction_ref}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="font-bold text-foreground">LKR {payment.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status</span>
                              <StatusBadge status={payment.status} />
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
