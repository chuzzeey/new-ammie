"use client"

import { useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Hero } from "@/components/sections/hero"
import { TrustBadges } from "@/components/sections/trust-badges"
import { FeatureSection } from "@/components/sections/feature-section"
import { HeadSizeChart } from "@/components/sections/head-size-chart"
import { ProductGrid } from "@/components/product/product-grid"
import { ReviewsSection } from "@/components/sections/reviews-section"
import { Newsletter } from "@/components/sections/newsletter"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const hash = window.location.hash
    if (hash !== "#reviews") return

    const section = document.getElementById("reviews")
    if (!section) return

    window.requestAnimationFrame(() => {
      const top = section.getBoundingClientRect().top + window.scrollY - 96
      window.scrollTo({ top, behavior: "smooth" })
    })
  }, [])

  return (
    <main>
      <Header />
      <Hero />
      <TrustBadges />
      <ProductGrid />
      <HeadSizeChart />
      <FeatureSection />
      <ReviewsSection />
      <Newsletter />
      <Footer />
    </main>
  )
}
