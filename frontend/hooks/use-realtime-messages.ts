"use client"

import { useEffect, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import type { Message } from "@/services/messaging"

const POLL_MS = 4000

type Options = {
  bookingId: string | null
  userId: string | undefined
  enabled: boolean
  onIncomingMessage: (message: Message) => void
  onPoll: () => void
}

export function useRealtimeMessages({
  bookingId,
  userId,
  enabled,
  onIncomingMessage,
  onPoll,
}: Options) {
  const onIncomingRef = useRef(onIncomingMessage)
  const onPollRef = useRef(onPoll)
  onIncomingRef.current = onIncomingMessage
  onPollRef.current = onPoll

  useEffect(() => {
    if (!enabled || !bookingId || !userId) return

    let cancelled = false
    let channel: RealtimeChannel | null = null
    const pollTimer = setInterval(() => {
      if (!cancelled) onPollRef.current()
    }, POLL_MS)

    void (async () => {
      const supabase = await getSupabaseClient()
      if (cancelled || !supabase) return

      channel = supabase
        .channel(`messages:${bookingId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `booking_id=eq.${bookingId}`,
          },
          (payload) => {
            onIncomingRef.current(payload.new as Message)
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `booking_id=eq.${bookingId}`,
          },
          () => onPollRef.current()
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      clearInterval(pollTimer)
      void (async () => {
        const supabase = await getSupabaseClient()
        if (channel && supabase) {
          await supabase.removeChannel(channel)
        }
      })()
    }
  }, [bookingId, userId, enabled])
}
