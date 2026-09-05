"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Minus, Plus, ChevronDown, Leaf, Heart, Award, Recycle, Star, Check, Play, MessageCircle, User, Copy } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useCart } from "@/components/providers/cart-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase, type Product } from "@/lib/supabase"
import { getOptimizedProductImage } from "@/lib/cloudinary/image-utils"
import { type ReviewComment } from "@/components/sections/reviews-data"
import { isVideoUrl, getSafeVideoUrl } from "@/lib/cloudinary"
import { ThumbnailVideo } from "./components/thumbnail-video"

const benefits = [
  { icon: Leaf, label: "100% Human Hair" },
  { icon: Heart, label: "Ethically Sourced" },
  { icon: Recycle, label: "Eco-Friendly" },
  { icon: Award, label: "Premium Quality" }
]

const formatUsdPrice = (value: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g

function EmailLink({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = email
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <a
        href={`mailto:${email}`}
        className="font-bold text-primary hover:text-primary/80 underline underline-offset-2 boty-transition"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 boty-transition cursor-pointer"
        aria-label={`Copy ${email}`}
        title="Copy email"
      >
        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      </button>
    </span>
  )
}

function renderWithEmails(text: string) {
  const parts = text.split(EMAIL_REGEX)
  return parts.map((part, index) => {
    if (EMAIL_REGEX.test(part)) {
      return <EmailLink key={index} email={part} />
    }
    return <span key={index}>{part}</span>
  })
}

type AccordionSection = "details" | "howToUse" | "ingredients" | "delivery"

// Dynamically import the VideoPlayer — only loaded when a product has videos.
// This saves ~40KB (hls.js + player component) from the initial bundle
// for products without video content.
const VideoPlayer = dynamic(
  () => import("./components/video-player").then((mod) => mod.VideoPlayer),
  {
    // Show a loading skeleton while the video player chunk downloads
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-muted flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false, // Video player is client-only (needs browser APIs for hls.js)
  },
)

interface ProductPageClientProps {
  productId: string
  initialProduct: Product
  initialSuggestions: Product[]
}

export function ProductPageClient({ productId, initialProduct, initialSuggestions }: ProductPageClientProps) {
  const router = useRouter()
  const { addItem, setIsOpen } = useCart()
  
  const [product, setProduct] = useState<Product>(initialProduct)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Product[]>(initialSuggestions)
  
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [openAccordion, setOpenAccordion] = useState<AccordionSection | null>("details")
  const [isAdded, setIsAdded] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [preloaded, setPreloaded] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [productComments, setProductComments] = useState<ReviewComment[]>([])
  const [isHeadSizeChartOpen, setIsHeadSizeChartOpen] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      
      if (data) {
        setProduct(data)
        if (data.sizes) {
          const sizesArray = data.sizes.split(',').map((s: string) => s.trim())
          if (sizesArray.length > 0) {
            setSelectedSize(sizesArray[0])
          }
        }
      }
    } catch (error: any) {
      if (!error || error.code !== 'PGRST116') {
        console.error('Error fetching product:', error)
      }
      router.push('/shop')
    } finally {
      setLoading(false)
    }
  }, [productId, router])

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('id', productId)
        .limit(4)

      if (error) throw error
      setSuggestions(data || [])
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }, [productId])

  // Initialize selected size from initial product data
  useEffect(() => {
    if (initialProduct.sizes) {
      const sizesArray = initialProduct.sizes.split(',').map((s: string) => s.trim())
      if (sizesArray.length > 0 && !selectedSize) {
        setSelectedSize(sizesArray[0])
      }
    }
  }, [initialProduct, selectedSize])

  // Real-time subscription for product changes
  useEffect(() => {
    const channel = supabase
      .channel(`product-detail-changes-${productId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `id=eq.${productId}`,
        },
        () => {
          fetchProduct()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId, fetchProduct])

  useEffect(() => {
    window.scrollTo(0, 0)
    setSelectedImageIndex(0)
    setPreloaded(false)
  }, [productId])

  // Close head size chart lightbox on Escape key
  useEffect(() => {
    if (!isHeadSizeChartOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsHeadSizeChartOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isHeadSizeChartOpen])

  const realImages = product
    ? product.images.filter((img) => img && img.trim() !== "")
    : []

  useEffect(() => {
    if (!product || preloaded) return
    const imgs = product.images.filter((img) => img && img.trim() !== "")
    if (imgs.length === 0) return
    let loaded = 0
    const total = imgs.length
    imgs.forEach((url) => {
      const img = new window.Image()
      img.src = getOptimizedProductImage(url, "detail")
      img.onload = () => { loaded++; if (loaded === total) setPreloaded(true) }
      img.onerror = () => { loaded++; if (loaded === total) setPreloaded(true) }
    })
  }, [product, preloaded])

  useEffect(() => {
    if (!product || realImages.length === 0) return
    const currentIndex = selectedImageIndex
    const indicesToPreload = [
      currentIndex,
      (currentIndex + 1) % realImages.length,
      (currentIndex - 1 + realImages.length) % realImages.length,
    ]
    indicesToPreload.forEach((index) => {
      const imgUrl = realImages[index]
      if (!imgUrl || !isVideoUrl(imgUrl)) return
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = getSafeVideoUrl(imgUrl)
      video.load()
    })
  }, [product, selectedImageIndex, realImages])

  const thumbnailSlots = (() => {
    const slots = [...realImages]
    while (slots.length < 5) slots.push("")
    return slots.slice(0, 5)
  })()

  const toggleAccordion = (section: AccordionSection) => {
    setOpenAccordion(openAccordion === section ? null : section)
  }

  const handleAddToCart = () => {
    if (!product) return
    setIsAdded(true)
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getOptimizedProductImage(realImages[0] || "/placeholder.svg", "card")
    })
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleBuyNow = () => {
    if (!product) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getOptimizedProductImage(realImages[0] || "/placeholder.svg", "card")
    })
    setIsOpen(true)
  }

  const handleViewProductComments = async () => {
    try {
      // Fetch reviews for this product
      const response = await fetch(`/api/reviews?product_id=${product.id}`)
      if (response.ok) {
        const data = await response.json()
        // Extract all comments from all reviews
        const allComments: ReviewComment[] = []
        data.reviews?.forEach((review: any) => {
          if (review.comments && Array.isArray(review.comments)) {
            allComments.push(...review.comments)
          }
        })
        setProductComments(allComments)
        setShowCommentsModal(true)
      }
    } catch (error) {
      console.error("Error fetching product comments:", error)
    }
  }

  const goToPrevImage = () => {
    if (realImages.length === 0) return
    setSelectedImageIndex((prev) => prev === 0 ? realImages.length - 1 : prev - 1)
  }

  const goToNextImage = () => {
    if (realImages.length === 0) return
    setSelectedImageIndex((prev) => prev === realImages.length - 1 ? 0 : prev + 1)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const delta = touchStartX.current - touchEndX.current
    const swipeThreshold = 50
    if (delta > swipeThreshold) goToNextImage()
    else if (delta < -swipeThreshold) goToPrevImage()
    touchStartX.current = null
    touchEndX.current = null
  }

  const defaultDeliveryText =
    "All deliveries are handled by DHL and are door to door. Ready to deliver wigs are processed within 3 to 5 business days, then standard shipping takes 5 to 7 business days. To start a return, email amysglamroom@gmail.com within 7 days of delivery. Ready to ship wigs are eligible for store credit or exchange, subject to a 25% restocking fee. The security tag must be fully intact, the lace must be uncut, the wig must be completely unworn, and the unit must be free from perfumes, smoke, glue, or other smells. The customer is responsible for tracked return shipping."

  const accordionItems: { key: AccordionSection; title: string; content: string }[] = [
    { key: "delivery", title: "Delivery & Returns", content: defaultDeliveryText }
  ]

  if (!product) {
    return (
      <main className="min-h-screen overflow-x-hidden">
        <Header />
        <div className="pt-28 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="text-lg text-muted-foreground">Product not found</div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const sizesArray = product.sizes ? product.sizes.split(',').map((s) => s.trim()) : []

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} is a premium quality hair product from Ammie N.`,
    "image": realImages.map(img => getOptimizedProductImage(img, "detail")),
    "sku": product.id,
    "brand": { "@type": "Brand", "name": "Ammie N" },
    "offers": {
      "@type": "Offer",
      "url": `https://ammiestore.com/product/${product.id}`,
      "priceCurrency": "USD",
      "price": product.price.toString(),
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": { "@type": "MonetaryAmount", "value": "0", "currency": "USD" },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
          "transitTime": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 7, "unitCode": "DAY" }
        },
        "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "NG" }
      }
    },
    "aggregateRating": product.review_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating.toString(),
      "reviewCount": product.review_count.toString()
    } : undefined
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground boty-transition mb-8">
            <ChevronLeft className="w-4 h-4" />
            Back to Shop
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-stretch">
                <div
                  className="relative flex-1 rounded-3xl overflow-hidden bg-card boty-shadow group touch-pan-y"
                  style={{ minHeight: '400px' }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {isVideoUrl(realImages[selectedImageIndex] || "") ? (
                    <VideoPlayer
                      videoUrl={realImages[selectedImageIndex]}
                      posterUrl={getOptimizedProductImage(realImages[selectedImageIndex], "detail")}
                      alt={`${product.name} - Video ${selectedImageIndex + 1}`}
                    />
                  ) : (
                    <Image
                      src={getOptimizedProductImage(realImages[selectedImageIndex] || "/placeholder.svg", "detail")}
                      alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover boty-transition"
                      priority
                    />
                  )}
                </div>
                {realImages.length > 0 && (
                  <div className="flex flex-col gap-3 shrink-0">
                    {thumbnailSlots.map((img, index) =>
                      img ? (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative w-16 h-16 md:w-[76px] md:h-[76px] rounded-xl overflow-hidden boty-transition ${
                            selectedImageIndex === index
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        >
                          {isVideoUrl(img) ? (
                            <ThumbnailVideo videoUrl={img} posterUrl={getOptimizedProductImage(img, "thumbnail")} />
                          ) : (
                            <Image src={getOptimizedProductImage(img, "thumbnail")} alt={`${product.name} thumbnail ${index + 1}`} fill sizes="76px" className="object-cover" />
                          )}
                          {isVideoUrl(img) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                              <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                                <Play className="w-3 h-3 md:w-3.5 md:h-3.5 text-foreground ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          )}
                        </button>
                      ) : (
                        <div key={index} className="w-16 h-16 md:w-[76px] md:h-[76px] rounded-xl bg-card" />
                      )
                    )}
                  </div>
                )}
              </div>
              {realImages.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {realImages.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-2 h-2 rounded-full boty-transition ${selectedImageIndex === index ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="mb-8">
                <span className="text-sm tracking-[0.3em] uppercase text-primary mb-2 block">Ammie Hair</span>
                <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < product.rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">({product.review_count} reviews)</span>
                </div>
                <button
                  type="button"
                  onClick={handleViewProductComments}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  View Comments
                </button>
                <p className="text-foreground/80 leading-relaxed">
                  {product.description || `${product.name} is a premium quality hair product designed to enhance your natural beauty and elevate your style`}
                </p>
              </div>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl font-medium text-foreground">{formatUsdPrice(product.price)}</span>
              </div>
              {sizesArray.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">Size</label>
                  <div className="flex gap-3">
                    {sizesArray.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 rounded-full text-sm boty-transition boty-shadow ${selectedSize === size ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-card/80"}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-8">
                <label className="text-sm font-medium text-foreground mb-3 block">Quantity</label>
                <div className="inline-flex items-center gap-4 bg-card rounded-full px-2 py-2 boty-shadow">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition" aria-label="Decrease quantity">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition" aria-label="Increase quantity">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm tracking-wide boty-transition boty-shadow cursor-pointer ${isAdded ? "bg-primary/80 text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                >
                  {isAdded ? (<><Check className="w-4 h-4" /> Added to Cart</>) : "Add to Cart"}
                </button>
                <button type="button" onClick={handleBuyNow} className="flex-1 inline-flex items-center justify-center gap-2 bg-transparent border border-primary text-primary px-8 py-4 rounded-full text-sm tracking-wide boty-transition hover:bg-primary hover:text-primary-foreground cursor-pointer">
                  Buy Now
                </button>
              </div>
              {/* Head Size Chart */}
              <div className="mb-8">
                <span className="text-sm tracking-[0.3em] uppercase text-primary mb-3 block">
                  Head Size Chart
                </span>
                <button
                  type="button"
                  onClick={() => setIsHeadSizeChartOpen(true)}
                  className="block w-full rounded-2xl overflow-hidden boty-shadow bg-card p-3 cursor-zoom-in boty-transition hover:opacity-90"
                  aria-label="Zoom head size chart"
                >
                  <img
                    src="https://res.cloudinary.com/deafv5ovi/image/upload/v1787176685/WhatsApp_Image_2026-08-17_at_1.36.04_PM_nwcmdq.jpg"
                    alt="Ammie Hair head size chart"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </button>
              </div>

              <div className="border-t border-border/50">
                {accordionItems.map((item) => (
                  <div key={item.key} className="border-b border-border/50">
                    <button type="button" onClick={() => toggleAccordion(item.key)} className="w-full flex items-center justify-between py-5 text-left">
                      <span className="font-medium text-foreground">{item.title}</span>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground boty-transition ${openAccordion === item.key ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`overflow-hidden boty-transition ${openAccordion === item.key ? "max-h-96 pb-5" : "max-h-0"}`}>
                      <p className="text-sm text-muted-foreground leading-relaxed">{renderWithEmails(item.content)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {suggestions.length > 0 && (
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">You May Also Like</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="group transition-all duration-500 ease-out opacity-100 scale-100">
                  <Link href={`/product/${suggestion.id}`}>
                    <div className="bg-background rounded-3xl overflow-hidden boty-shadow boty-transition group-hover:scale-[1.02]">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        <Image src={getOptimizedProductImage(suggestion.images[0] || "/placeholder.svg", "card")} alt={suggestion.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover boty-transition group-hover:scale-105" />
                      </div>
                      <div className="p-3 md:p-5 pb-4">
                        <h3 className="font-serif text-sm md:text-lg text-foreground mb-0.5 md:mb-1">{suggestion.name}</h3>
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                          <span className="text-xs md:text-base font-medium text-foreground">{formatUsdPrice(suggestion.price)}</span>
                        </div>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation() }} className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 md:px-4 md:py-2.5 rounded-full text-[10px] md:text-xs tracking-wide boty-transition hover:bg-primary/90 boty-shadow">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Head Size Chart Lightbox */}
      {isHeadSizeChartOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
          onClick={() => setIsHeadSizeChartOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Head size chart zoomed view"
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] overflow-auto rounded-2xl bg-white p-3 md:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsHeadSizeChartOpen(false)}
              className="absolute top-2 right-2 md:top-4 md:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 boty-transition z-10"
              aria-label="Close head size chart"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src="https://res.cloudinary.com/deafv5ovi/image/upload/v1787176685/WhatsApp_Image_2026-08-17_at_1.36.04_PM_nwcmdq.jpg"
              alt="Ammie Hair head size chart enlarged"
              className="w-full h-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Comments Modal */}
      <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Product Comments</DialogTitle>
            <DialogDescription>
              All comments from customer reviews
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 -mx-2 px-2">
            {productComments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {productComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 rounded-xl border border-border/50 bg-background">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground">{comment.authorName}</h4>
                        <span className="text-xs text-muted-foreground">{comment.date}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </>
  )
}
