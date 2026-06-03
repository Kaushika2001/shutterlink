"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, CheckCircle2, Loader2, Clock, Camera } from "lucide-react"
import { getServicePackageById } from "@/services/packages"
import { createBooking } from "@/services/bookings"
import type { PackageWithProvider } from "@/services/packages"
import { toast } from "sonner"

export default function BookPackagePage({ params }: { params: Promise<{ providerId: string; packageId: string }> }) {
  const { providerId, packageId } = use(params)
  const router = useRouter()
  const [pkg, setPkg] = useState<PackageWithProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)

  const [serviceDate, setServiceDate] = useState("")
  const [serviceTime, setServiceTime] = useState("")
  const [durationHours, setDurationHours] = useState(1)
  const [locationType, setLocationType] = useState<string>("on_site")
  const [locationAddress, setLocationAddress] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")

  useEffect(() => {
    async function loadPackage() {
      try {
        const data = await getServicePackageById(packageId)
        if (!data || data.provider_id !== providerId) {
          toast.error("Package not found")
          return
        }
        setPkg(data)
      } catch (error: any) {
        console.error('Failed to load package:', error)
        toast.error('Failed to load package details')
      } finally {
        setLoading(false)
      }
    }
    loadPackage()
  }, [packageId, providerId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!serviceDate || !serviceTime || !locationAddress) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!pkg) return
    setIsSubmitting(true)
    try {
      const booking = await createBooking({
        provider_id: pkg.provider?.user_id || providerId,
        package_id: packageId,
        service_date: serviceDate,
        service_time: serviceTime,
        duration_hours: durationHours,
        location_type: locationType as 'on_site' | 'studio' | 'remote',
        location_address: locationAddress,
        special_requests: specialRequests || undefined,
        total_price: 0,
      })
      setBookingResult(booking)
      setSubmitted(true)
      toast.success("Booking submitted successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-48 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Camera className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Package not found</h2>
        <Link href="/explore" className="mt-4 text-sm text-primary hover:underline">Back to Explore</Link>
      </div>
    )
  }

  if (submitted && bookingResult) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Your booking for <strong className="text-foreground">{pkg.name}</strong> on{" "}
            <strong className="text-foreground">{serviceDate}</strong> has been submitted.
          </p>
          <div className="mt-8 flex gap-3">
            <Button className="bg-primary text-primary-foreground" asChild>
              <Link href="/dashboard/bookings">View Bookings</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/payments`}>Proceed to Payment</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const provider = pkg.provider

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/provider-profile/${providerId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to provider
      </Link>

      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-card-foreground">{pkg.name}</CardTitle>
          <p className="text-sm text-muted-foreground">by {provider?.business_name || "Provider"}</p>
        </CardHeader>
        <CardContent>
          <p className="mb-4 leading-relaxed text-muted-foreground">{pkg.description}</p>
          <div className="flex flex-wrap gap-4 rounded-lg bg-muted/50 p-4 text-sm">
            <div>
              <span className="text-muted-foreground">Price</span>
              <p className="font-semibold text-foreground">LKR {pkg.price.toLocaleString()}</p>
            </div>
            {pkg.duration_hours && (
              <div>
                <span className="text-muted-foreground">Duration</span>
                <p className="font-semibold text-foreground">{pkg.duration_hours}h</p>
              </div>
            )}
            {pkg.turnaround_days && (
              <div>
                <span className="text-muted-foreground">Turnaround</span>
                <p className="font-semibold text-foreground">{pkg.turnaround_days} days</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-card-foreground">Book This Package</CardTitle>
          <p className="text-sm text-muted-foreground">Fill in the details to submit your booking request</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date" className="text-foreground">Service Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="time" className="text-foreground">Service Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={serviceTime}
                  onChange={(e) => setServiceTime(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="duration" className="text-foreground">
                <Clock className="mr-1 inline h-4 w-4" /> Duration (hours) *
              </Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={24}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                required
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Location Type *</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_site">On Site</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="address" className="text-foreground">Location Address *</Label>
              <Input
                id="address"
                placeholder="Enter the service address"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="requests" className="text-foreground">Special Requests</Label>
              <Textarea
                id="requests"
                placeholder="Any special requirements or instructions..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={4}
                className="bg-background"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Booking Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
