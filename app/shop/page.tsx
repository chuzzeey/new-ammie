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

const categories = ["all", "ready_to_ship_braided_wigs", "preorder_wigs", "human_hair_wigs"] as const

const categoryLabels: Record<string, string> = {
  all: "All products/Wigs",
  ready_to_ship_braided_wigs: "Ready to ship braided wigs",
  preorder_wigs: "Preorder wigs",
  human_hair_wigs: "Human hair wigs",
}

const formatUsdPrice = (value: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

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
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      })
    },
    [addItem, product.id, product.name, product.price, product.image]
  )

  return (
    <Link
      href={`/product/${product.id}`}
      className={`group transition-all duration-700 ease-out ${
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
            onClick={handleAdd}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 md:px-4 md:py-2.5 rounded-full text-[10px] md:text-xs tracking-wide boty-transition hover:bg-primary/90 boty-shadow"
          >
            <ShoppingBag className="w-3 h-3 md:w-3.5 md:h-3.5" />
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
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
      
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-4">Shop</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our premium collection of wigs, lace fronts, and hair extensions
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-8 md:mb-12">
            <div className="w-full max-w-xs md:max-w-sm">
              <label htmlFor="shop-category-select" className="mb-2 block text-left text-sm font-medium text-foreground">
                Categories
              </label>
              <div className="relative">
                <select
                  id="shop-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 pr-10 text-left text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                >
                  <path d="M5.25 7.5 10 12.25 14.75 7.5H5.25Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
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
