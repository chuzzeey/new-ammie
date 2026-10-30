"use client"

import { useEffect, useState } from "react"

const brandName = "AmmieN.shop"
const slogan = "Premium hair, made for you"

export function BrandLoader() {
  const [isMounted, setIsMounted] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setIsVisible(false), 2900)
    const removeTimer = window.setTimeout(() => setIsMounted(false), 3300)

    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(removeTimer)
    }
  }, [])

  if (!isMounted) return null

  return (
    <div
      role="status"
      aria-label={`Loading ${brandName}`}
      className={`brand-loader${isVisible ? "" : " brand-loader-hidden"}`}
    >
      <span className="sr-only">Loading {brandName}</span>
      <div className="brand-loader-content" aria-hidden="true">
        <span className="brand-loader-name">
          {Array.from(brandName, (character, index) => (
            <span
              key={`${character}-${index}`}
              className="brand-loader-letter"
              style={{ animationDelay: `${index * 160}ms` }}
            >
              {character}
            </span>
          ))}
        </span>
        <span className="brand-loader-slogan">{slogan}</span>
      </div>
    </div>
  )
}
