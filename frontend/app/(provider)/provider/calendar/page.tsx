"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getProviderProfile } from "@/services/provider"
import {
  getProviderAvailability,
  setAvailabilitySchedules,
  updateAvailabilitySchedule,
} from "@/services/availability"
import type { AvailabilitySchedule, CreateAvailabilitySchedule } from "@/services/availability"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { AvailabilitySlot } from "@/types"
import { CalendarDays, Plus, Trash2, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function ProviderCalendarPage() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<AvailabilitySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [newStartTime, setNewStartTime] = useState("09:00")
  const [newEndTime, setNewEndTime] = useState("17:00")

  useEffect(() => {
    if (!user) return

    const init = async () => {
      try {
        const profile = await getProviderProfile(user.id)
        if (!profile) {
          toast.error("Provider profile not found")
          setLoading(false)
          return
        }
        setProviderProfileId(profile.id)
        const data = await getProviderAvailability(profile.id)
        setSchedules(data)
      } catch (err) {
        toast.error("Failed to load availability")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user])

  const slots: AvailabilitySlot[] = schedules.map((s) => ({
    id: s.id,
    provider_id: s.provider_id,
    date: DAY_NAMES[s.day_of_week],
    start_time: s.start_time,
    end_time: s.end_time,
    is_available: s.is_active,
  }))

  async function addSlot() {
    if (!newDate || !providerProfileId) {
      toast.error("Please select a date")
      return
    }
    const dayOfWeek = new Date(newDate).getDay()

    if (schedules.some((s) => s.day_of_week === dayOfWeek)) {
      toast.error("A slot already exists for this day of the week")
      return
    }

    const updated: CreateAvailabilitySchedule[] = [
      ...schedules.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
      })),
      {
        day_of_week: dayOfWeek,
        start_time: newStartTime,
        end_time: newEndTime,
        is_active: true,
      },
    ]

    try {
      const result = await setAvailabilitySchedules(providerProfileId, updated)
      setSchedules(result)
      setNewDate("")
      toast.success("Availability slot added")
    } catch {
      toast.error("Failed to add slot")
    }
  }

  async function removeSlot(id: string) {
    if (!providerProfileId) return
    const updated = schedules
      .filter((s) => s.id !== id)
      .map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
      }))

    try {
      const result = await setAvailabilitySchedules(providerProfileId, updated)
      setSchedules(result)
      toast.success("Slot removed")
    } catch {
      toast.error("Failed to remove slot")
    }
  }

  async function toggleSlot(id: string) {
    const schedule = schedules.find((s) => s.id === id)
    if (!schedule) return

    try {
      const updated = await updateAvailabilitySchedule(id, { is_active: !schedule.is_active })
      setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: updated.is_active } : s)))
    } catch {
      toast.error("Failed to update slot")
    }
  }

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
        <h1 className="text-2xl font-bold text-foreground">Availability Calendar</h1>
        <p className="text-muted-foreground">Manage your available dates and time slots</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Plus className="h-4 w-4 text-primary" /> Add Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Date</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Start Time</Label>
              <Input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">End Time</Label>
              <Input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button onClick={addSlot} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Slot
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <CalendarDays className="h-4 w-4 text-primary" /> Your Availability ({slots.length} slots)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length > 0 ? (
            <div className="flex flex-col gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-2.5 w-2.5 rounded-full ${slot.is_available ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                    <div>
                      <p className="font-medium text-foreground">{slot.date}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" /> {slot.start_time} - {slot.end_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {slot.is_available ? "Available" : "Unavailable"}
                      </span>
                      <Switch
                        checked={slot.is_available}
                        onCheckedChange={() => toggleSlot(slot.id)}
                        aria-label={`Toggle availability for ${slot.date}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeSlot(slot.id)}
                      aria-label={`Remove slot for ${slot.date}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No availability slots. Add some dates to let customers book your services.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
