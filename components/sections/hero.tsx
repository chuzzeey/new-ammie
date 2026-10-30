import Link from "next/link"
import { ArrowRight } from "lucide-react"

const heroImage = "https://res.cloudinary.com/dqyan6prx/image/upload/v1793326722/WhatsApp_Image_2026-10-29_at_21.58.23.jpg"

export function Hero() {
  return (
    <section className="relative flex min-h-[min(860px,92svh)] items-center overflow-hidden bg-[#121212]">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroImage}
          alt="Ammie N premium hair collection"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "25% center",
            filter: "saturate(0.9) contrast(1.02)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
      </div>

      <div className="relative z-10 w-full px-5 pb-24 pt-36 sm:px-8 lg:px-12 xl:pt-40">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl text-left">
            <span className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85 animate-blur-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <span className="h-px w-8 bg-white/70" />
              Premium hair, made for you
            </span>
            <h2 className="mb-6 font-sans text-5xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              <span className="block animate-blur-in opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>Wear confidence.</span>
              <span className="block animate-blur-in opacity-0 text-white/80" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>Naturally you.</span>
            </h2>
            <p className="mb-9 max-w-lg text-base leading-7 text-white/85 sm:text-lg animate-blur-in opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              Premium wigs and extensions crafted for beauty, comfort, and effortless style.
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row animate-blur-in opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
              <Link
                href="/shop"
                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-semibold text-foreground boty-transition hover:bg-white/90"
              >
                Shop the collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 boty-transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/80">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Scroll</span>
        <div className="relative h-8 w-px overflow-hidden bg-white/30">
          <div className="absolute left-0 top-0 h-1/2 w-full animate-pulse bg-white" />
        </div>
      </div>
    </section>
  )
}
