import { processProductMedia, validateMedia } from './media-processing'

export interface ValidationError {
  field: string
  message: string
}

export interface ProductInput {
  name: string
  price: number
  category: string
  images: string[]
  rating: number
  review_count: number
  sizes: string
  badge?: string | null
  description?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  data?: ProductInput
}

/**
 * Validates product input data before submission.
 * Ensures all required fields are present and properly formatted.
 * 
 * @param input - Raw product input from form
 * @returns Validation result with errors or validated data
 */
export function validateProduct(input: {
  name: string
  price: string
  category: string
  images: string[]
  rating: string
  reviewCount: string
  sizes: string
  badge?: string
  description?: string
}): ValidationResult {
  const errors: ValidationError[] = []

  // Required field validation
  const trimmedName = input.name.trim()
  if (!trimmedName) {
    errors.push({ field: 'name', message: 'Product name is required' })
  } else if (trimmedName.length < 2) {
    errors.push({ field: 'name', message: 'Product name must be at least 2 characters' })
  }

  const trimmedPrice = input.price.trim()
  if (!trimmedPrice) {
    errors.push({ field: 'price', message: 'Price is required' })
  } else {
    const priceNum = parseFloat(trimmedPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.push({ field: 'price', message: 'Price must be a positive number' })
    }
  }

  const trimmedCategory = input.category.trim()
  if (!trimmedCategory) {
    errors.push({ field: 'category', message: 'Category is required' })
  }

  // Media validation
  const processedMedia = processProductMedia(input.images)
  const mediaValidation = validateMedia(processedMedia.media)
  if (mediaValidation) {
    errors.push({ field: 'images', message: mediaValidation })
  }

  // Rating validation
  const trimmedRating = input.rating.trim()
  if (!trimmedRating) {
    errors.push({ field: 'rating', message: 'Rating is required' })
  } else {
    const ratingNum = parseFloat(trimmedRating)
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      errors.push({ field: 'rating', message: 'Rating must be between 0 and 5' })
    }
  }

  // Review count validation
  const trimmedReviewCount = input.reviewCount.trim()
  if (!trimmedReviewCount) {
    errors.push({ field: 'reviewCount', message: 'Review count is required' })
  } else {
    const reviewCountNum = parseInt(trimmedReviewCount, 10)
    if (isNaN(reviewCountNum) || reviewCountNum < 0) {
      errors.push({ field: 'reviewCount', message: 'Review count must be a non-negative integer' })
    }
  }

  // If there are errors, return early
  if (errors.length > 0) {
    return {
      valid: false,
      errors
    }
  }

  // Build validated ProductInput
  const validatedData: ProductInput = {
    name: trimmedName,
    price: parseFloat(trimmedPrice),
    category: trimmedCategory,
    images: processedMedia.media,
    rating: parseFloat(trimmedRating),
    review_count: parseInt(trimmedReviewCount, 10),
    sizes: input.sizes.trim(),
    badge: input.badge?.trim() || null,
    description: input.description?.trim() || ''
  }

  return {
    valid: true,
    errors: [],
    data: validatedData
  }
}

/**
 * Quick validation check for individual fields.
 * Useful for real-time form validation.
 */
export function validateField(field: string, value: string): string | null {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'Name is required'
      if (value.trim().length < 2) return 'Name must be at least 2 characters'
      return null

    case 'price':
      if (!value.trim()) return 'Price is required'
      const price = parseFloat(value)
      if (isNaN(price) || price <= 0) return 'Price must be a positive number'
      return null

    case 'category':
      if (!value.trim()) return 'Category is required'
      return null

    case 'rating':
      if (!value.trim()) return 'Rating is required'
      const rating = parseFloat(value)
      if (isNaN(rating) || rating < 0 || rating > 5) return 'Rating must be 0-5'
      return null

    case 'reviewCount':
      if (!value.trim()) return 'Review count is required'
      const count = parseInt(value, 10)
      if (isNaN(count) || count < 0) return 'Review count must be 0 or more'
      return null

    default:
      return null
  }
}