"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const heroImages = [
  "https://res.cloudinary.com/deafv5ovi/image/upload/v1785729916/WhatsApp_Image_2026-08-02_at_9.18.28_PM_xa9aol.jpg",
  "https://res.cloudinary.com/deafv5ovi/image/upload/v1785729915/WhatsApp_Image_2026-08-02_at_9.18.29_PM_nehk7c.jpg",
]

export function Hero() {
  const [desktopOrder, setDesktopOrder] = useState([0, 1])

  useEffect(() => {
    const timer = setInterval(() => {
      setDesktopOrder((current) => [current[1], current[0]])
    }, 2600)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: '#e3e1e2' }}>
      <div className="absolute inset-0 border-b border-border/50 overflow-hidden xl:top-[8%] xl:h-[92%] xl:rounded-b-[2rem]">
        <div className="hidden xl:flex h-full w-full gap-4 px-4">
          {desktopOrder.map((index) => (
            <div key={`${heroImages[index]}-${index}`} className="h-full flex-1 overflow-hidden rounded-[1.5rem] transition-all duration-700 ease-in-out">
              <img
                src={heroImages[index]}
                alt="Ammie N premium hair collection"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: "center center",
                  filter: "saturate(0.9) contrast(1.02)",
                }}
              />
            </div>
          ))}
        </div>

        <div className="xl:hidden absolute inset-0">
          <img
            src={heroImages[0]}
            alt="Ammie N premium hair collection"
            className="h-full w-full object-cover"
            style={{
              objectPosition: "center center",
              filter: "saturate(0.9) contrast(1.02)",
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/10 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg lg:max-w-xl mx-auto text-center lg:text-left">
            <span className="text-sm uppercase mb-6 block text-black animate-blur-in opacity-0 tracking-normal" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              Premium Hair & Extensions
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 text-black">
              <span className="block animate-blur-in opacity-0 font-semibold" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>Wear confidence.</span>
              <span className="block animate-blur-in opacity-0 font-semibold xl:text-9xl text-3xl sm:text-6xl md:text-7xl lg:text-8xl break-words" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>Naturally you.</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-10 max-w-sm sm:max-w-md mx-auto text-black animate-blur-in opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              Premium wigs and hair extensions crafted for beauty, comfort, and effortless style. Black
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-blur-in opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
              <Link
                href="/shop"
                className="group inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 boty-transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-black">
        <span className="text-xs tracking-widest uppercase font-bold">Scroll</span>
        <div className="w-px h-12 bg-foreground/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-foreground/60 animate-pulse" />
        </div>
      </div>
    </section>
  )
}
