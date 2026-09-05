"use client"

import Image from "next/image"
import Link from "next/link"
import { Edit3, Trash2, Star, Play } from "lucide-react"
import { isVideoUrl, getVideoPosterUrl } from "@/lib/cloudinary"
import type { Product } from "@/lib/supabase"

interface ProductGridProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export default function ProductGrid({ products, onEdit, onDelete }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
      {products.map((product) => (
        <div key={product.id} className="group transition-all duration-500 ease-out opacity-100 scale-100">
          <div className="bg-background rounded-2xl sm:rounded-3xl overflow-hidden boty-shadow boty-transition group-hover:scale-[1.02] border border-border/50">
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
              {product.badge && (
                <span className={`absolute top-2 sm:top-4 left-2 sm:left-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs tracking-wide backdrop-blur-sm bg-white/70 ${
                  product.badge === "Sale" ? "text-destructive" : product.badge === "Bestseller" ? "text-primary" : "text-foreground"
                }`}>
                  {product.badge}
                </span>
              )}
            </div>
            <div className="p-2 sm:p-3 md:p-5 pb-3 sm:pb-4">
              <h3 className="font-serif text-xs sm:text-sm md:text-lg text-foreground mb-0.5 md:mb-1 leading-tight">{product.name}</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-1.5 sm:mb-2 md:mb-3 leading-tight line-clamp-2">{product.description ? product.description.split(' ').slice(0, 7).join(' ') + (product.description.split(' ').length > 7 ? '...' : '') : 'Premium quality hair product'}</p>
              <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 md:mb-3">
                <span className="text-[10px] sm:text-xs md:text-base font-medium text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(product.price) || 0)}</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-primary text-primary-foreground px-2 sm:px-3 md:px-4 py-1.5 sm:py-1.5 md:py-2.5 rounded-full text-[9px] sm:text-[10px] md:text-xs tracking-wide boty-transition hover:bg-primary/90 boty-shadow"
                >
                  <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product.id)}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-destructive/10 text-destructive px-2 sm:px-3 md:px-4 py-1.5 sm:py-1.5 md:py-2.5 rounded-full text-[9px] sm:text-[10px] md:text-xs tracking-wide boty-transition hover:bg-destructive/20"
                >
                  <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
