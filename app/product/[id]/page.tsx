/**
 * Product detail page with ISR (Incremental Static Regeneration) + Streaming.
 *
 * ISR: The page is statically generated at build time and revalidated
 * every 60 seconds (or on-demand when admin updates a product).
 * This gives static-speed page loads with dynamic content freshness.
 *
 * Streaming: The page shell renders immediately, and the product content
 * streams in progressively via Suspense boundaries. Video content is
 * especially heavy, so loading states show immediately while video data
 * resolves.
 */

import React, { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClientServer } from "@/lib/supabase/server"
import { ProductPageClient } from "./product-page-client"
import { ProductPageSkeleton } from "./product-page-skeleton"
import { getOptimizedProductImage } from "@/lib/cloudinary/image-utils"

// ISR: Revalidate this page every 60 seconds
// Also revalidated on-demand via POST /api/revalidate after admin updates
export const revalidate = 60

// Dynamic params for ISR — Next.js will pre-render popular products at build
// time and generate others on-demand
export const dynamicParams = true

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Generate metadata for the product page (SEO).
 * Fetches product data on the server so metadata is available to crawlers.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    const supabase = await createClientServer()
    const { data: product } = await supabase
      .from("products")
      .select("name, description, images, price, rating, review_count")
      .eq("id", id)
      .single()

    if (!product) {
      return { title: "Product Not Found — Ammie N" }
    }

    const imageUrl = product.images?.[0]
      ? getOptimizedProductImage(product.images[0], "detail")
      : undefined

    return {
      title: `${product.name} — Ammie N Premium Hair`,
      description: product.description || `${product.name} — Premium quality hair from Ammie N.`,
      openGraph: {
        title: `${product.name} — Ammie N`,
        description: product.description || `${product.name} — Premium quality hair from Ammie N.`,
        images: imageUrl ? [{ url: imageUrl, width: 1200, height: 1200 }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} — Ammie N`,
        description: product.description || `${product.name} — Premium quality hair from Ammie N.`,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return { title: "Product — Ammie N" }
  }
}

/**
 * Server component that:
 * 1. Fetches initial product data on the server (fast, no waterfall)
 * 2. Renders skeleton immediately via Suspense
 * 3. Streams the full interactive client component when ready
 */
export default async function ProductPage({ params }: Props) {
  const { id } = await params

  // Initial data fetch on the server — provides fast first paint
  // and enables ISR. The client will refetch for real-time updates
  // via Supabase Realtime subscriptions.
  const supabase = await createClientServer()
  const { data: initialProduct } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (!initialProduct) {
    notFound()
  }

  // Serialize the product for the client (dates remain as strings)
  const serializedProduct = {
    ...initialProduct,
    created_at: initialProduct.created_at || new Date().toISOString(),
    updated_at: initialProduct.updated_at || new Date().toISOString(),
  }

  // Fetch suggestions on the server too — no waterfall
  const { data: initialSuggestions } = await supabase
    .from("products")
    .select("*")
    .neq("id", id)
    .limit(4)

  const serializedSuggestions = (initialSuggestions || []).map((p) => ({
    ...p,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  }))

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Suspense fallback={<ProductPageSkeleton />}>
        <ProductPageClient
          productId={id}
          initialProduct={serializedProduct}
          initialSuggestions={serializedSuggestions}
        />
      </Suspense>
    </main>
  )
}