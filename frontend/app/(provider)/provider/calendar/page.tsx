"use client"

import { useState, useEffect } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import {
  getMyAvailability,
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
  const { user, ready, isAuthenticated } = useAuthReady()
  const [schedules, setSchedules] = useState<AvailabilitySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [providerKey, setProviderKey] = useState<string | null>(null)
  const [tablesMissing, setTablesMissing] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [newStartTime, setNewStartTime] = useState("09:00")
  const [newEndTime, setNewEndTime] = useState("17:00")

  useEffect(() => {
    if (!ready || !isAuthenticated || !user) {
      if (ready) setLoading(false)
      return
    }

    const init = async () => {
      try {
        setProviderKey(user.id)
        const data = await getMyAvailability()
        setSchedules(data)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ""
        if (
          msg.includes("not set up") ||
          msg.includes("migration") ||
          msg.includes("RUN_AVAILABILITY") ||
          msg.includes("Availability tables")
        ) {
          setTablesMissing(true)
          setSchedules([])
        } else {
          toast.error(msg || "Failed to load availability")
        }
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [user, ready, isAuthenticated])

  const slots: AvailabilitySlot[] = schedules.map((s) => ({
    id: s.id,
    provider_id: s.provider_id,
    date: DAY_NAMES[s.day_of_week],
    start_time: s.start_time,
    end_time: s.end_time,
    is_available: s.is_active,
  }))

  async function addSlot() {
    if (!newDate || !providerKey) {
      toast.error("Please select a date")
      return
    }
    const dayOfWeek = new Date(`${newDate}T12:00:00`).getDay()

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
      const saved = await setAvailabilitySchedules(null, updated)
      setSchedules(saved)
      setNewDate("")
      toast.success("Availability updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save availability")
    }
  }

  async function removeSlot(slotId: string) {
    if (!providerKey) return
    const updated = schedules
      .filter((s) => s.id !== slotId)
      .map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
      }))

    try {
      const saved = await setAvailabilitySchedules(null, updated)
      setSchedules(saved)
      toast.success("Slot removed")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update availability")
    }
  }

  async function toggleSlot(slotId: string, isAvailable: boolean) {
    try {
      await updateAvailabilitySchedule(slotId, { is_active: isAvailable })
      setSchedules((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, is_active: isAvailable } : s))
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update slot")
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
        <p className="text-muted-foreground">Set your weekly hours so customers can book you</p>
      </div>

      {tablesMissing && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">Availability tables not found</p>
            <p className="mt-1 text-muted-foreground">
              Open Supabase → SQL Editor, paste and run{" "}
              <code className="text-xs">backend/supabase/RUN_AVAILABILITY_SETUP.sql</code>, then refresh this page.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Add weekly slot
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-2">
            <Label>Pick any date (uses day of week)</Label>
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-44" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Start</Label>
            <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-32" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>End</Label>
            <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="w-32" />
          </div>
          <Button onClick={addSlot} disabled={tablesMissing} className="bg-primary text-primary-foreground">
            Add slot
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" /> Weekly schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length > 0 ? (
            <div className="flex flex-col gap-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{slot.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {slot.start_time} – {slot.end_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={slot.is_available}
                        onCheckedChange={(checked) => toggleSlot(slot.id, checked)}
                        aria-label={`Toggle availability for ${slot.date}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {slot.is_available ? "Active" : "Off"}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No availability slots. Add your working days and hours above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
