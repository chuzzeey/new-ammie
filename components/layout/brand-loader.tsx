"use client"

import { useEffect, useState } from "react"

const brandName = "AmmieN.shop"
const slogan = "Premium hair, made for you"

export function BrandLoader() {
  const [isMounted, setIsMounted] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [typedCharacters, setTypedCharacters] = useState(0)

  useEffect(() => {
    let characterCount = 0
    const typingTimer = window.setInterval(() => {
      characterCount += 1
      setTypedCharacters(characterCount)
      if (characterCount >= brandName.length) {
        window.clearInterval(typingTimer)
      }
    }, 180)
    const hideTimer = window.setTimeout(() => setIsVisible(false), 2900)
    const removeTimer = window.setTimeout(() => setIsMounted(false), 3300)

    return () => {
      window.clearInterval(typingTimer)
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
        <span className="brand-loader-name">{brandName.slice(0, typedCharacters)}</span>
        <span className="brand-loader-slogan">{slogan}</span>
      </div>
    </div>
  )
}
