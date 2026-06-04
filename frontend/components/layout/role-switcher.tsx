"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Users, User, Camera, Shield } from "lucide-react"
import type { UserRole } from "@/types"

const roles: { role: UserRole; label: string; icon: React.ReactNode; redirect: string }[] = [
  { role: "customer", label: "Customer", icon: <User className="h-4 w-4" />, redirect: "/dashboard" },
  { role: "provider", label: "Provider", icon: <Camera className="h-4 w-4" />, redirect: "/provider" },
  { role: "admin", label: "Admin", icon: <Shield className="h-4 w-4" />, redirect: "/admin" },
]

export function RoleSwitcher() {
  const { user, switchRole } = useAuth()
  const router = useRouter()

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development' || !switchRole) {
    return null
  }

  function handleSwitch(role: UserRole, redirect: string) {
    if (switchRole) {
      switchRole(role)
      router.push(redirect)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="gap-2 rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">
              {user ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : "Demo"}
            </span>
          </Button>
        </DropdownMenuTrigger>
      </DropdownMenu>
    </div>
  )
}
