"use client"

import { useEffect, useRef, useState } from "react"

const headSizeChartImage =
  "https://res.cloudinary.com/deafv5ovi/image/upload/v1787176685/WhatsApp_Image_2026-08-17_at_1.36.04_PM_nwcmdq.jpg"

export function HeadSizeChart() {
  const [isVisible, setIsVisible] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      sectionObserver.observe(sectionRef.current)
    }

    if (headerRef.current) {
      headerObserver.observe(headerRef.current)
    }

    return () => {
      if (sectionRef.current) {
        sectionObserver.unobserve(sectionRef.current)
      }
      if (headerRef.current) {
        headerObserver.unobserve(headerRef.current)
      }
    }
  }, [])

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="mb-9 max-w-2xl">
          <span className={`mb-3 block text-xs font-semibold uppercase tracking-[0.16em] text-primary ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}>
            Find Your Fit
          </span>
          <h2 className={`mb-3 font-sans text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}}>
            Head Size Chart
          </h2>
          <p className={`max-w-md text-sm leading-6 text-muted-foreground sm:text-base ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.6s', animationFillMode: 'forwards' } : {}}>
            Find your perfect fit with our detailed head size measurement guide
          </p>
        </div>

        {/* Chart Image */}
        <div
          ref={sectionRef}
          className={`max-w-4xl mx-auto transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="overflow-hidden rounded-md border border-border bg-card p-2 sm:p-5">
            <img
              src={headSizeChartImage}
              alt="Ammie Hair head size chart"
              className="h-auto w-full rounded-sm object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
}