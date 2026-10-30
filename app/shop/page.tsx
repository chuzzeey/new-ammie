"use client"

import { useState, useEffect, useMemo, useRef, Suspense, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useCart } from "@/components/providers/cart-context"
import { useProducts, type ShopProduct } from "@/hooks/use-products"
import { supabase } from "@/lib/supabase"
import { formatUsdPrice, getDiscountedPrice } from "@/lib/utils/product-pricing"

const categories = ["all", "ready_to_ship_braided_wigs", "preorder_wigs", "human_hair_wigs"] as const

const categoryLabels: Record<string, string> = {
  all: "All products",
  ready_to_ship_braided_wigs: "Ready to ship",
  preorder_wigs: "Pre-order",
  human_hair_wigs: "Human hair",
}

function ProductCard({ 
  product, 
  index, 
  isVisible 
}: { 
  product: ShopProduct
  index: number
  isVisible: boolean
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const { addItem } = useCart()

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
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
    [addItem, product.id, product.name, product.price, product.discountPercentage, product.image]
  )

  return (
    <article
      className={`group min-w-0 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Link href={`/product/${product.id}`} aria-label={`View ${product.name}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
          {/* Skeleton */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted animate-pulse transition-opacity duration-500 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
          
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover boty-transition group-hover:scale-105 transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          {product.discountPercentage > 0 && (
            <span
              aria-label={`Save ${product.discountPercentage}%`}
              className="absolute right-3 top-3 rounded-sm bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
            >
              Save {product.discountPercentage}%
            </span>
          )}
          {/* Badge */}
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
          onClick={handleAdd}
          className="mt-3 inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-xs font-medium text-foreground boty-transition hover:border-foreground hover:bg-foreground hover:text-background"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Quick add
        </button>
      </div>
    </article>
  )
}

function ShopPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const { data: products = [], isLoading: loading } = useProducts()
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all")
  const [isVisible, setIsVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [windowWidth, setWindowWidth] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const topPaginationRef = useRef<HTMLDivElement>(null)

  // Real-time subscription: invalidate cache on any product change
  useEffect(() => {
    const channel = supabase
      .channel("shop-products-changes")
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

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter(p => p.category === selectedCategory)

  const selectedCategoryLabel = categoryLabels[selectedCategory] || selectedCategory

  // Track window width for responsive products per page
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    handleResize() // Set initial width
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate products per page based on screen size
  const productsPerPage = useMemo(() => {
    if (windowWidth < 768) return 10 // Mobile
    if (windowWidth < 1024) return 12 // Tablet (md)
    return 15 // Desktop (lg and above)
  }, [windowWidth])

  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  // Get current page products
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, productsPerPage])

  // Calculate visible page numbers (max 3 at a time)
  const getVisiblePages = () => {
    const delta = 1 // Show 1 page before and after current page (total 3)
    let start = Math.max(1, currentPage - delta)
    let end = Math.min(totalPages, currentPage + delta)
    
    // Adjust if we're at the start or end
    if (currentPage === 1) {
      end = Math.min(totalPages, 3)
    } else if (currentPage === totalPages) {
      start = Math.max(1, totalPages - 2)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()

  // Handle page change with scroll to top of shop page
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to the top of the shop page content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Update URL when category or page changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategory !== "all") {
      params.set("category", selectedCategory)
    }
    if (currentPage > 1) {
      params.set("page", currentPage.toString())
    }
    const newUrl = params.toString() ? `?${params.toString()}` : "/shop"
    router.push(newUrl, { scroll: false })
  }, [selectedCategory, currentPage, router])

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (gridRef.current) {
      observer.observe(gridRef.current)
    }

    return () => {
      if (gridRef.current) {
        observer.unobserve(gridRef.current)
      }
    }
  }, [])

  // Reset animation when category changes
  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [selectedCategory])

  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden">
        <Header />
        <div className="pt-28 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="text-lg text-muted-foreground">Loading products...</div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      
      <div className="pb-20 pt-32 sm:pt-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-10 max-w-2xl md:mb-14">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ammie N collection</p>
            <h1 className="mb-3 font-sans text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Shop all</h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Discover our premium collection of wigs, lace fronts, and hair extensions
            </p>
          </div>

          {/* Category Filter */}
          <nav aria-label="Filter products by category" className="mb-8 overflow-x-auto border-b border-border md:mb-10">
            <div className="flex min-w-max gap-6">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                  className={`border-b-2 px-1 pb-3 text-sm transition-colors ${
                    selectedCategory === category
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </nav>

          {/* Results count */}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              {selectedCategory !== "all" && ` in ${selectedCategoryLabel}`}
            </p>
          </div>

          {/* Product Grid */}
          <div 
            ref={gridRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {currentProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No products found in this category</p>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="text-primary hover:underline"
              >
                View all products
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 md:mt-16">
              {/* Top pagination */}
              <div ref={topPaginationRef} className="flex justify-center mb-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed boty-transition"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {visiblePages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 ${
                        currentPage === page
                          ? "bg-foreground text-background"
                          : "hover:bg-muted"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed boty-transition"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Bottom pagination - only on mobile */}
              <div className="flex justify-center md:hidden">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-full border border-border text-sm disabled:opacity-50 disabled:cursor-not-allowed boty-transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-full border border-border text-sm disabled:opacity-50 disabled:cursor-not-allowed boty-transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen overflow-x-hidden">
        <Header />
        <div className="pt-28 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="text-lg text-muted-foreground">Loading...</div>
            </div>
          </div>
        </div>
      </main>
    }>
      <ShopPageContent />
    </Suspense>
  )
}
