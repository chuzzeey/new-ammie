"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, X, Search, Loader2, Users, Mail, Package } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState<"products" | "customers" | "emails">("products")
  const [mounted, setMounted] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showStorePreview, setShowStorePreview] = useState(false)
  const [showPreviewWarning, setShowPreviewWarning] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [form, setForm] = useState<ProductForm>({ ...emptyForm })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [sizes, setSizes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
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
          sizes: form.sizes
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

  const setProductDiscount = async (id: string, discountPercentage: number) => {
    const { data, error } = await updateProduct(id, { discount_percentage: discountPercentage })
    if (error) {
      log.error("Failed to update product discount", { error, productId: id, discountPercentage })
      toast.error("Unable to update product discount")
      return false
    }

    if (data) {
      setProducts((current) => current.map((product) => product.id === id ? data : product))
      revalidateProductPage(id)
    } else {
      toast.error("Product discount update returned no product.")
      return false
    }
    toast.success(discountPercentage ? `${discountPercentage}% discount applied` : "Discount removed")
    return true
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
      <Header
        variant="admin"
        onLogoutClick={handleLogout}
        onPreviewClick={() => {
          if (showStorePreview) {
            setShowStorePreview(false)
          } else {
            setShowPreviewWarning(true)
          }
        }}
        isPreviewOpen={showStorePreview}
      />

      <ConfirmationModal
        isOpen={showPreviewWarning}
        onClose={() => setShowPreviewWarning(false)}
        onConfirm={() => {
          setPreviewKey((key) => key + 1)
          setShowStorePreview(true)
        }}
        title="Preview your live store?"
        message="This loads the current storefront homepage inside the admin page. You will stay on /admin, and the preview reflects the latest published site content."
        confirmText="Continue to Preview"
        cancelText="Go Back"
        variant="info"
      />

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

      {showStorePreview && (
        <section className="px-4 pt-24 sm:px-6 lg:px-8" aria-label="Store preview">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-md border border-border bg-background">
            <div className="flex min-h-12 items-center justify-between border-b border-border px-4">
              <h2 className="text-sm font-medium text-foreground">Store Preview</h2>
              <button
                type="button"
                onClick={() => setShowStorePreview(false)}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Close
              </button>
            </div>
            <iframe
              key={previewKey}
              src="/"
              title="Storefront preview"
              loading="eager"
              className="block h-[75vh] min-h-[500px] w-full bg-background"
            />
          </div>
        </section>
      )}
      
      <div className="pt-35 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header - Stack on mobile, row on desktop */}
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Store management</p>
              <h1 className="mb-1 font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {activeTab === "products" ? "Products" : activeTab === "customers" ? "Customers" : "Emails"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {activeTab === "products"
                  ? "Manage all products"
                  : activeTab === "customers"
                    ? "Customer records and registration"
                    : "Customer email management"}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:w-auto">
              {activeTab === "products" && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              )}
              <Link
                href="/admin/reviews"
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Open Reviews Page
              </Link>
            </div>
          </div>

          <div className="mb-8">
            <div
              role="tablist"
              aria-label="Admin sections"
              className="grid grid-cols-3 border-b border-border"
            >
              {([
                { id: "products", label: "Products", icon: Package },
                { id: "customers", label: "Customers", icon: Users },
                { id: "emails", label: "Emails", icon: Mail },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`admin-tab-${id}`}
                  aria-selected={activeTab === id}
                  aria-controls="admin-tab-panel"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 py-3 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
                    activeTab === id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "products" ? (
            <div role="tabpanel" id="admin-tab-panel" aria-labelledby="admin-tab-products">
          {/* Search Input - Centered and Responsive */}
          <div className="mb-8 sm:mb-10">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="min-h-11 w-full rounded-sm border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground sm:text-base"
              />
            </div>
          </div>

          {/* Add/Edit Form Overlay */}
          {showAddForm && (
            <div className="mb-12 rounded-md border border-border bg-background p-4 sm:mb-16 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="font-sans text-lg font-semibold text-foreground sm:text-xl">
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                    description={form.description}
                    category={form.category}
                    onChange={updateField}
                  />

                  <PricingForm
                    price={form.price}
                    sizes={sizes}
                    onSizesChange={handleSizesChange}
                    onChange={updateField}
                  />

                  <RatingForm
                    rating={form.rating}
                    onChange={updateField}
                  />

                  {/* Submit / Cancel Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                    >
                      {submitting ? 'Saving...' : (editingId ? "Update Product" : "Add Product")}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
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
              <h2 className="font-sans text-lg font-semibold text-foreground sm:text-xl">
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
                onSetDiscount={setProductDiscount}
              />
            )}
          </section>
            </div>
          ) : (
            <section
              role="tabpanel"
              id="admin-tab-panel"
              aria-labelledby={`admin-tab-${activeTab}`}
              className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-border bg-background px-6 py-12 text-center"
            >
              {activeTab === "customers" ? (
                <>
                  <Users className="mb-4 h-8 w-8 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Customer registration is not set up yet</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Customer records and registration tools can be added here when your registration form is ready.
                  </p>
                </>
              ) : activeTab === "emails" ? (
                <>
                  <Mail className="mb-4 h-8 w-8 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Email tools coming soon</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Customer email management will be available here once customer registration is connected.
                  </p>
                </>
              ) : null}
            </section>
          )}
        </div>
      </div>

    </main>
  )
}