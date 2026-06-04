"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { getBookingById } from "@/services/bookings"
import { getUserPayments } from "@/services/payments"
import type { Booking } from "@/services/bookings"
import type { Payment } from "@/services/payments"
import { categoryLabels } from "@/lib/constants"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  User,
  Briefcase,
  CreditCard,
  ArrowLeft,
  Download,
  Printer,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationHours * 60
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
}

interface MappedBooking {
  id: string
  customer_name: string
  customer_email: string
  provider_business: string
  provider_name: string
  date: string
  start_time: string
  end_time: string
  location: string
  notes: string
  service_category: string
  status: string
  total_amount: number
}

export default function BookingConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { ready, isAuthenticated } = useAuthReady()
  const [booking, setBooking] = useState<MappedBooking | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return

    async function load() {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        const [apiBooking, allPayments] = await Promise.all([getBookingById(id), getUserPayments()])
        const mapped: MappedBooking = {
          id: apiBooking.id,
          customer_name: apiBooking.customer_name ?? "",
          customer_email: "",
          provider_business: apiBooking.provider_business_name ?? "",
          provider_name: apiBooking.provider_name ?? "",
          date: apiBooking.service_date,
          start_time: apiBooking.service_time,
          end_time: calculateEndTime(apiBooking.service_time, apiBooking.duration_hours),
          location: apiBooking.location_address ?? apiBooking.location_type ?? "",
          notes: apiBooking.special_requests ?? "",
          service_category: apiBooking.package_name ?? "",
          status: apiBooking.status,
          total_amount: apiBooking.total_price,
        }
        const matchingPayment = allPayments.find((p) => p.booking_id === id) ?? null
        setBooking(mapped)
        setPayment(matchingPayment)
      } catch (err: any) {
        toast.error(err.message || "Failed to load booking")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, ready, isAuthenticated])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold text-foreground">Booking not found</h2>
        <Link href="/dashboard/bookings" className="mt-4 text-sm text-primary hover:underline">
          Back to Bookings
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Link
        href="/dashboard/bookings"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </Link>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6 sm:p-8">
          {/* Success Header */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Booking Confirmed</h1>
            <p className="mt-1 text-muted-foreground">
              Booking <span className="font-mono font-medium text-foreground">{booking.id.toUpperCase()}</span> has been confirmed
            </p>
          </div>

          <Separator className="my-6" />

          {/* Booking Details */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Booking Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium text-foreground">{booking.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="text-sm font-medium text-foreground">{booking.provider_business}</p>
                  <p className="text-xs text-muted-foreground">{booking.provider_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium text-foreground">
                    {booking.start_time} - {booking.end_time}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium text-foreground">{booking.location}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">
                  {categoryLabels[booking.service_category] || booking.service_category}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={booking.status} />
              </div>
            </div>
            {booking.notes && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm text-foreground">{booking.notes}</p>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Payment Summary */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Payment Summary
            </h2>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-foreground">
                  LKR {booking.total_amount.toLocaleString()}
                </span>
                {payment ? (
                  <StatusBadge status={payment.status} />
                ) : (
                  <StatusBadge status="pending" />
                )}
              </div>
              {payment && (
                <div className="mt-3 flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction Ref</span>
                    <span className="font-mono text-foreground">{payment.transaction_id ?? payment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="text-foreground capitalize">
                      {payment.payment_method.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{payment.created_at}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Receipt downloaded")}
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Download Receipt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Opening print dialog...")}
              >
                <Printer className="mr-2 h-3.5 w-3.5" />
                Print
              </Button>
            </div>
            {!payment && (
              <Button size="sm" className="bg-primary text-primary-foreground" asChild>
                <Link href="/dashboard/payments">
                  <CreditCard className="mr-2 h-3.5 w-3.5" />
                  Make Payment
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
