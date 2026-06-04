"use client"

import { useEffect, useState } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { getUserNotifications, markNotificationAsRead, markAllAsRead } from "@/services/notifications"
import type { Notification } from "@/services/notifications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Bell } from "lucide-react"
import { toast } from "sonner"

export default function CustomerNotificationsPage() {
  const { ready, isAuthenticated } = useAuthReady()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    void load()
  }, [ready, isAuthenticated])

  async function load() {
    if (!isAuthenticated) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setItems(await getUserNotifications())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load notifications")
      setItems([])
    } finally {
      setLoading(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Booking, payment, and message updates</p>
        </div>
        {items.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={async () => {
            await markAllAsRead()
            await load()
          }}>
            Mark all read
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <Bell className="mb-3 h-10 w-10 opacity-40" />
            No notifications yet
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className={n.is_read ? "opacity-80" : "border-primary/30 bg-primary/5"}
              onClick={async () => {
                if (!n.is_read) {
                  await markNotificationAsRead(n.id)
                  setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
                }
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{n.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
