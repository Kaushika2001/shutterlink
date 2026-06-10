import Link from "next/link"
import { Logo } from "@/components/layout/logo"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-10">
        <div className="flex justify-center">
          <Logo href="/" size="md" />
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          A photography marketplace for Sri Lanka — discover talent, book sessions, and grow your creative business.
        </p>
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <Link href="/explore" className="missio-nav-link text-muted-foreground hover:text-foreground">
            Portfolio
          </Link>
          <Link href="/explore" className="missio-nav-link text-muted-foreground hover:text-foreground">
            Services
          </Link>
          <Link href="/register" className="missio-nav-link text-muted-foreground hover:text-foreground">
            Join
          </Link>
          <Link href="/login" className="missio-nav-link text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </nav>
        <p className="mt-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ShutterLink. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
