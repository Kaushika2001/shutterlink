"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { syncPaymentStatus } from "@/services/payments"
import { toast } from "sonner"

function ReturnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get("payment_id")
  const stripeSessionId = searchParams.get("session_id")
  const gateway = searchParams.get("gateway")
  const status = searchParams.get("status")
  const [state, setState] = useState<"loading" | "success" | "failed" | "pending">("loading")

  useEffect(() => {
    if (!paymentId) {
      setState("failed")
      return
    }

    if (status === "cancel") {
      setState("failed")
      toast.error("Payment was cancelled")
      return
    }

    async function sync() {
      try {
        const payment = await syncPaymentStatus(paymentId!, stripeSessionId)
        if (payment.status === "completed") {
          setState("success")
          toast.success("Payment confirmed! Your booking is active.")
        } else {
          setState("pending")
        }
      } catch {
        setState("pending")
      }
    }

    sync()
  }, [paymentId, stripeSessionId, status])

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      {state === "loading" && (
        <>
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Confirming your {gateway || "gateway"} payment...</p>
        </>
      )}
      {state === "success" && (
        <>
          <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-600" />
          <h1 className="text-2xl font-bold">Payment successful</h1>
          <p className="mt-2 text-muted-foreground">Your booking is confirmed per SRS payment rules.</p>
        </>
      )}
      {state === "pending" && (
        <>
          <Loader2 className="mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Payment processing</h1>
          <p className="mt-2 text-muted-foreground">
            We are waiting for confirmation from the payment gateway. Refresh in a moment or check Payments.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => paymentId && syncPaymentStatus(paymentId, stripeSessionId).then(() => router.refresh())}>
            Check again
          </Button>
        </>
      )}
      {state === "failed" && (
        <>
          <XCircle className="mb-4 h-14 w-14 text-destructive" />
          <h1 className="text-2xl font-bold">Payment not completed</h1>
          <p className="mt-2 text-muted-foreground">You can try again from the payments page.</p>
        </>
      )}
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/dashboard/payments">Payments</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/bookings">My bookings</Link>
        </Button>
      </div>
    </div>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ReturnContent />
    </Suspense>
  )
}
