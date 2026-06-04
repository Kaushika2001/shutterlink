"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { LayoutDashboard, CalendarDays, Clock, CreditCard, Star, Bell, MessageSquare } from "lucide-react"

const customerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/dashboard/bookings", label: "My Bookings", icon: <CalendarDays className="h-4 w-4" /> },
  { href: "/dashboard/history", label: "History", icon: <Clock className="h-4 w-4" /> },
  { href: "/dashboard/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/dashboard/messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  { href: "/dashboard/notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { href: "/dashboard/reviews", label: "My Reviews", icon: <Star className="h-4 w-4" /> },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar links={customerLinks} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
