"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { LayoutDashboard, CalendarDays, Image, BookOpen, CreditCard, Star, Package, User } from "lucide-react"

const providerLinks = [
  { href: "/provider", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/provider/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { href: "/provider/bookings", label: "Bookings", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/provider/packages", label: "Packages", icon: <Package className="h-4 w-4" /> },
  { href: "/provider/calendar", label: "Availability", icon: <CalendarDays className="h-4 w-4" /> },
  { href: "/provider/portfolio", label: "Portfolio", icon: <Image className="h-4 w-4" /> },
  { href: "/provider/earnings", label: "Earnings", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/provider/reviews", label: "Reviews", icon: <Star className="h-4 w-4" /> },
]

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute allowedRoles={["provider"]}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar links={providerLinks} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
