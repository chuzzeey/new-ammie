import { supabase } from '@/lib/supabase'
import type { Product, ProductInput } from '@/lib/supabase'
import { processProductMedia } from '@/lib/utils/media-processing'

export interface ProductListOptions {
  category?: string
  searchQuery?: string
  orderBy?: 'created_at' | 'price' | 'name'
  orderDirection?: 'asc' | 'desc'
  limit?: number
}

export interface ProductListResult {
  data: Product[]
  error: Error | null
  count?: number
}

/**
 * Fetches products from Supabase with optional filtering and sorting.
 * 
 * @param options - Filter and sort options
 * @returns Product list result with data and error
 * 
 * @example
 * const { data, error } = await getProducts({ category: 'ready_to_ship_braided_wigs', limit: 10 })
 */
export async function getProducts(options: ProductListOptions = {}): Promise<ProductListResult> {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Apply filters
    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.searchQuery) {
      query = query.ilike('name', `%${options.searchQuery}%`)
    }

    // Apply sorting
    const orderBy = options.orderBy || 'created_at'
    const orderDirection = options.orderDirection || 'desc'
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error, count } = await query

    if (error) {
      return { data: [], error: new Error(error.message), count: count || 0 }
    }

    return { data: data || [], error: null, count: count || 0 }
  } catch (error) {
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Failed to fetch products'),
      count: 0 
    }
  }
}

/**
 * Creates a new product in Supabase.
 * 
 * @param productData - Validated product input data
 * @returns Created product or error
 * 
 * @example
 * const { data, error } = await createProduct({
 *   name: 'Wig 1',
 *   price: 15000,
 *   category: 'ready_to_ship_braided_wigs',
 *   images: ['video.mp4', 'img1.jpg'],
 *   rating: 4.5,
 *   review_count: 10,
 *   sizes: 'S,M,L'
 * })
 */
export async function createProduct(productData: ProductInput): Promise<{ data: Product | null; error: Error | null }> {
  try {
    // Ensure media is properly processed before saving
    const processedMedia = processProductMedia(productData.images)
    
    const payload: ProductInput = {
      ...productData,
      images: processedMedia.media
    }

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to create product') 
    }
  }
}

/**
 * Updates an existing product in Supabase.
 * 
 * IMPORTANT: This function performs a partial update - only the fields
 * provided in productData will be updated. Unspecified fields remain unchanged.
 * 
 * @param productId - UUID of the product to update
 * @param productData - Partial product data to update
 * @returns Updated product or error
 * 
 * @example
 * const { data, error } = await updateProduct('uuid-here', {
 *   price: 20000,
 *   images: ['new-video.mp4', 'img1.jpg']
 * })
 */
export async function updateProduct(
  productId: string,
  productData: Partial<ProductInput>
): Promise<{ data: Product | null; error: Error | null }> {
  try {
    // Process media if provided
    const updatePayload: any = { ...productData }
    
    if (productData.images) {
      const processedMedia = processProductMedia(productData.images)
      updatePayload.images = processedMedia.media
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to update product') 
    }
  }
}

/**
 * Deletes a product from Supabase.
 * 
 * @param productId - UUID of the product to delete
 * @returns Success status or error
 * 
 * @example
 * const { success, error } = await deleteProduct('uuid-here')
 */
export async function deleteProduct(productId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Failed to delete product') 
    }
  }
}

/**
 * Fetches a single product by ID.
 * 
 * @param productId - UUID of the product
 * @returns Product or error
 * 
 * @example
 * const { data, error } = await getProductById('uuid-here')
 */
export async function getProductById(productId: string): Promise<{ data: Product | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to fetch product') 
    }
  }
}

/**
 * Batch creates multiple products.
 * Useful for bulk imports.
 * 
 * @param products - Array of validated product inputs
 * @returns Created products or error
 */
export async function createProducts(products: ProductInput[]): Promise<{ data: Product[] | null; error: Error | null }> {
  try {
    // Process media for all products
    const processedProducts = products.map(product => ({
      ...product,
      images: processProductMedia(product.images).media
    }))

    const { data, error } = await supabase
      .from('products')
      .insert(processedProducts)
      .select()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to create products') 
    }
  }
}

/**
 * Batch deletes multiple products by ID.
 * 
 * @param productIds - Array of product UUIDs to delete
 * @returns Success status or error
 */
export async function deleteProducts(productIds: string[]): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', productIds)

    if (error) {
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Failed to delete products') 
    }
  }
}