"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, X, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/layout/header"
import { ConfirmationModal } from "@/components/shared/confirmation-modal"
import { supabase, type Product } from "@/lib/supabase"
import type { ProductForm } from "@/features/admin/components/types"
import { emptyForm } from "@/features/admin/components/types"
import ImageGallery from "@/features/admin/components/image-gallery"
import BasicInfoForm from "@/features/admin/components/basic-info-form"
import PricingForm from "@/features/admin/components/pricing-form"
import RatingForm from "@/features/admin/components/rating-form"
import ProductGrid from "@/features/admin/components/product-grid"
import { getProductDescription } from "@/lib/services/product-descriptions"
import { validateProduct, type ValidationResult } from "@/lib/utils/product-validation"
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/services/products"

// Structured logging helper
const log = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AdminPage] ${message}`, data || '')
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[AdminPage] ${message}`, error || '')
  },
  info: (message: string, data?: any) => {
    console.info(`[AdminPage] ${message}`, data || '')
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<ProductForm>({ ...emptyForm })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [sizes, setSizes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const descriptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auth guard: redirect to login if no session ──
  useEffect(() => {
    let mounted = true
    let retries = 0
    const MAX_RETRIES = 5

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session) {
        log.debug('Auth session found', { userId: session.user.id })
        setAuthChecking(false)
        return
      }

      // Session not available yet — retry a few times (handles race condition after login)
      retries++
      if (retries < MAX_RETRIES) {
        log.debug(`Auth retry ${retries}/${MAX_RETRIES}...`)
        setTimeout(checkAuth, 500)
        return
      }

      // Still no session after retries — redirect to login
      log.debug('No auth session after retries, redirecting to login')
      router.replace("/admin/login")
    }

    checkAuth()

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        if (!mounted) return
        log.debug('Auth state changed', { event, hasSession: !!session })
        if (event === 'SIGNED_IN' && session) {
          setAuthChecking(false)
        } else if (event === 'SIGNED_OUT') {
          router.replace("/admin/login")
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    setMounted(true)
    if (!authChecking) {
      fetchProducts()
    }
  }, [authChecking])

  // Set a distinct document title for the admin page
  useEffect(() => {
    document.title = "Admin Dashboard — Ammie N"
    return () => {
      document.title = "Ammie N — Premium Hair & Extensions"
    }
  }, [])

  // ── Real-time subscription ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("admin-products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Fetch all products from Supabase
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getProducts({
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      if (result.error) {
        throw result.error
      }

      setProducts(result.data)
      log.debug('Products fetched', { count: result.data.length })
    } catch (error) {
      log.error('Error fetching products', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateField = (field: string, value: string) => {
    // Auto-capitalize the first letter of the product name
    let processedValue = value
    if (field === "name") {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1)
    }

    setForm((prev) => ({ ...prev, [field]: processedValue }))

    // Debounce auto-description generation: wait 4 seconds after the user
    // stops typing the product name before generating the description.
    if (field === "name") {
      if (descriptionTimerRef.current) {
        clearTimeout(descriptionTimerRef.current)
      }
      descriptionTimerRef.current = setTimeout(() => {
        setForm((prev) => {
          if (!prev.name.trim()) return prev
          return { ...prev, description: getProductDescription(prev.name) }
        })
      }, 4000)
    }
  }

  const handleRegenerateDescription = () => {
    setForm((prev) => ({
      ...prev,
      description: getProductDescription(prev.name)
    }))
  }

  const handleSizesChange = (newSizes: string[]) => {
    setSizes(newSizes)
    setForm((prev) => ({ ...prev, sizes: newSizes.join(',') } as ProductForm))
  }

  const updateImage = (index: number, value: string) => {
    setForm((prev) => {
      const newImages = [...prev.images]
      newImages[index] = value
      return { ...prev, images: newImages }
    })
  }

  const generateId = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (submitting) {
      log.debug('Submission already in progress, ignoring duplicate submit')
      return
    }

    setSubmitting(true)

    try {
      log.info('Submitting product form', {
        editingId,
        formSnapshot: {
          name: form.name,
          price: form.price,
          category: form.category,
          images: form.images,
          rating: form.rating,
          reviewCount: form.reviewCount,
          sizes: form.sizes
        }
      })

      // Validate form data
      const validationResult: ValidationResult = validateProduct({
        name: form.name,
        price: form.price,
        category: form.category,
        images: form.images,
        rating: form.rating,
        reviewCount: form.reviewCount,
        sizes: form.sizes,
        badge: form.badge,
        description: form.description
      })

      if (!validationResult.valid) {
        const errorMessages = validationResult.errors.map(e => `${e.field}: ${e.message}`).join(', ')
        log.error('Validation failed', { errors: validationResult.errors })
        toast.error(`Validation failed: ${errorMessages}`)
        return
      }

      if (!validationResult.data) {
        log.error('Validation returned valid but no data')
        toast.error('Validation error. Please try again.')
        return
      }

      log.info('Validation passed', { validatedData: validationResult.data })

      // Submit to Supabase
      if (editingId) {
        log.info('Updating existing product', { productId: editingId })
        
        const { data, error } = await updateProduct(editingId, validationResult.data)

        if (error) {
          log.error('Update failed', { error, productId: editingId })
          throw error
        }

        log.info('Product updated successfully', { productId: editingId, data })
        toast.success(`Product "${validationResult.data.name}" updated successfully!`)

        // Trigger ISR revalidation
        revalidateProductPage(editingId)
      } else {
        log.info('Creating new product')
        
        const { data, error } = await createProduct(validationResult.data)

        if (error) {
          log.error('Create failed', { error })
          throw error
        }

        log.info('Product created successfully', { productId: data?.id })
        toast.success(`Product "${validationResult.data.name}" added successfully!`)
      }

      log.info('Resetting form after successful submission')
      resetForm()
    } catch (error) {
      // Structured error logging
      log.error('Failed to save product', {
        error,
        editingId,
        formData: {
          name: form.name,
          price: form.price,
          category: form.category,
          images: form.images,
          rating: form.rating,
          reviewCount: form.reviewCount
        }
      })

      const errorAny = error as any
      const message = errorAny?.message || errorAny?.error_description || 'Unknown error'
      const details = errorAny?.details ? ` — ${errorAny.details}` : ''
      const hint = errorAny?.hint ? ` (hint: ${errorAny.hint})` : ''
      
      toast.error(`Failed to save product: ${message}${details}${hint}`)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setSelectedImageIndex(0)
    setShowAddForm(false)
    setSizes([])
    log.debug('Form reset')
  }

  const openAddForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setSelectedImageIndex(0)
    setSizes([])
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
    log.debug('Add form opened')
  }

  const editProduct = (product: Product) => {
    const productSizes = product.sizes ? product.sizes.split(',').map(s => s.trim()) : []
    setForm({
      id: product.id,
      name: product.name,
      badge: product.badge || "",
      price: String(product.price),
      // 5 total image slots: index 0 is the main image (and doubles as the
      // first thumbnail), indices 1-4 are the remaining 4 thumbnails.
      images: [...product.images, "", "", "", "", ""].slice(0, 5),
      sizes: product.sizes,
      rating: String(product.rating),
      reviewCount: String(product.review_count),
      description: product.description || "",
      category: product.category
    })
    setSizes(productSizes)
    setEditingId(product.id)
    setSelectedImageIndex(0)
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
    log.debug('Edit form opened', { productId: product.id, productName: product.name })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/admin/login"
  }

  /**
   * Trigger on-demand ISR revalidation for a product page.
   */
  const revalidateProductPage = async (productId: string) => {
    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/product/${productId}` }),
      })
      log.debug('ISR revalidation triggered', { productId })
    } catch (error) {
      log.error('Revalidation request failed', { error, productId })
      // Non-critical — the page will still revalidate on its 60s ISR interval
    }
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      const { error } = await deleteProduct(productToDelete.id)

      if (error) {
        log.error('Delete failed', { error, productId: productToDelete.id })
        throw error
      }

      log.info('Product deleted successfully', { productId: productToDelete.id })
      toast.success(`Product "${productToDelete.name}" deleted permanently!`)
      setProductToDelete(null)
    } catch (error) {
      log.error('Error deleting product', { error, productId: productToDelete?.id })
      toast.error('Failed to delete product')
    }
  }

  const deleteProductWrapper = (id: string) => {
    const product = products.find(p => p.id === id)
    if (product) {
      setProductToDelete({ id: product.id, name: product.name })
      setShowDeleteModal(true)
    }
  }

  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products

  // Show loading spinner while checking auth
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

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header variant="admin" onLogoutClick={handleLogout} />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setProductToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
        variant="danger"
      />
      
      <div className="pt-35 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header - Stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground mb-1 sm:mb-2">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage all products</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={openAddForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 sm:px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
              <Link
                href="/admin/reviews"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 sm:px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Open Reviews Page
              </Link>
            </div>
          </div>

          {/* Search Input - Centered and Responsive */}
          <div className="mb-8 sm:mb-10">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-background border border-border rounded-full pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Add/Edit Form Overlay */}
          {showAddForm && (
            <div className="mb-12 sm:mb-16 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 boty-shadow border border-border/50">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground">
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-foreground boty-transition cursor-pointer"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-20">
                {/* Left - Image Gallery */}
                <ImageGallery
                  images={form.images}
                  selectedImageIndex={selectedImageIndex}
                  onSelectImage={setSelectedImageIndex}
                  onUpdateImage={updateImage}
                />

                {/* Right - Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-6">
                  <BasicInfoForm
                    name={form.name}
                    badge={form.badge}
                    description={form.description}
                    category={form.category}
                    onChange={updateField}
                    onRegenerateDescription={handleRegenerateDescription}
                  />

                  <PricingForm
                    price={form.price}
                    sizes={sizes}
                    onSizesChange={handleSizesChange}
                    onChange={updateField}
                  />

                  <RatingForm
                    rating={form.rating}
                    reviewCount={form.reviewCount}
                    onChange={updateField}
                  />

                  {/* Submit / Cancel Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : (editingId ? "Update Product" : "Add Product")}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}


          {/* Products Grid - Same layout as shop page */}
          <section className="mt-14 sm:mt-16">
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground">
                {loading ? "Loading..." : `All Products (${filteredProducts.length})`}
              </h2>
            </div>
            {loading && products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Loading products...</div>
            ) : (
              <ProductGrid
                products={filteredProducts}
                onEdit={editProduct}
                onDelete={deleteProductWrapper}
              />
            )}
          </section>
        </div>
      </div>

    </main>
  )
}