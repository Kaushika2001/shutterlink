"use client"

import { useAuth } from "@/context/auth-context"
import type { UserRole } from "@/types"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
    if (!isLoading && isAuthenticated && user && !allowedRoles.includes(user.role)) {
      const redirectMap: Record<UserRole, string> = {
        customer: "/dashboard",
        provider: "/provider",
        admin: "/admin",
      }
      router.replace(redirectMap[user.role])
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return <LoadingSkeleton />
  }

  return <>{children}</>
}
