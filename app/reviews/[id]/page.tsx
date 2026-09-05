"use client"

import { useState, useEffect, use, useRef, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Heart, MessageCircle, ChevronLeft, ChevronRight, Play, Send, ArrowLeft, X, Banknote } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { normalizeReview, normalizeReviewComment, type Review, type ReviewComment } from "@/components/sections/reviews-data"
import { supabase } from "@/lib/supabase"

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [galleryTouchStartX, setGalleryTouchStartX] = useState<number | null>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [userName, setUserName] = useState("")
  const [pendingComment, setPendingComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const mediaRef = useRef<HTMLDivElement>(null)

  const upsertComment = (comment: ReviewComment) => {
    setComments((current) => {
      const existing = current.find((item) => item.id === comment.id)
      if (existing) {
        return current.map((item) => (item.id === comment.id ? comment : item))
      }
      return [comment, ...current]
    })
  }

  const removeComment = (commentId: string) => {
    setComments((current) => current.filter((comment) => comment.id !== commentId))
  }

  // Fetch review from API
  useEffect(() => {
    const fetchReview = async () => {
      try {
        console.log('Fetching review with ID:', resolvedParams.id)
        const response = await fetch(`/api/reviews/${resolvedParams.id}`)
        
        console.log('API response status:', response.status, response.statusText)
        
        if (response.ok) {
          const data = await response.json()
          console.log('API response data:', data)
          const normalizedReview = normalizeReview(data)
          setReview(normalizedReview)
          setComments((data.comments || []).map((comment: ReviewComment) => normalizeReviewComment(comment)))
        } else {
          const errorData = await response.json()
          console.error('API error response:', errorData)
        }
      } catch (error) {
        console.error('Error fetching review:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReview()
  }, [resolvedParams.id])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  useEffect(() => {
    if (!resolvedParams.id) return

    const channel = supabase
      .channel(`review-comments-${resolvedParams.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'review_comments', filter: `review_id=eq.${resolvedParams.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            upsertComment(normalizeReviewComment(payload.new))
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            upsertComment(normalizeReviewComment(payload.new))
          }

          if (payload.eventType === 'DELETE' && payload.old) {
            removeComment(payload.old.id)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [resolvedParams.id])

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-32 pb-20 text-center">
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </main>
    )
  }

  if (!review) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-4xl font-serif text-foreground mb-4">Review Not Found</h1>
          <p className="text-muted-foreground mb-8">The review you're looking for doesn't exist.</p>
          <Link href="/" className="text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </main>
    )
  }

  const currentMedia = review.media[currentMediaIndex] ?? review.media[0]

  const showNextMedia = () => {
    if (review.media.length <= 1) return
    setCurrentMediaIndex((prev) => (prev + 1) % review.media.length)
  }

  const showPrevMedia = () => {
    if (review.media.length <= 1) return
    setCurrentMediaIndex((prev) => (prev - 1 + review.media.length) % review.media.length)
  }

  const handleScroll = () => {
    if (!mediaRef.current) return

    const firstChild = mediaRef.current.firstElementChild as HTMLElement | null
    const itemWidth = firstChild?.offsetWidth ?? 112
    const gap = 12
    const index = Math.round(mediaRef.current.scrollLeft / Math.max(itemWidth + gap, 1))
    setCurrentMediaIndex(index)
  }

  const scrollToThumbnail = (index: number) => {
    setCurrentMediaIndex(index)
    mediaRef.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }

  const handleGalleryTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setGalleryTouchStartX(event.changedTouches[0]?.clientX ?? null)
  }

  const handleGalleryTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (galleryTouchStartX === null || review.media.length <= 1) return

    const touchEndX = event.changedTouches[0]?.clientX ?? 0
    const deltaX = touchEndX - galleryTouchStartX

    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        showNextMedia()
      } else {
        showPrevMedia()
      }
    }

    setGalleryTouchStartX(null)
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || isSubmittingComment) return

    setPendingComment(commentText)
    setIsNameModalOpen(true)
  }

  const submitCommentWithName = async () => {
    if (!pendingComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)

    try {
      const response = await fetch(`/api/reviews/${resolvedParams.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_name: userName.trim() || "You",
          author_avatar: "/placeholder-user.jpg",
          text: pendingComment,
        }),
      })

      if (response.ok) {
        setCommentText("")
        setPendingComment("")
        setUserName("")
        setIsNameModalOpen(false)
      } else {
        console.error('Failed to save comment')
      }
    } catch (error) {
      console.error('Error saving comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const closeNameModal = () => {
    if (isSubmittingComment) return
    setIsNameModalOpen(false)
    setPendingComment("")
    setUserName("")
  }

  const openModal = (index: number) => {
    setModalImageIndex(index)
    setCurrentMediaIndex(index)
    setIsModalOpen(true)
    setIsVideoPlaying(false)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setIsVideoPlaying(false)
  }

  const showNextModalImage = () => {
    setModalImageIndex((prev) => (prev + 1) % review.media.length)
    setIsVideoPlaying(false)
  }

  const showPrevModalImage = () => {
    setModalImageIndex((prev) => (prev - 1 + review.media.length) % review.media.length)
    setIsVideoPlaying(false)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null)
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || review.media.length <= 1) return

    const touchEndX = event.changedTouches[0]?.clientX ?? 0
    const deltaX = touchEndX - touchStartX

    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        showNextModalImage()
      } else {
        showPrevModalImage()
      }
    }

    setTouchStartX(null)
  }

  const handleBackdropInteraction = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const target = event.target as HTMLElement

    if (target.closest("[data-lightbox-content='true']")) {
      return
    }

    closeModal()
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-30 pb-16 sm:pt-30 sm:pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/#reviews"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Reviews</span>
          </Link>

          {/* Review Card - Full Size */}
          <div className="overflow-hidden rounded-[1.5rem] border border-border/50 bg-white shadow-xl">
            {/* Media Carousel */}
            {review.media.length > 0 && (
              <div className="relative bg-muted/30 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-sm font-medium text-foreground">Customer photos</p>
                  <span className="text-xs text-muted-foreground">Tap to expand</span>
                </div>

                <div
                  className="relative overflow-hidden rounded-[1.25rem] border border-border/60 bg-background"
                  onTouchStart={handleGalleryTouchStart}
                  onTouchEnd={handleGalleryTouchEnd}
                >
                  {review.media.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPrevMedia}
                        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-md transition hover:bg-white"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={showNextMedia}
                        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-md transition hover:bg-white"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => openModal(currentMediaIndex)}
                    className="relative block w-full overflow-hidden"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]">
                      {currentMedia.type === 'image' ? (
                        <Image
                          src={currentMedia.url}
                          alt={`Review media ${currentMediaIndex + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 80vw"
                          priority
                        />
                      ) : (
                        <>
                          <Image
                            src={currentMedia.thumbnail || currentMedia.url}
                            alt={`Video thumbnail ${currentMediaIndex + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 80vw"
                            priority
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg sm:h-20 sm:w-20">
                              <Play className="ml-1 h-8 w-8 text-primary sm:h-10 sm:w-10" fill="currentColor" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
                    <div className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white backdrop-blur-sm sm:text-xs">
                      Swipe left or right to change images
                    </div>
                  </div>
                </div>

                <div
                  ref={mediaRef}
                  onScroll={handleScroll}
                  className="mt-4 flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar"
                >
                  {review.media.map((media, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setCurrentMediaIndex(index)
                        scrollToThumbnail(index)
                        if (index === currentMediaIndex) openModal(index)
                      }}
                      className="group relative flex-shrink-0 snap-center overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm"
                    >
                      <div className="relative h-24 w-24 overflow-hidden sm:h-28 sm:w-28 md:h-32 md:w-32">
                        {media.type === 'image' ? (
                          <Image
                            src={media.url}
                            alt={`Review media ${index + 1}`}
                            fill
                            className={`object-cover transition-all duration-300 ${index === currentMediaIndex ? 'scale-105 saturate-125' : 'group-hover:scale-105'}`}
                            sizes="(max-width: 640px) 96px, 112px"
                            priority={index === 0}
                          />
                        ) : (
                          <>
                            <Image
                              src={media.thumbnail || media.url}
                              alt={`Video thumbnail ${index + 1}`}
                              fill
                              className={`object-cover transition-all duration-300 ${index === currentMediaIndex ? 'scale-105 saturate-125' : 'group-hover:scale-105'}`}
                              sizes="(max-width: 640px) 96px, 112px"
                              priority={index === 0}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 sm:h-12 sm:w-12">
                                <Play className="ml-1 h-5 w-5 text-primary sm:h-6 sm:w-6" fill="currentColor" />
                              </div>
                            </div>
                          </>
                        )}
                        {index === currentMediaIndex && (
                          <div className="absolute inset-0 ring-2 ring-primary ring-inset" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {review.media.length > 1 && (
                  <div className="mt-3 flex justify-center gap-2">
                    {review.media.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentMediaIndex(index)
                          if (mediaRef.current) {
                            mediaRef.current.scrollTo({
                              left: index * 112,
                              behavior: 'smooth',
                            })
                          }
                        }}
                        className={`h-2 rounded-full transition-all duration-200 ${
                          index === currentMediaIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/40'
                        }`}
                        aria-label={`Go to media ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Review Content */}
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Customer Info */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
                <Image
                  src={review.customerAvatar}
                  alt={review.customerName}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div className="flex-grow">
                  <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <h1 className="text-xl font-bold text-foreground">{review.customerName}</h1>
                    <div className="flex items-center gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.location}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                  {review.comment}
                </p>
              </div>

              {/* Product Tag */}
              <div className="mb-6 flex items-center gap-3 rounded-2xl bg-muted/50 p-4 opacity-100 pointer-events-none select-none">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                  <Banknote className="h-7 w-7" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Purchased Product</p>
                  <p className="text-sm font-semibold text-foreground">{review.productName}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4 border-b border-border/50 pb-6 sm:gap-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{comments.length} comments</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Comments ({comments.length})
                </h3>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Image
                      src="/placeholder-user.jpg"
                      alt="Your avatar"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover sm:flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows={2}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={!commentText.trim() || isSubmittingComment}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {isSubmittingComment ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 border-b border-border/30 pb-4 last:border-0">
                      <Image
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-grow">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">{comment.authorName}</h4>
                          <span className="text-xs text-muted-foreground">{comment.date}</span>
                        </div>
                        <p className="mb-2 text-sm leading-relaxed text-foreground/80">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Name Input Modal */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-[1.5rem] border border-border/50 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Enter Your Name</h2>
              <button
                type="button"
                onClick={closeNameModal}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeNameModal}
                className="rounded-full px-6 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCommentWithName}
                disabled={isSubmittingComment}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal/Lightbox */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={handleBackdropInteraction}
          onTouchEnd={handleBackdropInteraction}
          aria-label="Close image viewer"
        >
          <div
            className="relative z-10 flex h-full w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            {review.media.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showPrevModalImage(); }}
                className="pointer-events-auto absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:bg-white md:left-4 md:h-14 md:w-14"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 text-foreground md:h-7 md:w-7" />
              </button>
            )}

            {/* Image Container */}
            <div 
              data-lightbox-content="true"
              className="pointer-events-auto relative mx-4 h-[80vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {review.media[modalImageIndex].type === 'image' ? (
                <Image
                  src={review.media[modalImageIndex].url}
                  alt={`Review media ${modalImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black">
                  <video
                    src={review.media[modalImageIndex].url}
                    poster={review.media[modalImageIndex].thumbnail}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onEnded={() => setIsVideoPlaying(false)}
                  />
                  {!isVideoPlaying && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/90 shadow-lg md:h-28 md:w-28">
                        <Play className="ml-1 h-12 w-12 text-primary md:h-14 md:w-14" fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Dots */}
              {review.media.length > 1 && (
                <div className="pointer-events-auto absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  {review.media.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setModalImageIndex(index)
                      }}
                      className={`h-2.5 rounded-full transition-all ${
                        index === modalImageIndex ? "w-7 bg-white" : "w-2.5 bg-white/50"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  closeModal()
                }}
                className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
                aria-label="Close image viewer"
              >
                Close
              </button>
            </div>

            {/* Next Button */}
            {review.media.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showNextModalImage(); }}
                className="pointer-events-auto absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:bg-white md:right-4 md:h-14 md:w-14"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 text-foreground md:h-7 md:w-7" />
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
