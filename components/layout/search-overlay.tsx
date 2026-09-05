"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, X } from "lucide-react"
import { useProducts } from "@/hooks/use-products"

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: products = [] } = useProducts()

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    } else {
      setQuery("")
    }
  }, [isOpen])

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <div
      className={`fixed inset-0 z-[60] boty-transition ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop with blur - outside the dropdown */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-lg boty-transition ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Search Panel */}
      <div
        className={`absolute top-0 left-0 right-0 boty-transition ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 pt-20 sm:pt-24">
          {/* Card - solid bg matching site */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-background border border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden"
            style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 20px 60px' }}
          >
            {/* Content */}
            <div className="p-5 sm:p-6">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search wigs, lace, extensions..."
                  className="w-full bg-card border border-border/50 rounded-xl sm:rounded-2xl pl-12 sm:pl-14 pr-12 sm:pr-14 py-3.5 sm:py-4 text-base sm:text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 boty-transition boty-shadow"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground boty-transition"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

            {/* Results Dropdown */}
            {query.trim() && (
              <div className="border-t border-border/50">
                {filtered.length > 0 ? (
                  <div className="p-3 sm:p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                    {filtered.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl hover:bg-card boty-transition group"
                      >
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm sm:text-base font-medium text-foreground group-hover:text-primary boty-transition truncate">
                              {product.name}
                            </p>
                            {product.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                product.badge === "Sale" ? "text-red-500 bg-red-50 dark:bg-red-950/30" :
                                product.badge === "New" ? "text-primary bg-primary/10" :
                                "text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                              }`}>
                                {product.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            Premium quality hair product
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(product.price) || 0)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">No products found for "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
