"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, X, Upload, Trash2, MessageCircle, User } from "lucide-react"
import { Country } from "country-state-city"
import { toast } from "sonner"
import { Header } from "@/components/layout/header"
import { ReviewCard } from "@/components/sections/review-card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { reviews as initialReviews, normalizeReviewComment, type Review, type ReviewComment } from "@/components/sections/reviews-data"
import { uploadToCloudinary, isVideoUrl } from "@/lib/cloudinary"
import { ConfirmationModal } from "@/components/shared/confirmation-modal"

export default function AdminReviewsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [reviewList, setReviewList] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewEditingId, setReviewEditingId] = useState<string | null>(null)
  const [reviewPreviewMedia, setReviewPreviewMedia] = useState<Review["media"]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [products, setProducts] = useState<{ id: string; name: string; images: string[] }[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<{ id: string; customerName: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [selectedReviewComments, setSelectedReviewComments] = useState<ReviewComment[]>([])
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [deletingComment, setDeletingComment] = useState(false)
  const reviewsPerPage = 12
  const MAX_REVIEW_IMAGES = 4
  const [reviewForm, setReviewForm] = useState({
    customerName: "",
    country: "",
    city: "",
    rating: "5",
    comment: "",
    productName: "",
    productId: "",
    productImage: "https://res.cloudinary.com/deafv5ovi/image/upload/v1785659333/product_kbhg7v.png",
    customerAvatar: "/placeholder-user.jpg",
    likes: 0,
    date: new Date().toISOString().split("T")[0],
  })

  // Fetch products for selector
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const { data, error } = await supabase
          .from("products")
          .select("id, name, images")
          .order("name")

        if (error) throw error
        if (data) setProducts(data)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast.error("Failed to load products")
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [supabase, toast])

  const allCountries = useMemo(() =>
    Country.getAllCountries()
      .filter((country) => country.name !== "United States Minor Outlying Islands")
      .sort((a, b) => a.name.localeCompare(b.name)),
    []
  )

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase()

    if (!search) {
      return allCountries
    }

    return allCountries.filter((country) =>
      country.name.toLowerCase().includes(search) || country.isoCode.toLowerCase().includes(search)
    )
  }, [allCountries, countrySearch])

  const filteredProducts = useMemo(() => {
    const search = reviewForm.productName.trim().toLowerCase()

    if (!search) {
      return products.slice(0, 8)
    }

    return products.filter((product) =>
      product.name.toLowerCase().includes(search)
    ).slice(0, 8)
  }, [products, reviewForm.productName])

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true)
      const response = await fetch('/api/reviews?all=true&limit=100')

      if (response.ok) {
        const data = await response.json()
        setReviewList(data.reviews || [])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Failed to load reviews")
    } finally {
      setLoadingReviews(false)
    }
  }, [toast])

  useEffect(() => {
    setMounted(true)

    let mountedCheck = true
    let retries = 0
    const MAX_RETRIES = 5

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mountedCheck) return

      if (session) {
        setAuthChecking(false)
        return
      }

      retries++
      if (retries < MAX_RETRIES) {
        setTimeout(checkAuth, 500)
        return
      }

      router.replace("/admin/login")
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!mountedCheck) return

      if (event === "SIGNED_IN" && session) {
        setAuthChecking(false)
      } else if (event === "SIGNED_OUT") {
        router.replace("/admin/login")
      }
    })

    return () => {
      mountedCheck = false
      subscription.unsubscribe()
    }
  }, [router])

  // Fetch reviews after auth check
  useEffect(() => {
    if (!authChecking && mounted) {
      fetchReviews()
    }
  }, [authChecking, mounted, fetchReviews])

  // Real-time subscription for reviews
  useEffect(() => {
    if (!mounted || authChecking) return

    const channel = supabase
      .channel("admin-reviews-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => {
          fetchReviews()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mounted, authChecking, supabase, fetchReviews])

  // Real-time subscription for comments
  useEffect(() => {
    if (!mounted || authChecking || !showCommentsModal || !selectedReviewId) return

    const upsertSelectedComment = (comment: ReviewComment) => {
      setSelectedReviewComments((prev) => {
        const existing = prev.find((item) => item.id === comment.id)
        if (existing) {
          return prev.map((item) => (item.id === comment.id ? comment : item))
        }
        return [comment, ...prev]
      })
    }

    const channel = supabase
      .channel(`admin-comments-changes-${selectedReviewId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "review_comments",
          filter: `review_id=eq.${selectedReviewId}`
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setSelectedReviewComments((prev) => prev.filter((c) => c.id !== payload.old.id))
          } else if (payload.eventType === "INSERT") {
            upsertSelectedComment(normalizeReviewComment(payload.new))
          } else if (payload.eventType === "UPDATE") {
            const updatedComment = normalizeReviewComment(payload.new)
            upsertSelectedComment(updatedComment)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mounted, authChecking, showCommentsModal, selectedReviewId, supabase])

  const resetReviewForm = () => {
    setReviewForm({
      customerName: "",
      country: "",
      city: "",
      rating: "5",
      comment: "",
      productName: "",
      productId: "",
      productImage: "https://res.cloudinary.com/deafv5ovi/image/upload/v1785659333/product_kbhg7v.png",
      customerAvatar: "/placeholder-user.jpg",
      likes: 0,
      date: new Date().toISOString().split("T")[0],
    })
    setCountrySearch("")
    setShowCountryDropdown(false)
    setReviewEditingId(null)
    setReviewPreviewMedia([])
    setShowReviewModal(false)
  }

  const openAddReviewForm = () => {
    resetReviewForm()
    setShowReviewModal(true)
  }

  const editReview = (review: Review) => {
    const [city, country] = review.location.split(",").map((value) => value.trim())

    setReviewForm({
      customerName: review.customerName,
      country: country || "",
      city: city || review.location,
      rating: String(review.rating),
      comment: review.comment,
      productName: review.productName,
      productId: (review as any).product_id || "",
      productImage: review.productImage,
      customerAvatar: review.customerAvatar,
      likes: review.likes,
      date: review.date,
    })
    setCountrySearch(country || "")
    setReviewEditingId(review.id)
    setReviewPreviewMedia(review.media)
    setShowReviewModal(true)
  }

  const handleReviewFieldChange = (field: string, value: string) => {
    setReviewForm((prev) => ({ ...prev, [field]: value }))

    if (field === "country") {
      setCountrySearch(value)
    }
  }

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId)
    if (selectedProduct) {
      setReviewForm(prev => ({
        ...prev,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productImage: selectedProduct.images[0] || "https://res.cloudinary.com/deafv5ovi/image/upload/v1785659333/product_kbhg7v.png"
      }))
      setShowProductDropdown(false)
    }
  }

  const handleProductInputChange = (value: string) => {
    setReviewForm(prev => ({
      ...prev,
      productName: value,
      productId: "",
      productImage: "https://res.cloudinary.com/deafv5ovi/image/upload/v1785659333/product_kbhg7v.png",
    }))
    setShowProductDropdown(true)
  }

  const selectCountry = (countryName: string) => {
    setReviewForm((prev) => ({ ...prev, country: countryName }))
    setCountrySearch(countryName)
    setShowCountryDropdown(false)
  }

  const handleRemoveReviewMedia = (index: number) => {
    setReviewPreviewMedia((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (reviewPreviewMedia.length >= MAX_REVIEW_IMAGES) {
      toast.error(`Maximum ${MAX_REVIEW_IMAGES} images allowed`)
      event.target.value = ''
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const selectedFiles = Array.from(files)
    const invalidFile = selectedFiles.find((file) => {
      const isAllowed = allowedTypes.includes(file.type) || file.type.startsWith('image/')
      return !isAllowed
    })

    if (invalidFile) {
      toast.error('Only JPG, PNG, and WebP images are supported for reviews.')
      event.target.value = ''
      return
    }

    const remainingSlots = MAX_REVIEW_IMAGES - reviewPreviewMedia.length
    const filesToUpload = selectedFiles.slice(0, remainingSlots)

    if (selectedFiles.length > filesToUpload.length) {
      toast.info(`Only the first ${filesToUpload.length} selected files were added. The review keeps up to ${MAX_REVIEW_IMAGES} images.`)
    }

    setUploadingImage(true)
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const url = await uploadToCloudinary(file)
        return { type: 'image' as const, url }
      })

      const uploadedMedia = await Promise.all(uploadPromises)
      setReviewPreviewMedia(prev => [...prev, ...uploadedMedia] as Review["media"])
      toast.success(`${uploadedMedia.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Failed to upload images")
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const isReviewMediaValid = reviewPreviewMedia.length >= 1 && reviewPreviewMedia.length <= MAX_REVIEW_IMAGES

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isReviewMediaValid) {
      toast.error(`A review must have between 1 and ${MAX_REVIEW_IMAGES} images`)
      return
    }

    const location = [reviewForm.city.trim(), reviewForm.country.trim()].filter(Boolean).join(", ") || "Unknown location"

    try {
      const reviewData = {
        customer_name: reviewForm.customerName.trim() || "Unnamed Customer",
        customer_avatar: reviewForm.customerAvatar || "/placeholder-user.jpg",
        location,
        rating: Number(reviewForm.rating) || 5,
        comment: reviewForm.comment.trim() || "No comment provided",
        product_name: reviewForm.productName.trim() || "Unknown product",
        product_id: reviewForm.productId || null,
        product_image: reviewForm.productImage || "https://res.cloudinary.com/deafv5ovi/image/upload/v1785659333/product_kbhg7v.png",
        media: reviewPreviewMedia,
        likes: Number(reviewForm.likes) || 0,
        date: reviewForm.date || new Date().toISOString().split("T")[0],
        is_approved: true,
        is_featured: false,
      }

      let review: any
      if (reviewEditingId) {
        const { data, error } = await supabase
          .from("reviews")
          .update(reviewData)
          .eq("id", reviewEditingId)
          .select()
          .single()

        if (error) throw error
        review = data

        setReviewList((prev) =>
          prev.map((r) => (r.id === reviewEditingId ? { ...r, ...review } : r))
        )
        toast.success("Review updated successfully")
      } else {
        const { data, error } = await supabase
          .from("reviews")
          .insert([reviewData])
          .select()
          .single()

        if (error) throw error
        review = data

        setReviewList((prev) => [review, ...prev])
        toast.success("Review added successfully")
      }

      resetReviewForm()
    } catch (error) {
      console.error("Error saving review:", error)
      toast.error("Failed to save review")
    }
  }

  const totalPages = Math.ceil(reviewList.length / reviewsPerPage)
  const startIndex = (currentPage - 1) * reviewsPerPage
  const endIndex = startIndex + reviewsPerPage
  const currentReviews = reviewList.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  const getPageNumbers = () => {
    const pages: number[] = []

    let startPage = Math.max(1, currentPage - 1)
    let endPage = Math.min(totalPages, startPage + 2)

    if (endPage - startPage < 2) {
      startPage = Math.max(1, endPage - 2)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/admin/login"
  }

  const deleteReviewWrapper = (reviewId: string, customerName: string) => {
    setReviewToDelete({ id: reviewId, customerName })
    setShowDeleteModal(true)
  }

  const handleViewComments = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`)
      if (response.ok) {
        const comments = await response.json()
        setSelectedReviewComments(comments)
        setSelectedReviewId(reviewId)
        setShowCommentsModal(true)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast.error("Failed to load comments")
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedReviewId || deletingComment) return

    setDeletingComment(true)
    try {
      const response = await fetch(`/api/reviews/${selectedReviewId}/comments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment_id: commentId }),
      })

      if (response.ok) {
        setSelectedReviewComments((prev) => prev.filter((c) => c.id !== commentId))
        toast.success("Comment deleted successfully")
      } else {
        toast.error("Failed to delete comment")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    } finally {
      setDeletingComment(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewToDelete.id)

      if (error) throw error

      setReviewList((prev) => prev.filter((r) => r.id !== reviewToDelete.id))
      toast.success("Review deleted successfully")
      setShowDeleteModal(false)
      setReviewToDelete(null)
    } catch (error) {
      console.error("Error deleting review:", error)
      toast.error("Failed to delete review")
    } finally {
      setDeleting(false)
    }
  }

  if (!mounted || authChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </main>
    )
  }

  if (loadingReviews) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header variant="admin" onLogoutClick={handleLogout} />

      <div className="pt-35 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground mb-1 sm:mb-2">Review Manager</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Add and edit customer reviews</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/admin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-5 sm:px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <button
                type="button"
                onClick={openAddReviewForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 sm:px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Review
              </button>
            </div>
          </div>

          <Dialog open={showReviewModal} onOpenChange={(open) => {
            if (!open) {
              resetReviewForm()
            }
          }}>
            <DialogContent className="w-[min(96vw,1600px)] max-w-none sm:max-w-[95vw] md:max-w-[1400px] lg:max-w-[1500px] p-0 overflow-hidden rounded-[32px] border border-border/50 bg-card shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-[460px_minmax(0,1fr)] max-h-[90vh] overflow-hidden">
                <div className="bg-muted/40 p-6 md:p-7 lg:p-8 border-b lg:border-b-0 lg:border-r border-border/50 overflow-y-auto lg:min-h-0">
                  <div className="mb-5">
                    <h3 className="font-serif text-xl text-foreground">Review Images</h3>
                    <p className="text-xs text-muted-foreground mt-1">Add between 1 and {MAX_REVIEW_IMAGES} images for this review</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5 mx-auto max-w-[320px] sm:max-w-none">
                    {Array.from({ length: MAX_REVIEW_IMAGES }).map((_, index) => {
                      const media = reviewPreviewMedia[index]

                      return (
                        <div key={`slot-${index}`} className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden border border-border/50 bg-background">
                          {media ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRemoveReviewMedia(index)}
                                className="absolute top-1.5 right-1.5 z-10 rounded-full bg-background/90 p-1 text-foreground shadow-sm"
                                aria-label={`Remove media ${index + 1}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <img src={media.url} alt={`Review media ${index + 1}`} className="w-full h-full object-cover" />
                            </>
                          ) : (
                            <label className="flex h-full cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImage || reviewPreviewMedia.length >= MAX_REVIEW_IMAGES}
                              />
                              {uploadingImage ? (
                                <Loader2 className="w-5 h-5 sm:w-8 sm:h-8 animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5 sm:w-8 sm:h-8" />
                              )}
                            </label>
                          )}
                        </div>
                      )
                    })}

                    {reviewPreviewMedia.length < MAX_REVIEW_IMAGES && (
                      <label className="col-span-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/60 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Add multiple
                      </label>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {reviewPreviewMedia.length}/{MAX_REVIEW_IMAGES} images selected. Only the first {Math.min(MAX_REVIEW_IMAGES, reviewPreviewMedia.length)} marked files are kept.
                  </p>
                </div>

                <div className="p-6 md:p-8 lg:p-10 overflow-y-auto lg:min-h-0">
                  <DialogHeader className="mb-6 md:mb-8">
                    <DialogTitle className="font-serif text-2xl text-foreground">
                      {reviewEditingId ? "Edit Review" : "Add New Review"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Update this review without leaving the current page.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleReviewSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">Customer Name</span>
                      <input
                        type="text"
                        value={reviewForm.customerName}
                        onChange={(e) => handleReviewFieldChange("customerName", e.target.value)}
                        placeholder="Enter customer full name"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">Country</span>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={countrySearch}
                          onFocus={() => setShowCountryDropdown(true)}
                          onChange={(e) => {
                            handleReviewFieldChange("country", e.target.value)
                            setShowCountryDropdown(true)
                          }}
                          placeholder="e.g. United States"
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {showCountryDropdown && (
                        <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-background shadow-sm">
                          {filteredCountries.length === 0 ? (
                            <p className="px-3 py-3 text-sm text-muted-foreground">No country found</p>
                          ) : (
                            filteredCountries.map((country) => (
                              <button
                                key={country.isoCode}
                                type="button"
                                onClick={() => selectCountry(country.name)}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
                              >
                                <span>{country.name}</span>
                                <span className="text-xs text-muted-foreground">{country.isoCode}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">City</span>
                      <input
                        type="text"
                        value={reviewForm.city}
                        onChange={(e) => handleReviewFieldChange("city", e.target.value)}
                        placeholder="e.g. California"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">Product</span>
                      <div className="relative">
                        <input
                          type="text"
                          value={reviewForm.productName}
                          onFocus={() => setShowProductDropdown(true)}
                          onChange={(e) => handleProductInputChange(e.target.value)}
                          placeholder="Enter product name"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />

                        {showProductDropdown && reviewForm.productName && filteredProducts.length > 0 && (
                          <div className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                            {filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => handleProductSelect(product.id)}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
                              >
                                <span>{product.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {reviewForm.productId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Selected: {reviewForm.productName}
                        </p>
                      )}
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">Rating</span>
                      <div className="relative">
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          value={reviewForm.rating}
                          onChange={(e) => handleReviewFieldChange("rating", e.target.value)}
                          className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                        </select>
                      </div>
                    </label>

                    <label className="flex flex-col gap-2 md:col-span-2">
                      <span className="text-sm font-medium text-foreground">Review Comment</span>
                      <textarea
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(e) => handleReviewFieldChange("comment", e.target.value)}
                        placeholder="Enter customer review comment"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={!isReviewMediaValid}
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewEditingId ? "Update Review" : "Save Review"}
                      </button>
                      <button
                        type="button"
                        onClick={resetReviewForm}
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false)
              setReviewToDelete(null)
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete Review"
            message={`Are you sure you want to delete the review from "${reviewToDelete?.customerName}"? This action cannot be undone.`}
            confirmText="Yes, Delete"
            cancelText="Cancel"
            variant="danger"
          />

          {/* Comments Modal */}
          <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Review Comments</DialogTitle>
                <DialogDescription>
                  Manage comments for this review
                </DialogDescription>
              </DialogHeader>
              
              <div className="overflow-y-auto flex-1 -mx-2 px-2">
                {selectedReviewComments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No comments yet</p>
                ) : (
                  <div className="space-y-4">
                    {selectedReviewComments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-4 rounded-xl border border-border/50 bg-background">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground">{comment.authorName}</h4>
                            <span className="text-xs text-muted-foreground">{comment.date}</span>
                          </div>
                          <p className="text-sm text-foreground/80 mb-2">{comment.text}</p>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingComment}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {currentReviews.map((review) => (
              <div key={review.id} className="relative transition-all duration-300">
                <ReviewCard
                  review={review}
                  onViewMore={() => editReview(review)}
                  actionLabel="Edit review"
                />

                <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleViewComments(review.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] sm:text-xs font-medium text-foreground shadow-sm border border-border hover:bg-white cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Comments
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReviewWrapper(review.id, review.customerName)}
                    className="mt-6 inline-flex items-center justify-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] sm:text-xs font-medium text-white shadow-sm border border-red-600 hover:bg-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all duration-200 ${
                  currentPage === 1
                    ? "text-muted-foreground/20 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all duration-200 ${
                      currentPage === page
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all duration-200 ${
                  currentPage === totalPages
                    ? "text-muted-foreground/20 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}