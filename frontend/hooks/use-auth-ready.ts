"use client"

import { useAuth } from "@/context/auth-context"

/** Wait for auth bootstrap before calling protected APIs */
export function useAuthReady() {
  const { user, isLoading, isAuthenticated } = useAuth()
  return {
    user,
    isLoading,
    isAuthenticated,
    ready: !isLoading,
  }
}
