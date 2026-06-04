"use client"

import { Suspense, useEffect, useState, useRef } from "react"
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
import { getCustomerBookings, type Booking } from "@/services/bookings"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function CustomerMessagesContent() {
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const bookingList = await getCustomerBookings()
        setBookings(bookingList.filter((b) => b.status !== "cancelled"))

        try {
          setConversations(await getConversations())
        } catch (convErr: any) {
          setConversations([])
          if (convErr?.message?.includes("not set up") || convErr?.message?.includes("migration")) {
            toast.error(convErr.message)
          }
        }
        if (bookingFromUrl) {
          setSelectedBookingId(bookingFromUrl)
        } else if (convos.length > 0) {
          setSelectedBookingId(convos[0].booking_id)
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load messages")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookingFromUrl])

  useEffect(() => {
    if (!selectedBookingId || !user) return

    async function loadMessages() {
      setLoadingMessages(true)
      try {
        const data = await getBookingMessages(selectedBookingId)
        setMessages(data)
        await markBookingMessagesAsRead(selectedBookingId)
      } catch (err: any) {
        toast.error(err.message || "Failed to load conversation")
      } finally {
        setLoadingMessages(false)
      }
    }

    loadMessages()
  }, [selectedBookingId, user])

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
      setMessages((prev) => [...prev, msg])
      setNewMessage("")
      const convos = await getConversations()
      setConversations(convos)
    } catch (err: any) {
      toast.error(err.message || "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  function startConversationFromBooking(booking: Booking) {
    setSelectedBookingId(booking.id)
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
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Conversations with providers about your bookings</p>
      </div>

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
                    <p className="font-medium text-foreground">{c.other_user_name || "Provider"}</p>
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
                      onClick={() => startConversationFromBooking(b)}
                      className={cn(
                        "w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        selectedBookingId === b.id && "bg-primary/5"
                      )}
                    >
                      <p className="font-medium text-foreground">
                        {b.provider_business_name || "Provider"}
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
                  <p className="font-medium">
                    {selectedBooking?.provider_business_name ||
                      selectedConvo?.other_user_name ||
                      "Provider"}
                  </p>
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
                      No messages yet. Say hello to your provider.
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

                <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={!recipientId || sending}
                    className="bg-background"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
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

export default function CustomerMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CustomerMessagesContent />
    </Suspense>
  )
}
