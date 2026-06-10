"use client"

import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, User, LogOut, LayoutDashboard, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

const roleLinks: Record<UserRole, { href: string; label: string }> = {
  customer: { href: "/dashboard", label: "Dashboard" },
  provider: { href: "/provider", label: "Studio" },
  admin: { href: "/admin", label: "Admin" },
}

const navLinks = [
  { href: "/explore", label: "Portfolio" },
  { href: "/explore", label: "Services" },
  { href: "/register", label: "For Creators" },
]

interface NavbarProps {
  variant?: "default" | "overlay"
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const overlay = variant === "overlay"

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
  }

  const linkClass = cn(
    "missio-nav-link px-3 py-2",
    overlay
      ? "text-white/80 hover:text-white"
      : "text-muted-foreground hover:text-foreground"
  )

  return (
    <header
      className={cn(
        "z-50 w-full transition-colors",
        overlay
          ? "absolute inset-x-0 top-0 border-b border-white/10 bg-black/20 backdrop-blur-sm"
          : "sticky top-0 border-b border-border bg-background/95 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Logo light={overlay} size="sm" />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
          {isAuthenticated && user && (
            <Link href={roleLinks[user.role].href} className={linkClass}>
              {roleLinks[user.role].label}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "hidden h-8 gap-2 px-2 md:flex",
                    overlay && "text-white hover:bg-white/10 hover:text-white"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.name}</p>
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
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className={cn(
                  "missio-nav-link",
                  overlay ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign in
              </Link>
              <Button variant={overlay ? "elegant" : "default"} size="sm" className={overlay ? "border-white text-white hover:bg-white hover:text-black" : ""} asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 md:hidden", overlay && "text-white hover:bg-white/10")}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className={cn(
            "border-t px-6 py-4 md:hidden",
            overlay ? "border-white/10 bg-black/80" : "border-border bg-background"
          )}
        >
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn("missio-nav-link py-2", overlay ? "text-white/80" : "text-muted-foreground")}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && user ? (
              <>
                <Link
                  href={roleLinks[user.role].href}
                  onClick={() => setMobileOpen(false)}
                  className={cn("missio-nav-link py-2", overlay ? "text-white/80" : "text-muted-foreground")}
                >
                  {roleLinks[user.role].label}
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileOpen(false)
                  }}
                  disabled={isLoggingOut}
                  className="py-2 text-left text-sm text-destructive disabled:opacity-50"
                >
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
