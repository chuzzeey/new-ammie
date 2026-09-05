// Re-export the singleton client from client.ts
export { supabase, createClientBrowser } from './client'

// Database types (simplified)
export interface Product {
  id: string
  name: string
  price: number
  images: string[]
  badge: string | null
  category: string
  sizes: string
  rating: number
  review_count: number
  description: string
  created_at: string
  updated_at: string
}

export interface ProductInsert {
  name: string
  price: number
  images: string[]
  badge?: string | null
  category: string
  sizes: string
  rating?: number
  review_count?: number
  description?: string
}

// Alias for ProductInput - used for form validation and service functions
export type ProductInput = ProductInsert
