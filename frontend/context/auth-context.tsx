"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { User, UserRole } from "@/types"
import * as authService from "@/services/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  switchRole?: (role: UserRole) => void // Optional for dev mode
}

interface RegisterData {
  name: string
  email: string
  password: string
  role: UserRole
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from backend token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authService.getCurrentUser()
        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            created_at: userData.created_at,
            is_verified: userData.is_verified ?? true,
          })
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    return () => undefined
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      const userData = await authService.signIn(email, password)
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        created_at: userData.created_at,
        is_verified: userData.is_verified ?? true,
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)

      if (!PASSWORD_REGEX.test(data.password)) {
        return {
          success: false,
          error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
        }
      }

      const userData = await authService.signUp(
        data.email,
        data.password,
        data.name,
        data.role,
        data.phone
      )

      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        created_at: userData.created_at,
        is_verified: userData.is_verified ?? false,
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.signOut()
      setUser(null)
      // Redirect to home page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if there's an error, try to clear local state and redirect
      setUser(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.resetPassword(email)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Password reset failed' }
    }
  }, [])

  // Optional: Keep switchRole for development/demo mode only
  const switchRole = useCallback((role: UserRole) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('switchRole is for development only')
      // In dev mode, you could implement mock role switching
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        resetPassword,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
