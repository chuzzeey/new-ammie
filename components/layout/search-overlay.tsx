"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, X } from "lucide-react"
import { useProducts } from "@/hooks/use-products"
import { formatUsdPrice, getDiscountedPrice } from "@/lib/utils/product-pricing"

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
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm boty-transition ${
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
        <div className="mx-auto max-w-3xl px-3 pt-16 sm:px-5 sm:pt-20">
          {/* Card - solid bg matching site */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative overflow-hidden rounded-md border border-border bg-background shadow-xl"
          >
            {/* Content */}
            <div className="p-4 sm:p-5">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search wigs, lace, extensions..."
                  className="min-h-12 w-full rounded-sm border border-border bg-background py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground sm:text-base"
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
                  <div className="max-h-[55vh] space-y-1 overflow-y-auto border-t border-border p-2 sm:p-3">
                    {filtered.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={onClose}
                        className="group flex items-center gap-3 rounded-sm p-3 transition-colors hover:bg-muted sm:gap-4"
                      >
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-muted sm:h-16 sm:w-16">
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
                            {product.discountPercentage > 0 && (
                              <span className="shrink-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                -{product.discountPercentage}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            Premium quality hair product
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground">
                            {product.discountPercentage > 0 && (
                              <span className="mr-2 text-muted-foreground line-through">{formatUsdPrice(product.price)}</span>
                            )}
                            {formatUsdPrice(getDiscountedPrice(product.price, product.discountPercentage))}
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
