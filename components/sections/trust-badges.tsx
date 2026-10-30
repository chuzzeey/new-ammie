"use client"

import { useEffect, useRef, useState } from "react"
import { Award, Scissors, Sparkles, Heart } from "lucide-react"

const badges = [
  {
    icon: Award,
    title: "Premium Quality",
    description: "100% virgin human hair"
  },
  {
    icon: Scissors,
    title: "Expert Crafted",
    description: "Hand-tied bleached knots"
  },
  {
    icon: Sparkles,
    title: "Tangle-Free",
    description: "Natural cuticle alignment"
  },
  {
    icon: Heart,
    title: "Ethically Sourced",
    description: "Fair trade certified"
  }
]

export function TrustBadges() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section className="bg-background py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div 
          ref={sectionRef}
          className="grid grid-cols-2 divide-x divide-y divide-border/80 border-y border-border/80 sm:grid-cols-4 sm:divide-y-0"
        >
          {badges.map((badge, index) => (
            <div
              key={badge.title}
              className={`px-3 py-5 text-center transition-all duration-700 ease-out sm:px-5 sm:py-7 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <badge.icon className="mb-3 mx-auto size-6 text-primary sm:size-7" strokeWidth={1.5} />
              <h3 className="mb-1 text-xs font-medium text-foreground sm:text-sm">{badge.title}</h3>
              <p className="text-[10px] leading-4 text-muted-foreground sm:text-xs">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
