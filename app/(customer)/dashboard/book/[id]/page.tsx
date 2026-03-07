"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { mockProviders, categoryLabels } from "@/data/mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function BookProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const provider = mockProviders.find((p) => p.id === id)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold text-foreground">Provider not found</h2>
        <Link href="/explore" className="mt-4 text-sm text-primary hover:underline">Back to Explore</Link>
      </div>
    )
  }

  const availableDates = provider.availability.filter((s) => s.is_available)
  const selectedSlot = availableDates.find((s) => s.date === selectedDate)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedCategory || !location) {
      toast.error("Please fill in all required fields")
      return
    }
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 1200))
    setIsSubmitting(false)
    setSubmitted(true)
    toast.success("Booking request submitted!")
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Your booking request with <strong className="text-foreground">{provider.business_name}</strong> for{" "}
          <strong className="text-foreground">{selectedDate}</strong> has been submitted. You will receive a confirmation soon.
        </p>
        <div className="mt-8 flex gap-3">
          <Button className="bg-primary text-primary-foreground" asChild>
            <Link href="/dashboard/bookings">View Bookings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/payments">Proceed to Payment</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/provider-profile/${provider.id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {provider.business_name}
      </Link>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-card-foreground">Book {provider.business_name}</CardTitle>
          <p className="text-sm text-muted-foreground">Fill in the details to submit your booking request</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium text-foreground">{provider.name}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Price Range</span>
                <span className="font-medium text-foreground">
                  LKR {provider.price_range.min.toLocaleString()} - {provider.price_range.max.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Service Category *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select a service" /></SelectTrigger>
                <SelectContent>
                  {provider.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">
                <CalendarDays className="mr-1 inline h-4 w-4" /> Select Available Date *
              </Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Choose a date" /></SelectTrigger>
                <SelectContent>
                  {availableDates.map((slot) => (
                    <SelectItem key={slot.id} value={slot.date}>
                      {slot.date} ({slot.start_time} - {slot.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSlot && (
                <p className="text-xs text-muted-foreground">
                  Available: {selectedSlot.start_time} - {selectedSlot.end_time}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location" className="text-foreground">Location *</Label>
              <Input
                id="location"
                placeholder="Enter the event or service location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes" className="text-foreground">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="bg-background"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Booking Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
