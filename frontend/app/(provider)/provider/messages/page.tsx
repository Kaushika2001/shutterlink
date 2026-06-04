"use client"

import { Suspense } from "react"
import { MessagesInbox } from "@/components/messages/messages-inbox"
import { Loader2 } from "lucide-react"

export default function ProviderMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MessagesInbox isProvider />
    </Suspense>
  )
}
