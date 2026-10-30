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
    <div className="group overflow-hidden rounded-md border border-border bg-background transition-shadow hover:shadow-md">
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
        <h3 className="mb-1 truncate text-sm font-medium text-foreground">{product.name}</h3>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Number(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(product.price) || 0)}</span>
                      </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="inline-flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(product.id)}
            className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-destructive/20 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
