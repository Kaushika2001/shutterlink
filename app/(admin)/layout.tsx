"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import {
  LayoutDashboard,
  Users,
  Camera,
  BookOpen,
  CreditCard,
  BarChart3,
} from "lucide-react"

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/providers", label: "Providers", icon: <Camera className="h-4 w-4" /> },
  { href: "/admin/bookings", label: "Bookings", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/admin/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/admin/reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar links={adminLinks} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
