"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type Product } from "@/lib/supabase"
import { getOptimizedProductImage } from "@/lib/cloudinary/image-utils"

export interface ShopProduct {
  id: string
  name: string
  price: number
  image: string
  badge: string | null
  category: string
  description: string
}

function transformProduct(product: Product): ShopProduct {
  const rawImage = product.images[0] || "/placeholder.svg"
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: getOptimizedProductImage(rawImage, "card"),
    badge: product.badge,
    category: product.category,
    description: product.description || "",
  }
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map(transformProduct)
    },
  })
}

export function useLatestProducts(limit: number = 6) {
  return useQuery({
    queryKey: ["products", "latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(transformProduct)
    },
  })
}
