"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Star, Play, Banknote, MessageCircle } from "lucide-react"
import { normalizeReview, type Review } from "./reviews-data"

interface ReviewCardProps {
  review: Review
  onViewMore?: (reviewId: string) => void
  actionLabel?: string
}

export function ReviewCard({ review, onViewMore, actionLabel = "View More" }: ReviewCardProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const mediaRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const normalizedReview = normalizeReview(review)
  const commentCount = normalizedReview.comments?.length ?? 0
  const firstComment = normalizedReview.comments?.[0]

  const handleScroll = () => {
    if (mediaRef.current) {
      const scrollLeft = mediaRef.current.scrollLeft
      const width = mediaRef.current.offsetWidth
      const index = Math.round(scrollLeft / width)
      setCurrentMediaIndex(index)
    }
  }

  const handleNavigateToReview = () => {
    if (onViewMore) {
      onViewMore(review.id)
      return
    }

    router.push(`/reviews/${review.id}`)
  }

  return (
    <div
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-md border border-border/80 bg-background transition-shadow duration-300 hover:shadow-md"
      onClick={handleNavigateToReview}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          handleNavigateToReview()
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Media Carousel */}
      {normalizedReview.media.length > 0 && (
        <div className="relative bg-muted">
          <div
            ref={mediaRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar"
          >
            {normalizedReview.media.map((media, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-full snap-center"
                style={{ aspectRatio: '1/1' }}
              >
                {media.type === 'image' ? (
                  <Image
                    src={media.url}
                    alt={`Review media ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={media.thumbnail || media.url}
                      alt={`Video thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          {normalizedReview.media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {normalizedReview.media.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setCurrentMediaIndex(index);
                    if (mediaRef.current) {
                      mediaRef.current.scrollTo({ left: index * mediaRef.current.offsetWidth, behavior: 'smooth' })
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentMediaIndex ? 'bg-white w-4' : 'bg-white/60'
                  }`}
                  aria-label={`Go to media ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Content */}
      <div className="flex flex-grow flex-col p-4 sm:p-5">
        {/* Customer Info */}
        <div className="mb-3 flex items-center gap-2">
          <Image
            src={normalizedReview.customerAvatar}
            alt={normalizedReview.customerName}
            width={20}
            height={20}
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
          />
          <div className="flex-grow min-w-0">
            <h3 className="mb-0.5 truncate text-sm font-medium text-foreground">{normalizedReview.customerName}</h3>
            <p className="mb-1 text-xs text-muted-foreground">{normalizedReview.location}</p>
            <div className="flex items-center gap-0.5">
              {[...Array(normalizedReview.rating)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
        </div>

        {/* Comment */}
        <p className="mb-4 line-clamp-3 flex-grow text-sm leading-6 text-foreground/80">
          {normalizedReview.comment}
        </p>

        <div className="mb-3 rounded-sm bg-muted px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            <span>{commentCount} comment{commentCount === 1 ? "" : "s"}</span>
          </div>
          {firstComment && (
            <p className="line-clamp-2 text-xs leading-5 text-foreground/80">
              {firstComment.text}
            </p>
          )}
        </div>

        {/* Product Tag */}
        <div className="mb-3 flex w-full items-center gap-2 text-left opacity-100 select-none pointer-events-none">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-muted text-primary">
            <Banknote className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Purchased</p>
            <p className="truncate text-sm font-medium text-foreground">{normalizedReview.productName}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-start border-t border-border pt-3">
          {onViewMore && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewMore(normalizedReview.id)
              }}
              className="inline-flex items-center text-xs font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}