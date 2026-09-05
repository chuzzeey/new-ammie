"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useCart } from "@/components/providers/cart-context"
import { useLatestProducts } from "@/hooks/use-products"
import { supabase } from "@/lib/supabase"

interface FeaturedProduct {
  id: string
  name: string
  price: number
  image: string
  badge: string | null
  category: string
  description: string
}

const formatUsdPrice = (value: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

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
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      })
    },
    [addItem]
  )

  if (loading) {
    return (
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto mb-4"></div>
            <div className="h-12 w-96 bg-muted animate-pulse rounded mx-auto mb-4"></div>
            <div className="h-6 w-64 bg-muted animate-pulse rounded mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-background rounded-3xl overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse"></div>
                <div className="p-3 md:p-5">
                  <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-3 bg-muted animate-pulse rounded mb-4"></div>
                  <div className="h-8 bg-muted animate-pulse rounded-full"></div>
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
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <span className={`text-sm tracking-[0.3em] uppercase text-primary mb-4 block ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}>
            Featured Collection
          </span>
          <h2 className={`font-serif leading-tight text-foreground mb-4 text-balance text-4xl md:text-7xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}}>
            Featured products
          </h2>
          <p className={`text-lg text-muted-foreground max-w-md mx-auto ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.6s', animationFillMode: 'forwards' } : {}}>
            Our newest arrivals, crafted for beauty and confidence
          </p>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          {featuredProducts.map((product, index) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className={`group transition-all duration-500 ease-out ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="bg-background rounded-3xl overflow-hidden boty-shadow boty-transition group-hover:scale-[1.02]">
                {/* Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
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
                  {product.badge && (
                    <span
                      className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs tracking-wide backdrop-blur-sm bg-white/70 ${
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
                  {/* Quick add button */}
                  <button
                    type="button"
                    className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 boty-transition boty-shadow"
                    onClick={(e) => handleAddToCart(e, product)}
                    aria-label="Add to cart"
                  >
                    <ShoppingBag className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 md:p-5 pb-4">
                  <h3 className="font-serif text-sm md:text-lg text-foreground mb-0.5 md:mb-1">{product.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2">{product.description ? product.description.split(' ').slice(0, 7).join(' ') + (product.description.split(' ').length > 7 ? '...' : '') : 'Premium quality hair product'}</p>
                  <div className="flex items-center gap-2 mb-2 md:mb-4">
                    <span className="text-xs md:text-base font-medium text-foreground">{formatUsdPrice(product.price)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, product)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 md:px-4 md:py-2.5 rounded-full text-[10px] md:text-xs tracking-wide boty-transition hover:bg-primary/90 boty-shadow"
                  >
                    <ShoppingBag className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-8 py-4 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
