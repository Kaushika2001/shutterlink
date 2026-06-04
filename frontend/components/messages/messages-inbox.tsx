"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import {
  getConversations,
  getBookingMessages,
  sendMessage,
  markBookingMessagesAsRead,
  type Conversation,
  type Message,
} from "@/services/messaging"
import { getCustomerBookings, getProviderBookings, type Booking } from "@/services/bookings"
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MessageSquare, Send, Wifi } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MIGRATION_HINT =
  "Run backend/supabase/migrations/018_ensure_messages_and_notifications.sql in Supabase SQL Editor, then log out and log in again for live chat."

function mergeMessages(list: Message[], incoming: Message): Message[] {
  if (list.some((m) => m.id === incoming.id)) return list
  return [...list, incoming].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

type MessagesInboxProps = {
  isProvider?: boolean
}

export function MessagesInbox({ isProvider = false }: MessagesInboxProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const bookingFromUrl = searchParams.get("booking")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [liveEnabled, setLiveEnabled] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      setSetupError(null)
      try {
        const bookingList = isProvider
          ? await getProviderBookings()
          : await getCustomerBookings()
        setBookings(bookingList.filter((b) => b.status !== "cancelled"))

        let convos: Conversation[] = []
        try {
          convos = await getConversations()
          setConversations(convos)
        } catch (convErr: unknown) {
          const msg = convErr instanceof Error ? convErr.message : ""
          if (msg.includes("not set up") || msg.includes("migration")) {
            setSetupError(msg)
          }
          setConversations([])
        }

        if (bookingFromUrl) {
          setSelectedBookingId(bookingFromUrl)
        } else if (convos.length > 0) {
          setSelectedBookingId(convos[0].booking_id)
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load messages")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [bookingFromUrl, isProvider])

  const reloadMessages = useCallback(async () => {
    if (!selectedBookingId) return
    try {
      const data = await getBookingMessages(selectedBookingId)
      setMessages(data)
      await markBookingMessagesAsRead(selectedBookingId)
      setConversations((prev) =>
        prev.map((c) =>
          c.booking_id === selectedBookingId ? { ...c, unread_count: 0 } : c
        )
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load conversation"
      if (msg.includes("not set up") || msg.includes("migration")) {
        setSetupError(msg)
      } else {
        toast.error(msg)
      }
    }
  }, [selectedBookingId])

  useEffect(() => {
    if (!selectedBookingId || !user) return

    async function loadMessages() {
      setLoadingMessages(true)
      await reloadMessages()
      setLoadingMessages(false)
      setLiveEnabled(true)
    }

    void loadMessages()
  }, [selectedBookingId, user, reloadMessages])

  const handleIncoming = useCallback(
    (msg: Message) => {
      setMessages((prev) => mergeMessages(prev, msg))
      if (msg.recipient_id === user?.id && selectedBookingId) {
        void markBookingMessagesAsRead(selectedBookingId)
      }
      setConversations((prev) => {
        const otherId =
          msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id
        const existing = prev.find((c) => c.booking_id === msg.booking_id)
        const unread =
          msg.recipient_id === user?.id && !msg.is_read
            ? (existing?.unread_count || 0) + 1
            : existing?.unread_count || 0
        const next = {
          booking_id: msg.booking_id,
          other_user_id: otherId,
          other_user_name: existing?.other_user_name ?? null,
          last_message: msg.message,
          last_message_time: msg.created_at,
          unread_count: msg.booking_id === selectedBookingId ? 0 : unread,
        }
        const rest = prev.filter((c) => c.booking_id !== msg.booking_id)
        return [next, ...rest]
      })
    },
    [user?.id, selectedBookingId]
  )

  useRealtimeMessages({
    bookingId: selectedBookingId,
    userId: user?.id,
    enabled: liveEnabled && !setupError,
    onIncomingMessage: handleIncoming,
    onPoll: reloadMessages,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId)
  const selectedConvo = conversations.find((c) => c.booking_id === selectedBookingId)

  const recipientId =
    selectedBooking && user
      ? user.id === selectedBooking.customer_id
        ? selectedBooking.provider_id
        : selectedBooking.customer_id
      : selectedConvo?.other_user_id

  const displayName = isProvider
    ? selectedBooking?.customer_name || selectedConvo?.other_user_name || "Customer"
    : selectedBooking?.provider_business_name ||
      selectedConvo?.other_user_name ||
      "Provider"

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedBookingId || !recipientId) return

    setSending(true)
    try {
      const msg = await sendMessage({
        booking_id: selectedBookingId,
        recipient_id: recipientId,
        message: newMessage.trim(),
      })
      setMessages((prev) => mergeMessages(prev, msg))
      setNewMessage("")
      const convos = await getConversations()
      setConversations(convos)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message"
      if (msg.includes("not set up") || msg.includes("migration")) {
        setSetupError(msg)
      }
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            {isProvider
              ? "Chat with customers about bookings"
              : "Conversations with providers about your bookings"}
          </p>
        </div>
        {!setupError && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Wifi className="h-3 w-3" />
            Live updates on
          </span>
        )}
      </div>

      {setupError && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground">Messaging database not ready</p>
            <p className="mt-1 text-muted-foreground">{setupError}</p>
            <p className="mt-2 text-muted-foreground">{MIGRATION_HINT}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border lg:col-span-1">
          <CardContent className="p-0">
            <div className="border-b border-border p-3 text-sm font-medium">Conversations</div>
            {conversations.length === 0 && bookings.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                {conversations.map((c) => (
                  <button
                    key={c.booking_id}
                    type="button"
                    onClick={() => setSelectedBookingId(c.booking_id)}
                    className={cn(
                      "w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      selectedBookingId === c.booking_id && "bg-primary/5"
                    )}
                  >
                    <p className="font-medium text-foreground">{c.other_user_name || (isProvider ? "Customer" : "Provider")}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{c.last_message}</p>
                    {c.unread_count > 0 && (
                      <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                        {c.unread_count} new
                      </span>
                    )}
                  </button>
                ))}
                {bookings
                  .filter((b) => !conversations.some((c) => c.booking_id === b.id))
                  .map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBookingId(b.id)}
                      className={cn(
                        "w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        selectedBookingId === b.id && "bg-primary/5"
                      )}
                    >
                      <p className="font-medium text-foreground">
                        {isProvider
                          ? b.customer_name || "Customer"
                          : b.provider_business_name || "Provider"}
                      </p>
                      <p className="text-xs text-muted-foreground">Start conversation</p>
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border lg:col-span-2">
          <CardContent className="flex min-h-[420px] flex-col p-0">
            {!selectedBookingId ? (
              <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="mb-3 h-10 w-10 opacity-40" />
                Select a booking to view messages
              </div>
            ) : (
              <>
                <div className="border-b border-border px-4 py-3">
                  <p className="font-medium">{displayName}</p>
                  {selectedBooking?.booking_number && (
                    <p className="text-xs text-muted-foreground">Booking {selectedBooking.booking_number}</p>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No messages yet. Say hello.
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex", isMine ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                              isMine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            )}
                          >
                            <p>{msg.message}</p>
                            <p
                              className={cn(
                                "mt-1 text-[10px]",
                                isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="flex gap-2 border-t border-border p-4"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={!recipientId || sending || !!setupError}
                    className="bg-background"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !newMessage.trim() || !!setupError}
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
