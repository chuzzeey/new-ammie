"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ChevronRight } from "lucide-react"
import { ReviewCard } from "./review-card"
import { normalizeReview, type Review } from "./reviews-data"

export function ReviewsSection() {
  const [headerVisible, setHeaderVisible] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const headerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews?limit=6')
        if (response.ok) {
          const data = await response.json()
          setReviews((data.reviews || []).map((review: Review) => normalizeReview(review)))
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  // Display first 6 reviews on homepage
  const displayedReviews = reviews.slice(0, 6)

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
    // Navigate to dynamic review page
    window.location.href = `/reviews/${reviewId}`
  }

  return (
    <section id="reviews" ref={sectionRef} className="py-12 md:py-16 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-8 md:mb-12 pb-8 md:pb-12 border-b border-border/30 rounded-b-3xl">
          <span className={`text-sm tracking-[0.3em] uppercase text-primary mb-4 block ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}>
            Customer Reviews
          </span>
          <h2 className={`font-serif text-4xl leading-tight text-foreground mb-6 text-balance md:text-7xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}}>
            What our customers say
          </h2>
          <p className={`text-base sm:text-lg text-muted-foreground leading-relaxed mx-auto max-w-2xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.6s', animationFillMode: 'forwards' } : {}}>
            Real reviews from real customers who love our products
          </p>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        ) : displayedReviews.length > 0 ? (
          <div className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-10 md:mb-12 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={isVisible ? { animationDelay: '0.8s', animationFillMode: 'forwards' } : {}}>
            {displayedReviews.map((review, index) => (
              <div
                key={review.id}
                className="transition-all duration-700 ease-out"
                style={{ 
                  animationDelay: `${index * 100}ms`,
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

        {/* View More Button */}
        <div className="text-center mt-8 md:mt-10">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 md:px-8 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-medium tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            View All Reviews
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Link>
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
    </section>
  )
}