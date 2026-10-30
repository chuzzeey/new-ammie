"use client"

import React from "react"
import { ArrowRight } from "lucide-react"

const YOUTUBE_URL = "https://www.youtube.com/@AmmieStore"

export function Newsletter() {
  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-md bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">
            Join us on YouTube
          </span>
          <h2 className="mb-4 font-sans text-3xl font-medium leading-tight tracking-tight text-balance sm:text-4xl md:text-5xl">
            Get inspired by Ammie
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-sm leading-6 text-primary-foreground/80 sm:text-base">
            Watch tutorials, styling tips, and behind-the-scenes content from the Ammie family.
          </p>

          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-md bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
          >
            {/* YouTube Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Subscribe to YouTube
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </div>
    </section>
  )
}
