"use client"

import { useEffect, useState } from "react"
import {
  getPublicProviderAvailability,
  type AvailabilitySchedule,
  type BlockedDate,
} from "@/services/availability"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Clock, Ban } from "lucide-react"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  available: { label: "Available", className: "text-green-600" },
  busy: { label: "Busy", className: "text-yellow-600" },
  unavailable: { label: "Unavailable", className: "text-red-600" },
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`
}

function sortSchedules(schedules: AvailabilitySchedule[]): AvailabilitySchedule[] {
  return [...schedules].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
    return a.start_time.localeCompare(b.start_time)
  })
}

function upcomingBlocked(dates: BlockedDate[]): BlockedDate[] {
  const today = new Date().toISOString().slice(0, 10)
  return dates
    .filter((d) => d.blocked_date >= today)
    .sort((a, b) => a.blocked_date.localeCompare(b.blocked_date))
    .slice(0, 8)
}

export type ProviderPublicAvailabilityProps = {
  providerId: string
  availabilityStatus?: "available" | "busy" | "unavailable" | string
  responseTimeHours?: number | null
  compact?: boolean
}

export function ProviderPublicAvailability({
  providerId,
  availabilityStatus = "available",
  responseTimeHours,
  compact = false,
}: ProviderPublicAvailabilityProps) {
  const [schedules, setSchedules] = useState<AvailabilitySchedule[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await getPublicProviderAvailability(providerId)
        if (!cancelled) {
          setSchedules(data.schedules)
          setBlockedDates(data.blockedDates)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [providerId])

  const status = STATUS_LABELS[availabilityStatus] || STATUS_LABELS.available
  const activeSchedules = sortSchedules(schedules.filter((s) => s.is_active))
  const blocked = upcomingBlocked(blockedDates)

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 px-3 py-2">
        <span className={`text-sm font-medium ${status.className}`}>● {status.label}</span>
        {responseTimeHours != null && responseTimeHours > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Typical response within {responseTimeHours}h
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Weekly hours
        </p>
        {activeSchedules.length > 0 ? (
          <ul className={`flex flex-col gap-2 ${compact ? "" : "gap-2.5"}`}>
            {activeSchedules.map((slot) => (
              <li
                key={slot.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-background/50 px-2.5 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{DAY_NAMES[slot.day_of_week]}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No weekly hours published yet. Contact the provider to confirm availability.
          </p>
        )}
      </div>

      {!compact && blocked.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Ban className="h-3.5 w-3.5" /> Unavailable dates
          </p>
          <ul className="flex flex-col gap-1.5">
            {blocked.map((d) => (
              <li
                key={d.id}
                className="rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5 text-sm text-muted-foreground"
              >
                {new Date(`${d.blocked_date}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {d.reason ? ` — ${d.reason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {compact && blocked.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {blocked.length} upcoming blocked date{blocked.length === 1 ? "" : "s"} — see Availability tab
        </p>
      )}
    </div>
  )
}
