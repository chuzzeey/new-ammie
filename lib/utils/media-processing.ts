/**
 * Media processing utilities for product images and videos.
 * 
 * Rules:
 * - Maximum 5 media slots total
 * - If video exists: video at index 0, images in slots 1-4 (max 1 video + 4 images)
 * - If no video: maximum 5 images
 */

const MAX_TOTAL_MEDIA = 5
const MAX_IMAGES_WITH_VIDEO = 4
const MAX_IMAGES_WITHOUT_VIDEO = 5

export interface ProcessedMedia {
  media: string[]
  hasVideo: boolean
  videoIndex: number | null
  imageCount: number
}

/**
 * Processes raw image/video URLs into a properly ordered media array.
 * 
 * @param images - Array of image/video URLs (may contain empty strings)
 * @returns Processed media array with video at index 0 if present
 * 
 * @example
 * processProductMedia(['video.mp4', 'img1.jpg', 'img2.jpg', ''])
 * // Returns: ['video.mp4', 'img1.jpg', 'img2.jpg']
 */
export function processProductMedia(images: string[]): ProcessedMedia {
  // Remove empty values and trim whitespace
  const cleaned = images
    .map(img => img.trim())
    .filter(img => img.length > 0)

  if (cleaned.length === 0) {
    return {
      media: [],
      hasVideo: false,
      videoIndex: null,
      imageCount: 0
    }
  }

  // Separate videos from images
  const videos = cleaned.filter(img => isVideoUrl(img))
  const imageUrls = cleaned.filter(img => !isVideoUrl(img))

  // Enforce limits
  const hasVideo = videos.length > 0
  const maxImages = hasVideo ? MAX_IMAGES_WITH_VIDEO : MAX_IMAGES_WITHOUT_VIDEO
  const limitedImages = imageUrls.slice(0, maxImages)

  // Build final array: video first (if exists), then images
  const media: string[] = []
  if (hasVideo) {
    media.push(videos[0]) // Use first video only
  }
  media.push(...limitedImages)

  return {
    media,
    hasVideo,
    videoIndex: hasVideo ? 0 : null,
    imageCount: limitedImages.length
  }
}

/**
 * Checks if a URL is a video URL.
 * Detects Cloudinary video URLs and common video extensions.
 */
export function isVideoUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return false
  
  const lower = url.toLowerCase()
  
  // Cloudinary video URLs
  if (lower.includes('/video/upload/')) return true
  
  // Common video extensions
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']
  return videoExtensions.some(ext => lower.endsWith(ext) || lower.includes(ext))
}

/**
 * Validates that media array meets requirements.
 * 
 * @param media - Processed media array
 * @param requireVideo - Whether at least one video is required
 * @returns Error message if validation fails, null if valid
 */
export function validateMedia(media: string[], requireVideo = false): string | null {
  if (media.length === 0) {
    return 'At least one image or video is required'
  }

  if (requireVideo && !media.some(url => isVideoUrl(url))) {
    return 'At least one video is required'
  }

  if (media.length > MAX_TOTAL_MEDIA) {
    return `Maximum ${MAX_TOTAL_MEDIA} media items allowed`
  }

  return null
}