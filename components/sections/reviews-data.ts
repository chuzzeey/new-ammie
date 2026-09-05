// Review types - data will be fetched from Supabase
export interface ReviewMedia {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
}

export interface Review {
  id: string
  customerName: string
  customerAvatar: string
  location: string
  rating: number
  comment: string
  productName: string
  productImage: string
  media: ReviewMedia[]
  likes: number
  date: string
  comments: ReviewComment[]
}

export interface ReviewComment {
  id: string
  authorName: string
  authorAvatar: string
  text: string
  date: string
  likes?: number
}

const DEFAULT_AVATAR = "/placeholder-user.jpg"
const DEFAULT_PRODUCT_IMAGE = "https://res.cloudinary.com/deafv5ovi/image/upload/v1785659333/product_kbhg7v.png"

export function normalizeReviewComment(comment: Partial<ReviewComment> & Record<string, any>): ReviewComment {
  return {
    id: comment.id || `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorName: comment.authorName || comment.author_name || "Anonymous",
    authorAvatar: comment.authorAvatar || comment.author_avatar || DEFAULT_AVATAR,
    text: comment.text || comment.comment || "",
    date: comment.date || comment.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    likes: comment.likes || 0,
  }
}

export function normalizeReview(review: Partial<Review> & Record<string, any>): Review {
  return {
    id: review.id || "",
    customerName: review.customerName || review.customer_name || "Anonymous Customer",
    customerAvatar: review.customerAvatar || review.customer_avatar || DEFAULT_AVATAR,
    location: review.location || "Unknown location",
    rating: Number(review.rating || 0),
    comment: review.comment || "",
    productName: review.productName || review.product_name || "Unknown Product",
    productImage: review.productImage || review.product_image || DEFAULT_PRODUCT_IMAGE,
    media: Array.isArray(review.media) ? review.media : [],
    likes: Number(review.likes || 0),
    date: review.date || review.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    comments: Array.isArray(review.comments)
      ? review.comments.map(normalizeReviewComment)
      : [],
  }
}

// Empty array - reviews will be fetched from Supabase API
export const reviews: Review[] = []
