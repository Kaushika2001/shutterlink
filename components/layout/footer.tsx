import Link from "next/link"
import { Camera } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-bold text-foreground">ShutterLink</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Connect with professional photographers, editors, and equipment rental services in Sri Lanka.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Platform</h4>
            <ul className="flex flex-col gap-2">
              <li><Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">Explore Services</Link></li>
              <li><Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">Join as Provider</Link></li>
              <li><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Services</h4>
            <ul className="flex flex-col gap-2">
              <li><span className="text-sm text-muted-foreground">Wedding Photography</span></li>
              <li><span className="text-sm text-muted-foreground">Portrait Sessions</span></li>
              <li><span className="text-sm text-muted-foreground">Equipment Rental</span></li>
              <li><span className="text-sm text-muted-foreground">Photo Editing</span></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Support</h4>
            <ul className="flex flex-col gap-2">
              <li><span className="text-sm text-muted-foreground">Help Center</span></li>
              <li><span className="text-sm text-muted-foreground">Privacy Policy</span></li>
              <li><span className="text-sm text-muted-foreground">Terms of Service</span></li>
              <li><span className="text-sm text-muted-foreground">Contact Us</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            2026 ShutterLink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
