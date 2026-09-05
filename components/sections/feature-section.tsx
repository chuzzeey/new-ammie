"use client"

import { useEffect, useRef, useState } from "react"

const featureImages = [
  "https://res.cloudinary.com/deafv5ovi/image/upload/v1785729916/WhatsApp_Image_2026-08-02_at_9.18.28_PM_xa9aol.jpg",
  "https://res.cloudinary.com/deafv5ovi/image/upload/v1785729915/WhatsApp_Image_2026-08-02_at_9.18.29_PM_nehk7c.jpg",
]

export function FeatureSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [isVideoVisible, setIsVideoVisible] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const bentoRef = useRef<HTMLDivElement>(null)
  const videoSectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const videoObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVideoVisible(true)
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

    if (bentoRef.current) {
      observer.observe(bentoRef.current)
    }

    if (videoSectionRef.current) {
      videoObserver.observe(videoSectionRef.current)
    }

    if (headerRef.current) {
      headerObserver.observe(headerRef.current)
    }

    return () => {
      if (bentoRef.current) {
        observer.unobserve(bentoRef.current)
      }
      if (videoSectionRef.current) {
        videoObserver.unobserve(videoSectionRef.current)
      }
      if (headerRef.current) {
        headerObserver.unobserve(headerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % featureImages.length)
    }, 3200)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div 
          ref={videoSectionRef}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center my-0 py-20"
        >
          {/* Image carousel */}
          <div 
            className={`relative aspect-[4/5] overflow-hidden rounded-3xl boty-shadow transition-all duration-700 ease-out ${
              isVideoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {featureImages.map((image, index) => (
              <img
                key={image}
                src={image}
                alt="Why Ammie Hair"
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out ${
                  index === activeImageIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
                }`}
                style={{
                  objectPosition: 'center center',
                  filter: 'saturate(0.9) contrast(1.02)',
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div
            ref={headerRef}
            className={`transition-all duration-700 ease-out text-center lg:text-left ${
              isVideoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            <span className={`text-sm tracking-[0.3em] uppercase text-primary mb-4 block ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}>
              Why Ammie Hair
            </span>
            <h2 className={`font-serif text-4xl leading-tight text-foreground mb-6 text-balance md:text-7xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}}>
              Hair that inspires.
            </h2>
            <p className={`text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 max-w-md mx-auto lg:mx-0 ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.6s', animationFillMode: 'forwards' } : {}}>
              We believe premium hair should feel natural, look flawless, and make you unstoppable.
              Every piece is crafted with the finest quality and care.
            </p>

          </div>
        </div>
      </div>
    </section>
  )
}
