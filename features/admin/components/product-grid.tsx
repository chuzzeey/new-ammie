"use client"

import Image from "next/image"
import { useState } from "react"
import { Edit3, Trash2, Play, Percent, X } from "lucide-react"
import { isVideoUrl, getVideoPosterUrl } from "@/lib/cloudinary"
import type { Product } from "@/lib/supabase"
import { formatUsdPrice, getDiscountedPrice } from "@/lib/utils/product-pricing"

interface ProductGridProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onSetDiscount: (id: string, discountPercentage: number) => Promise<boolean>
}

export default function ProductGrid({ products, onEdit, onDelete, onSetDiscount }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
      {products.map((product) => (
        <AdminProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDiscount={onSetDiscount}
        />
      ))}
    </div>
  )
}

function AdminProductCard({
  product,
  onEdit,
  onDelete,
  onSetDiscount,
}: {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onSetDiscount: (id: string, discountPercentage: number) => Promise<boolean>
}) {
  const [discountEditorOpen, setDiscountEditorOpen] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState(product.discount_percentage || 0)
  const [savingDiscount, setSavingDiscount] = useState(false)

  const saveDiscount = async (value: number) => {
    setSavingDiscount(true)
    try {
      const saved = await onSetDiscount(product.id, value)
      if (saved) {
        setDiscountPercentage(value)
        setDiscountEditorOpen(false)
      }
    } finally {
      setSavingDiscount(false)
    }
  }

  const discountedPrice = getDiscountedPrice(product.price, product.discount_percentage)

  return (
        <div className="group transition-all duration-500 ease-out opacity-100 scale-100">
          <div className="overflow-hidden rounded-md border border-border bg-background transition-shadow group-hover:shadow-md">
              <div className="relative aspect-square bg-muted overflow-hidden">
                {isVideoUrl(product.images[0]) ? (
                  <>
                    <Image
                      src={getVideoPosterUrl(product.images[0])}
                      alt={product.name}
                      fill
                      className="object-cover boty-transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                        <Play className="w-4 h-4 text-foreground ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </>
                ) : (
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover boty-transition group-hover:scale-105"
                  />
                )}
              {product.discount_percentage > 0 && (
                <span
                  aria-label={`Save ${product.discount_percentage}%`}
                  className="absolute right-2 top-2 rounded-sm bg-red-600 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-white sm:right-3 sm:top-3 sm:px-2.5 sm:text-[10px]"
                >
                  Save {product.discount_percentage}%
                </span>
              )}
              {product.badge && (
                <span className={`absolute top-2 sm:top-4 left-2 sm:left-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs tracking-wide backdrop-blur-sm bg-white/70 ${
                  product.badge === "Sale" ? "text-destructive" : product.badge === "Bestseller" ? "text-primary" : "text-foreground"
                }`}>
                  {product.badge}
                </span>
              )}
            </div>
            <div className="p-2 sm:p-3 md:p-5 pb-3 sm:pb-4">
              <h3 className="mb-1 text-xs font-medium leading-tight text-foreground sm:text-sm md:text-base">{product.name}</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-1.5 sm:mb-2 md:mb-3 leading-tight line-clamp-2">{product.description ? product.description.split(' ').slice(0, 7).join(' ') + (product.description.split(' ').length > 7 ? '...' : '') : 'Premium quality hair product'}</p>
              <div className="mb-1.5 flex flex-wrap items-center gap-1 sm:mb-2 sm:gap-2 md:mb-3">
                {product.discount_percentage > 0 && (
                  <span className="text-[10px] text-muted-foreground line-through sm:text-xs md:text-sm">
                    {formatUsdPrice(product.price)}
                  </span>
                )}
                <span className="text-[10px] font-medium text-foreground sm:text-xs md:text-base">
                  {formatUsdPrice(discountedPrice)}
                </span>
                {product.discount_percentage > 0 && (
                  <span className="text-[9px] font-medium text-red-700 sm:text-[10px]">
                    Save {product.discount_percentage}%
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-sm bg-primary px-2 py-1.5 text-[9px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:gap-1.5 sm:px-3 md:px-4 md:text-xs"
                >
                  <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountPercentage(product.discount_percentage || 5)
                    setDiscountEditorOpen((open) => !open)
                  }}
                  aria-expanded={discountEditorOpen}
                  aria-label={product.discount_percentage ? `Edit ${product.discount_percentage}% discount` : "Add discount"}
                  className="inline-flex min-h-9 items-center justify-center gap-1 rounded-sm border border-border px-2 py-1.5 text-[9px] font-medium text-foreground transition-colors hover:bg-muted sm:px-3 md:text-xs"
                >
                  <Percent className="h-3 w-3" />
                  <span>Discount</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product.id)}
                  className="inline-flex min-h-9 items-center justify-center gap-1 rounded-sm border border-destructive/20 px-2 py-1.5 text-[9px] font-medium text-destructive transition-colors hover:bg-destructive/10 sm:gap-1.5 sm:px-3 md:px-4 md:text-xs"
                >
                  <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                </button>
              </div>
              {discountEditorOpen && (
                <div className="mt-3 space-y-3 rounded-sm bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`discount-${product.id}`} className="text-xs font-medium text-foreground">
                      Set discount
                    </label>
                    <button
                      type="button"
                      onClick={() => setDiscountEditorOpen(false)}
                      aria-label="Close discount controls"
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    id={`discount-${product.id}`}
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={discountPercentage || 5}
                    onChange={(event) => setDiscountPercentage(Number(event.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>5%</span>
                    <span className="font-semibold text-foreground">Save {discountPercentage || 5}%</span>
                    <span>50%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customer price: <span className="font-medium text-foreground">{formatUsdPrice(getDiscountedPrice(product.price, discountPercentage || 5))}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={savingDiscount}
                      onClick={() => void saveDiscount(discountPercentage || 5)}
                      className="min-h-8 flex-1 rounded-sm bg-primary px-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {savingDiscount ? "Saving…" : "Save discount"}
                    </button>
                    {product.discount_percentage > 0 && (
                      <button
                        type="button"
                        disabled={savingDiscount}
                        onClick={() => void saveDiscount(0)}
                        className="min-h-8 rounded-sm border border-border px-2 text-xs font-medium text-foreground disabled:opacity-50"
                      >
                        Remove discount
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
  )
}
