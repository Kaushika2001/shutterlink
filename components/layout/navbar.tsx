"use client"

import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Camera, Menu, Moon, Sun, User, LogOut, LayoutDashboard, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import type { UserRole } from "@/types"

const roleLinks: Record<UserRole, { href: string; label: string }> = {
  customer: { href: "/dashboard", label: "Dashboard" },
  provider: { href: "/provider", label: "Provider Panel" },
  admin: { href: "/admin", label: "Admin Panel" },
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    // Note: logout() redirects, so this won't be reached
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Camera className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">ShutterLink</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/explore" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            Explore
          </Link>
          {isAuthenticated && user && (
            <Link href={roleLinks[user.role].href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {roleLinks[user.role].label}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden h-9 gap-2 px-3 md:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={roleLinks[user.role].href} className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {roleLinks[user.role].label}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="flex items-center gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/explore"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Explore
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link
                  href={roleLinks[user.role].href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {roleLinks[user.role].label}
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false) }}
                  disabled={isLoggingOut}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                </Button>
                <Button className="bg-primary text-primary-foreground" asChild>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
