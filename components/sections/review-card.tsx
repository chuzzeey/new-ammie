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
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer"
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
        <div className="relative bg-muted/30 rounded-t-2xl">
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
      <div className="p-2.5 md:p-4 flex flex-col flex-grow">
        {/* Customer Info */}
        <div className="flex items-center gap-1.5 mb-1">
          <Image
            src={normalizedReview.customerAvatar}
            alt={normalizedReview.customerName}
            width={20}
            height={20}
            className="w-5 h-5 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-foreground text-[11px] md:text-sm truncate mb-0.5">{normalizedReview.customerName}</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">{normalizedReview.location}</p>
            <div className="flex items-center gap-0.5">
              {[...Array(normalizedReview.rating)].map((_, i) => (
                <Star key={i} className="w-1.5 h-1.5 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
        </div>

        {/* Comment */}
        <p className="text-[9px] md:text-xs text-foreground/80 leading-relaxed mb-1.5 line-clamp-3 flex-grow">
          {normalizedReview.comment}
        </p>

        <div className="mb-1.5 rounded-xl bg-muted/40 px-2 py-1.5">
          <div className="mb-1 flex items-center gap-1 text-[8px] md:text-[10px] text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            <span>{commentCount} comment{commentCount === 1 ? "" : "s"}</span>
          </div>
          {firstComment && (
            <p className="text-[9px] md:text-xs text-foreground/80 line-clamp-2">
              {firstComment.text}
            </p>
          )}
        </div>

        {/* Product Tag */}
        <div className="mb-1.5 flex w-full items-center gap-1.5 pb-1.5 text-left opacity-100 select-none pointer-events-none">
          <div className="flex h-6 w-6 md:h-10 md:w-10 items-center justify-center rounded-md bg-muted text-primary flex-shrink-0">
            <Banknote className="h-3.5 w-3.5 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] md:text-xs text-muted-foreground">Purchased</p>
            <p className="text-[9px] md:text-sm font-medium text-foreground truncate">{normalizedReview.productName}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center pt-1.5">
          {onViewMore && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewMore(normalizedReview.id)
              }}
              className="inline-flex items-center px-3 py-1.5 text-[10px] md:text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-all duration-200"
            >
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}