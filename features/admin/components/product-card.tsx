"use client"

import Image from "next/image"
import { Star, Edit3, Trash2, Play } from "lucide-react"
import { isVideoUrl, getVideoPosterUrl } from "@/lib/cloudinary"
import type { ProductForm } from "./types"

interface ProductCardProps {
  product: ProductForm
  onEdit: (product: ProductForm) => void
  onDelete: (id: string) => void
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="bg-background rounded-3xl overflow-hidden boty-shadow border border-border/50 group">
      <div className="relative aspect-square bg-muted overflow-hidden cursor-pointer">
        {product.images[0] && (
          <>
            {isVideoUrl(product.images[0]) ? (
              <Image
                src={getVideoPosterUrl(product.images[0])}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            )}
            {isVideoUrl(product.images[0]) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                  <Play className="w-4 h-4 text-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="p-4 cursor-pointer">
        <h3 className="font-serif text-base text-foreground mb-1 truncate">{product.name}</h3>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Number(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({product.reviewCount})</span>
        </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(product.price) || 0)}</span>
                      </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-card text-foreground px-3 py-2 rounded-full text-xs tracking-wide boty-transition hover:bg-card/80 border border-border/50 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(product.id)}
            className="inline-flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive px-3 py-2 rounded-full text-xs tracking-wide boty-transition hover:bg-destructive/20 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
