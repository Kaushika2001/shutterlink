"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarLink {
  href: string
  label: string
  icon: React.ReactNode
}

interface DashboardSidebarProps {
  links: SidebarLink[]
  open: boolean
  onClose: () => void
}

export function DashboardSidebar({ links, open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground">ShutterLink</span>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onClose} aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
