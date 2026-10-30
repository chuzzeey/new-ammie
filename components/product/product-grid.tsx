"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useCart } from "@/components/providers/cart-context"
import { useLatestProducts } from "@/hooks/use-products"
import { supabase } from "@/lib/supabase"
import { formatUsdPrice, getDiscountedPrice } from "@/lib/utils/product-pricing"

interface FeaturedProduct {
  id: string
  name: string
  price: number
  image: string
  badge: string | null
  category: string
  description: string
  discountPercentage: number
}

export function ProductGrid() {
  const { data: products = [], isLoading: loading } = useLatestProducts(6)
  const queryClient = useQueryClient()

  const [isVisible, setIsVisible] = useState(true)
  const [headerVisible, setHeaderVisible] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCart()
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({})

  // Real-time subscription: invalidate cache on any product change
  useEffect(() => {
    const channel = supabase
      .channel("home-products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["products"] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // Preload all product images on mount
  useEffect(() => {
    products.forEach((product) => {
      const img = new window.Image()
      img.src = product.image
    })
  }, [products])

  useEffect(() => {
    const gridObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (gridRef.current) {
      gridObserver.observe(gridRef.current)
    }

    if (headerRef.current) {
      headerObserver.observe(headerRef.current)
    }

    return () => {
      if (gridRef.current) {
        gridObserver.unobserve(gridRef.current)
      }
      if (headerRef.current) {
        headerObserver.unobserve(headerRef.current)
      }
    }
  }, [])

  const handleAddToCart = useCallback(
    (e: React.MouseEvent, product: FeaturedProduct) => {
      e.preventDefault()
      e.stopPropagation()
      const discountedPrice = getDiscountedPrice(product.price, product.discountPercentage)
      addItem({
        id: product.id,
        name: product.name,
        price: discountedPrice,
        originalPrice: product.discountPercentage > 0 ? product.price : undefined,
        discountPercentage: product.discountPercentage || undefined,
        image: product.image,
      })
    },
    [addItem]
  )

  if (loading) {
    return (
      <section className="py-16 bg-background sm:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-10 text-left sm:mb-12">
            <div className="mb-4 h-3 w-36 animate-pulse rounded bg-muted"></div>
            <div className="mb-4 h-10 w-64 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-56 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border/70 bg-background">
                <div className="aspect-square bg-muted animate-pulse"></div>
                <div className="p-3">
                  <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-3 bg-muted animate-pulse rounded mb-3"></div>
                  <div className="h-10 bg-muted animate-pulse rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const featuredProducts = products as FeaturedProduct[]

  return (
    <section className="py-16 bg-background sm:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="mb-10 text-left sm:mb-12">
          <span className={`mb-3 block text-xs font-semibold uppercase tracking-[0.16em] text-primary ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}>
            Featured Collection
          </span>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className={`font-sans text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}}>
              Featured products
            </h2>
            <p className={`max-w-md text-sm text-muted-foreground sm:text-base ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.6s', animationFillMode: 'forwards' } : {}}>
              Our newest arrivals, crafted for beauty and confidence
            </p>
          </div>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4"
        >
          {featuredProducts.map((product, index) => (
            <article
              key={product.id}
              className={`group min-w-0 transition-all duration-500 ease-out ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
                <Link href={`/product/${product.id}`} aria-label={`View ${product.name}`}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                  {/* Skeleton */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted animate-pulse transition-opacity duration-500 ${
                      imageLoaded[product.id] ? 'opacity-0' : 'opacity-100'
                    }`}
                  />

                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    priority={index < 3}
                    className={`object-cover boty-transition group-hover:scale-105 transition-opacity duration-500 ${
                      imageLoaded[product.id] ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(prev => ({ ...prev, [product.id]: true }))}
                  />
                  {/* Badge */}
                  {product.discountPercentage > 0 && (
                    <span
                      aria-label={`Save ${product.discountPercentage}%`}
                      className="absolute right-3 top-3 rounded-sm bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                    >
                      Save {product.discountPercentage}%
                    </span>
                  )}
                  {product.badge && (
                    <span
                      className={`absolute left-3 top-3 rounded-sm bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        product.badge === "Sale"
                          ? "text-red-600"
                          : product.badge === "New"
                          ? "text-primary"
                          : "text-black"
                      }`}
                    >
                      {product.badge}
                    </span>
                  )}
                  </div>
                </Link>

                {/* Info */}
                <div className="min-w-0 pt-3">
                  <Link href={`/product/${product.id}`} className="block min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="min-w-0">
                      <span className="line-clamp-2 break-words text-sm font-medium leading-5 text-foreground hover:underline md:text-base">
                        {product.name}
                      </span>
                      <span className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm font-medium text-foreground">
                        {product.discountPercentage > 0 && (
                          <span className="text-xs text-muted-foreground line-through">{formatUsdPrice(product.price)}</span>
                        )}
                        <span className="break-words">{formatUsdPrice(getDiscountedPrice(product.price, product.discountPercentage))}</span>
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 break-words text-xs text-muted-foreground">{product.description || "Premium quality hair product"}</p>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, product)}
                    className="mt-3 inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-xs font-medium text-foreground boty-transition hover:border-foreground hover:bg-foreground hover:text-background"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Quick add
                  </button>
                </div>
            </article>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-foreground/20 bg-transparent px-6 py-3 text-sm font-medium text-foreground boty-transition hover:bg-foreground/5"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
