"use client"

import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { mockProviders, categoryLabels } from "@/data/mock-data"
import {
  Camera,
  Search,
  Calendar,
  CreditCard,
  ArrowRight,
  Users,
  Shield,
  Zap,
  ImageIcon,
  Scissors,
  Package,
} from "lucide-react"

const features = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "Discover Talent",
    description: "Browse verified photographers, editors, and equipment providers in your area.",
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Easy Booking",
    description: "Check real-time availability and book your preferred service provider instantly.",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Secure Payments",
    description: "Pay safely with OnePay, HelaPay, bank transfer, or card. All transactions are protected.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Verified Providers",
    description: "Every provider is verified by our admin team to ensure quality and reliability.",
  },
]

const serviceTypes = [
  { icon: <Camera className="h-8 w-8" />, label: "Photography", count: "120+ providers" },
  { icon: <Scissors className="h-8 w-8" />, label: "Photo Editing", count: "85+ editors" },
  { icon: <Package className="h-8 w-8" />, label: "Equipment Rental", count: "40+ rentals" },
  { icon: <ImageIcon className="h-8 w-8" />, label: "All Services", count: "245+ total" },
]

export default function HomePage() {
  const topProviders = mockProviders.filter((p) => p.is_approved).slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 text-center lg:px-8 lg:py-32">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Photography services made simple</span>
            </div>
            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Find and book the perfect{" "}
              <span className="text-primary">photography service</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              ShutterLink connects you with professional photographers, editors, and equipment rental services across Sri Lanka. Book with confidence.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-primary px-8 text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/explore">
                  Explore Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Join as Provider</Link>
              </Button>
            </div>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>648+ active users</span>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <span>78 verified providers</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>100% secure payments</span>
              </div>
            </div>
          </div>
        </section>

        {/* Service Types */}
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Our Services</h2>
            <p className="mt-3 text-muted-foreground">Everything you need for your photography projects</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {serviceTypes.map((type) => (
              <Link key={type.label} href="/explore">
                <Card className="border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {type.icon}
                    </div>
                    <h3 className="text-base font-semibold text-card-foreground">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.count}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-foreground">How ShutterLink Works</h2>
              <p className="mt-3 text-muted-foreground">A simple and secure way to connect with photography professionals</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, idx) => (
                <div key={feature.title} className="flex flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {idx + 1}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Providers */}
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Top Providers</h2>
              <p className="mt-3 text-muted-foreground">Highly rated professionals ready to serve</p>
            </div>
            <Button variant="ghost" className="hidden text-primary sm:inline-flex" asChild>
              <Link href="/explore">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topProviders.map((provider) => (
              <Link key={provider.id} href={`/provider-profile/${provider.id}`}>
                <Card className="overflow-hidden border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    {provider.portfolio[0] && (
                      <img
                        src={provider.portfolio[0].image_url}
                        alt={provider.business_name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-card-foreground">{provider.business_name}</h3>
                        <p className="text-sm text-muted-foreground">{provider.name}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {provider.provider_type === "photographer" ? "Photographer" : provider.provider_type === "editor" ? "Editor" : "Rental"}
                      </span>
                    </div>
                    <div className="mb-3 flex items-center gap-2">
                      <StarRating rating={provider.rating} size={14} />
                      <span className="text-sm font-medium text-foreground">{provider.rating}</span>
                      <span className="text-xs text-muted-foreground">({provider.total_reviews})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {provider.categories.slice(0, 3).map((cat) => (
                        <span key={cat} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {categoryLabels[cat]}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{provider.location}</span>
                      <span className="font-semibold text-foreground">
                        LKR {provider.price_range.min.toLocaleString()}+
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/explore">View all providers</Link>
            </Button>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-primary/5">
          <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-8">
            <h2 className="text-3xl font-bold text-foreground">Ready to get started?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Whether you need a photographer or want to offer your services, ShutterLink is the platform for you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/register">Create Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/explore">Browse Services</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
