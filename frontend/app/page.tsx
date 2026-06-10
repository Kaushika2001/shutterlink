"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { SectionHeading } from "@/components/layout/section-heading"
import { Button } from "@/components/ui/button"
import { getFeaturedProviders } from "@/services/provider"
import { getPublicPortfolioAlbums, type PortfolioAlbum } from "@/services/portfolio"
import { toast } from "sonner"
import { ChevronDown, MapPin } from "lucide-react"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1920&q=80"

const services = [
  { title: "Wedding", href: "/explore" },
  { title: "Portrait", href: "/explore" },
  { title: "Commercial", href: "/explore" },
  { title: "Editing", href: "/explore" },
  { title: "Equipment", href: "/explore" },
]

export default function HomePage() {
  const [featuredProviders, setFeaturedProviders] = useState<any[]>([])
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [providers, portfolioAlbums] = await Promise.all([
          getFeaturedProviders(6),
          getPublicPortfolioAlbums().catch(() => [] as PortfolioAlbum[]),
        ])
        setFeaturedProviders(
          providers.map((p: any) => ({
            ...p,
            portfolio: p.portfolio_url ? [{ image_url: p.portfolio_url }] : [],
            location: p.coverage_areas?.[0] || "Sri Lanka",
            rating: p.average_rating || 0,
          }))
        )
        setAlbums(portfolioAlbums.slice(0, 6))
      } catch {
        toast.error("Failed to load content")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const galleryItems = albums.length > 0
    ? albums.map((a) => ({
        id: a.provider_id,
        href: `/explore/portfolio/${a.provider_id}`,
        image: a.cover_image_url,
        title: a.provider.business_name || "Portfolio",
        subtitle: `${a.item_count} photos`,
      }))
    : featuredProviders.map((p) => ({
        id: p.id,
        href: `/provider-profile/${p.id}`,
        image: p.portfolio[0]?.image_url,
        title: p.business_name,
        subtitle: p.location,
      }))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar variant="overlay" />
      <main className="flex-1">
        {/* Fullscreen hero — Missio style */}
        <section className="relative flex min-h-[88vh] items-center justify-center">
          <img
            src={HERO_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center text-white">
            <p className="missio-label text-white/70">Photography marketplace</p>
            <h1 className="mt-4 font-serif text-5xl font-normal leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
              Stories worth framing
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
              Discover photographers, editors, and studios across Sri Lanka. Browse portfolios, compare packages, and book with confidence.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button variant="elegant" size="lg" className="border-white px-8 text-white hover:bg-white hover:text-black" asChild>
                <Link href="/explore">View portfolio</Link>
              </Button>
              <Button variant="elegant" size="lg" className="border-white/60 px-8 text-white/90 hover:bg-white/10 hover:text-white" asChild>
                <Link href="/register">Become a provider</Link>
              </Button>
            </div>
          </div>
          <a
            href="#gallery"
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/60 transition-colors hover:text-white"
            aria-label="Scroll to gallery"
          >
            <span className="missio-label">Scroll</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </a>
        </section>

        {/* Services strip */}
        <section className="border-b border-border py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <SectionHeading
              label="What we offer"
              title="Photography services"
              description="From weddings to commercial shoots — find the right creative for your project."
            />
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {services.map((s) => (
                <Link
                  key={s.title}
                  href={s.href}
                  className="font-serif text-2xl text-foreground transition-opacity hover:opacity-60 md:text-3xl"
                >
                  {s.title}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio gallery */}
        <section id="gallery" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <SectionHeading
              label="Selected work"
              title="Featured portfolios"
              description="A curated look at photographers and studios on ShutterLink."
            />
            {loading ? (
              <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`${cnAspect(i)} overflow-hidden`}>
                    <div className="h-full w-full animate-pulse bg-muted" />
                  </div>
                ))}
              </div>
            ) : galleryItems.length > 0 ? (
              <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item, i) => (
                  <Link key={item.id} href={item.href} className={`${cnAspect(i)} block overflow-hidden`}>
                    <div className="gallery-item h-full">
                      {item.image ? (
                        <img src={item.image} alt={item.title} />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                          No preview
                        </div>
                      )}
                      <div className="gallery-overlay">
                        <p className="font-serif text-xl text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-white/75">{item.subtitle}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-12 text-center text-muted-foreground">No portfolios yet. Check back soon.</p>
            )}
            <div className="mt-12 text-center">
              <Button variant="elegant" asChild>
                <Link href="/explore?tab=portfolios">See all portfolios</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* About / process */}
        <section className="border-y border-border bg-muted/30 py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-10 lg:gap-20">
            <div>
              <SectionHeading
                align="left"
                label="About ShutterLink"
                title="Built for photographers and clients"
                description="We connect creative professionals with people who need beautiful work — without the friction of endless messages and unclear pricing."
              />
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {[
                { step: "01", title: "Browse", text: "Explore portfolios and service packages by style, location, and budget." },
                { step: "02", title: "Book", text: "Check availability and reserve your session in a few clicks." },
                { step: "03", title: "Pay", text: "Secure checkout with local payment options you already trust." },
                { step: "04", title: "Deliver", text: "Complete your project and leave a review for the community." },
              ].map((item) => (
                <div key={item.step}>
                  <span className="missio-label text-muted-foreground">{item.step}</span>
                  <h3 className="mt-2 font-serif text-xl text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured providers list */}
        {!loading && featuredProviders.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <SectionHeading
                label="Top rated"
                title="Featured creators"
                description="Professionals trusted by clients on ShutterLink."
              />
              <div className="mt-12 divide-y divide-border border-y border-border">
                {featuredProviders.slice(0, 4).map((provider) => (
                  <Link
                    key={provider.id}
                    href={`/provider-profile/${provider.id}`}
                    className="group flex items-center justify-between gap-6 py-6 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-5">
                      <div className="hidden h-16 w-16 shrink-0 overflow-hidden bg-muted sm:block">
                        {provider.portfolio[0]?.image_url ? (
                          <img
                            src={provider.portfolio[0].image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-serif text-xl text-foreground group-hover:opacity-70">
                          {provider.business_name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {provider.location}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-serif text-lg text-foreground">
                        {provider.rating > 0 ? provider.rating.toFixed(1) : "New"}
                      </p>
                      <p className="missio-label mt-1 text-muted-foreground">Rating</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-foreground py-20 text-background md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <p className="missio-label text-background/60">Get started</p>
            <h2 className="mt-4 font-serif text-4xl font-normal md:text-5xl">
              Ready to book your next shoot?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-background/75">
              Join as a client to book services, or list your studio to reach new clients across Sri Lanka.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button
                variant="elegant"
                size="lg"
                className="border-background text-background hover:bg-background hover:text-foreground"
                asChild
              >
                <Link href="/explore">Explore now</Link>
              </Button>
              <Button
                variant="elegant"
                size="lg"
                className="border-background/50 text-background/90 hover:bg-background/10"
                asChild
              >
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

/** Missio-style masonry-ish aspect ratios */
function cnAspect(index: number) {
  const aspects = ["aspect-[3/4]", "aspect-[4/5]", "aspect-square", "aspect-[5/4]", "aspect-[3/4]", "aspect-[4/3]"]
  return aspects[index % aspects.length]
}
