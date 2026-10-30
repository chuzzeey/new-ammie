"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ReviewCard } from "@/components/sections/review-card"
import { normalizeReview, type Review } from "@/components/sections/reviews-data"

export default function ReviewsPage() {
  const [headerVisible, setHeaderVisible] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const headerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const reviewsPerPage = 12

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?page=${currentPage}&limit=${reviewsPerPage}`)
        if (response.ok) {
          const data = await response.json()
          setReviews((data.reviews || []).map((review: Review) => normalizeReview(review)))
          setTotalPages(data.totalPages || 0)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [currentPage, reviewsPerPage])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true)
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (headerRef.current) {
      observer.observe(headerRef.current)
    }
    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current)
      }
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const handleViewMore = (reviewId: string) => {
    window.location.href = `/reviews/${reviewId}`
  }

  const currentReviews = reviews

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  // Generate page numbers to display (sliding window of 3 consecutive pages)
  const getPageNumbers = () => {
    const pages: number[] = []
    
    // Show 3 consecutive pages: 1,2,3 or 2,3,4 or 3,4,5 etc.
    let startPage = Math.max(1, currentPage - 1)
    let endPage = Math.min(totalPages, startPage + 2)
    
    // Adjust if we're at the end to always show 3 pages
    if (endPage - startPage < 2) {
      startPage = Math.max(1, endPage - 2)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-32 sm:pt-40">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          {/* Header */}
          <div ref={headerRef} className="mb-10 max-w-2xl sm:mb-12">
            <span className={`mb-3 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}>
              All Reviews
            </span>
            <h1 className={`mb-3 font-sans text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}}>
              Customer Reviews
            </h1>
            <p className={`max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.6s', animationFillMode: 'forwards' } : {}}>
              See what our customers are saying about their Ammie Hair experience
            </p>
          </div>

          {/* Reviews Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          ) : currentReviews.length > 0 ? (
            <div ref={sectionRef} className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={isVisible ? { animationDelay: '0.8s', animationFillMode: 'forwards' } : {}}>
              {currentReviews.map((review, index) => (
                <div
                  key={review.id}
                  className="transition-all duration-700 ease-out"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <ReviewCard review={review} onViewMore={handleViewMore} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {/* Previous Button */}
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'text-muted-foreground/20 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'text-muted-foreground/20 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes blur-in {
          0% {
            opacity: 0;
            filter: blur(10px);
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blur-in {
          animation: blur-in 0.8s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>

      <Footer />
    </main>
  )
}