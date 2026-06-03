"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Redirect legacy /portfolios URL to Explore → Portfolio Albums tab */
export default function PortfoliosRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/explore?tab=portfolios")
  }, [router])

  return null
}
