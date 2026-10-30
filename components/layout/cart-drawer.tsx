"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Minus, Plus, Trash2, ShoppingBag, X, Loader2, Search, ChevronDown } from "lucide-react"
import Image from "next/image"
import { Country, State } from "country-state-city"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useCart } from "@/components/providers/cart-context"

type CheckoutCurrency = "NGN" | "GBP" | "USD"

function formatCurrency(value: number, currency: CheckoutCurrency) {
  const locale = currency === "NGN" ? "en-NG" : currency === "GBP" ? "en-GB" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return isMobile
}

export function CartDrawer() {
  const { items, removeItem, updateQuantity, isOpen, setIsOpen, itemCount, subtotal } = useCart()
  const isMobile = useIsMobile()

  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showGatewayWarning, setShowGatewayWarning] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("NG")
  const [selectedState, setSelectedState] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [gbpRate, setGbpRate] = useState<number | null>(null)
  const [gbpRateStatus, setGbpRateStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [gbpRateRetry, setGbpRateRetry] = useState(0)

  // Country dropdown state
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // State dropdown state
  const [stateSearch, setStateSearch] = useState("")
  const [showStateDropdown, setShowStateDropdown] = useState(false)

  const shipping = 0
  const total = subtotal + shipping
  const checkoutCurrency: CheckoutCurrency =
    selectedCountry === "NG" ? "NGN" : selectedCountry === "GB" ? "GBP" : "USD"
  const checkoutRate =
    checkoutCurrency === "NGN" ? 1350 : checkoutCurrency === "GBP" ? gbpRate : 1
  const canShowCheckoutPrices = checkoutRate !== null

  useEffect(() => {
    if (selectedCountry !== "GB") {
      setGbpRate(null)
      setGbpRateStatus("idle")
      return
    }

    const controller = new AbortController()
    setGbpRate(null)
    setGbpRateStatus("loading")

    const loadGbpRate = async () => {
      try {
        const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=GBP", {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Exchange-rate service returned ${response.status}.`)
        }

        const data: unknown = await response.json()
        if (
          typeof data !== "object" ||
          data === null ||
          !("rates" in data) ||
          typeof data.rates !== "object" ||
          data.rates === null ||
          !("GBP" in data.rates) ||
          typeof data.rates.GBP !== "number" ||
          !Number.isFinite(data.rates.GBP) ||
          data.rates.GBP <= 0
        ) {
          throw new Error("The exchange-rate service returned an invalid GBP rate.")
        }

        setGbpRate(data.rates.GBP)
        setGbpRateStatus("ready")
      } catch (rateError) {
        if (controller.signal.aborted) return
        console.error("Unable to load the USD to GBP exchange rate.", rateError)
        setGbpRateStatus("error")
      }
    }

    void loadGbpRate()
    return () => controller.abort()
  }, [selectedCountry, gbpRateRetry])

  // Get countries from library
  const allCountries = useMemo(() => Country.getAllCountries(), [])
  
  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return allCountries
    const search = countrySearch.toLowerCase()
    return allCountries.filter(
      (c) => c.name.toLowerCase().includes(search) || c.isoCode.toLowerCase().includes(search)
    )
  }, [allCountries, countrySearch])

  // Get selected country name
  const selectedCountryObj = useMemo(
    () => allCountries.find((c) => c.isoCode === selectedCountry),
    [allCountries, selectedCountry]
  )

  // Get states for selected country
  const countryStates = useMemo(() => {
    if (!selectedCountry) return []
    return State.getStatesOfCountry(selectedCountry)
  }, [selectedCountry])

  // Filter states based on search
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return countryStates
    const search = stateSearch.toLowerCase()
    return countryStates.filter(
      (s) => s.name.toLowerCase().includes(search) || s.isoCode.toLowerCase().includes(search)
    )
  }, [countryStates, stateSearch])

  // Reset state when country changes
  const handleCountryChange = (code: string) => {
    setSelectedCountry(code)
    setSelectedState("")
    setShowCountryDropdown(false)
    setCountrySearch("")
  }

  const handleStateChange = (code: string) => {
    setSelectedState(code)
    setShowStateDropdown(false)
    setStateSearch("")
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const openCheckout = () => {
    setIsOpen(false)
    setTimeout(() => {
      setShowCheckoutModal(true)
      setError("")
    }, 350)
  }

  const closeCheckout = () => {
    setShowCheckoutModal(false)
    setError("")
    setTimeout(() => {
      setIsOpen(true)
    }, 350)
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!customerName.trim()) {
      setError("Please enter your full name")
      return
    }
    if (!customerPhone.trim()) {
      setError("Please enter your phone number")
      return
    }
    if (!selectedCountry) {
      setError("Please select your country")
      return
    }
    if (!customerAddress.trim()) {
      setError("Please enter your delivery address")
      return
    }

    setSubmitting(true)
    setShowGatewayWarning(false)
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      setShowGatewayWarning(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* ── Cart Drawer (side/bottom sheet) ── */}
      <Drawer
        open={isOpen}
        onOpenChange={handleOpenChange}
        direction={isMobile ? "bottom" : "right"}
      >
        <DrawerContent
          className={
            isMobile
              ? "h-[85vh] max-h-[85vh] rounded-t-xl border-t"
              : "h-full w-full sm:max-w-[440px]"
          }
        >
          {isMobile && (
            <div className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          <DrawerHeader className="border-b border-border px-5 py-4 sm:px-6">
            <DrawerTitle className="font-sans text-lg font-semibold">Your cart</DrawerTitle>
            <DrawerDescription className="text-xs">{itemCount} {itemCount === 1 ? 'item' : 'items'}</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="mb-4 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Your cart is empty</p>
                <DrawerClose asChild>
                  <button type="button" className="mt-4 text-primary hover:underline text-sm">
                    Continue Shopping
                  </button>
                </DrawerClose>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 sm:gap-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      {item.originalPrice && item.discountPercentage && (
                        <span className="absolute right-1 top-1 rounded-sm bg-red-600 px-1.5 py-1 text-[9px] font-semibold uppercase leading-tight tracking-wide text-white">
                          Save {item.discountPercentage}%
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 text-sm font-medium leading-tight text-foreground">
                        {item.name}
                      </h3>
                      <p className="text-muted-foreground mb-2 sm:mb-3 text-xs sm:text-sm">
                        Premium quality hair product
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center rounded-sm border border-border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="rounded-l-sm p-2 transition-colors hover:bg-muted touch-manipulation"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>
                          <span className="px-3 sm:px-3 text-sm font-medium min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="rounded-r-sm p-2 transition-colors hover:bg-muted touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-sm p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.originalPrice && item.discountPercentage ? (
                        <div className="flex flex-col items-end">
                          <span className="whitespace-nowrap text-xs text-muted-foreground line-through">
                            {formatCurrency(item.originalPrice * item.quantity, "USD")}
                          </span>
                          <span className="whitespace-nowrap text-sm font-medium text-foreground sm:text-base">
                            {formatCurrency(item.price * item.quantity, "USD")}
                          </span>
                          <span className="whitespace-nowrap text-[10px] font-medium text-red-700">
                            Save {item.discountPercentage}%
                          </span>
                        </div>
                      ) : (
                        <p className="whitespace-nowrap text-sm font-medium text-foreground sm:text-base">
                          {formatCurrency(item.price * item.quantity, "USD")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <DrawerFooter className="border-t border-border/50 p-4 sm:p-6 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(shipping || 0)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-medium text-foreground pt-2 sm:pt-2 border-t border-border/50">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total || 0)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={openCheckout}
                className="min-h-12 w-full rounded-sm bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 touch-manipulation"
              >
                Checkout
              </button>

              <DrawerClose asChild>
                <button
                  type="button"
                  className="min-h-12 w-full rounded-sm border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted touch-manipulation"
                >
                  Continue Shopping
                </button>
              </DrawerClose>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      {/* ── Checkout Modal ── */}
      {showCheckoutModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-stretch justify-stretch overflow-hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!submitting) closeCheckout()
            }}
          />

          <div
            className="relative h-full w-full max-w-none overflow-x-hidden overflow-y-scroll overscroll-y-contain rounded-none border-0 bg-background animate-in fade-in duration-200"
            data-lenis-prevent
            style={{
              height: "100dvh",
              maxHeight: "100dvh",
              WebkitOverflowScrolling: "touch",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background p-5 sm:p-6">
              <div>
                <h2 className="font-sans text-lg font-semibold text-foreground">Checkout</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Enter your details to place the order</p>
              </div>
              <button
                type="button"
                onClick={closeCheckout}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close checkout"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCheckout} className="space-y-5 p-6">
              {/* Full Name */}
              <div>
                <label htmlFor="modalName" className="block text-sm font-medium text-foreground mb-1.5">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="modalName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  autoFocus
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="modalPhone" className="block text-sm font-medium text-foreground mb-1.5">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  id="modalPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Country <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    onClick={() => {
                      setShowCountryDropdown(!showCountryDropdown)
                      setShowStateDropdown(false)
                    }}
                  >
                    <span className={selectedCountryObj ? "text-foreground" : "text-muted-foreground/50"}>
                      {selectedCountryObj ? selectedCountryObj.name : "Select country"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCountryDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-hidden">
                      <div className="sticky top-0 bg-card p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search country..."
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        {filteredCountries.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-4 text-center">No countries found</p>
                        ) : (
                          filteredCountries.map((country) => (
                            <button
                              key={country.isoCode}
                              type="button"
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center justify-between ${
                                selectedCountry === country.isoCode ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                              }`}
                              onClick={() => handleCountryChange(country.isoCode)}
                            >
                              <span>{country.name}</span>
                              {selectedCountry === country.isoCode && (
                                <span className="text-primary text-xs">✓</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  State <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full bg-background border border-border rounded-xl px-4 py-3 text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      countryStates.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (countryStates.length > 0) {
                        setShowStateDropdown(!showStateDropdown)
                        setShowCountryDropdown(false)
                      }
                    }}
                    disabled={countryStates.length === 0}
                  >
                    <span className={
                      selectedState && countryStates.find((s) => s.isoCode === selectedState)
                        ? "text-foreground"
                        : countryStates.length === 0
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground/50"
                    }>
                      {countryStates.length === 0
                        ? "State not available"
                        : selectedState
                        ? countryStates.find((s) => s.isoCode === selectedState)?.name || "Select state"
                        : "Select state"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showStateDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showStateDropdown && countryStates.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-hidden">
                      <div className="sticky top-0 bg-card p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            placeholder="Search state..."
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        {filteredStates.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-4 text-center">No states found</p>
                        ) : (
                          filteredStates.map((state) => (
                            <button
                              key={state.isoCode}
                              type="button"
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center justify-between ${
                                selectedState === state.isoCode ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                              }`}
                              onClick={() => handleStateChange(state.isoCode)}
                            >
                              <span>{state.name}</span>
                              {selectedState === state.isoCode && (
                                <span className="text-primary text-xs">✓</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="modalAddress" className="block text-sm font-medium text-foreground mb-1.5">
                  Delivery Address <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="modalAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter your full delivery address"
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                />
              </div>

              {/* Order summary */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Order Summary</p>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                    <span className="mr-2 min-w-0">
                      <span className="block truncate">{item.name} × {item.quantity}</span>
                      {item.originalPrice && item.discountPercentage && canShowCheckoutPrices && (
                        <span className="block text-xs font-medium text-red-700">
                          Save {item.discountPercentage}%
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap text-right">
                      {item.originalPrice && item.discountPercentage && canShowCheckoutPrices && (
                        <span className="mr-2 text-xs text-muted-foreground line-through">
                          {formatCurrency(item.originalPrice * item.quantity * checkoutRate, checkoutCurrency)}
                        </span>
                      )}
                      {canShowCheckoutPrices
                        ? formatCurrency(item.price * item.quantity * checkoutRate, checkoutCurrency)
                        : "Loading rate…"}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border/50 pt-2 mt-2 flex justify-between font-medium text-foreground">
                  <span>Total</span>
                  <span>
                    {canShowCheckoutPrices
                      ? formatCurrency(total * checkoutRate, checkoutCurrency)
                      : "Loading rate…"}
                  </span>
                </div>
                {checkoutCurrency === "GBP" && gbpRateStatus === "ready" && gbpRate !== null && (
                  <p className="text-xs text-muted-foreground">
                      Latest available display rate: $1 USD = £{gbpRate.toFixed(4)} GBP. No order is placed until payment is configured.
                  </p>
                )}
                {checkoutCurrency === "GBP" && gbpRateStatus === "error" && (
                  <div className="flex items-center justify-between gap-3 text-xs text-destructive" role="alert">
                    <span>Could not load the live GBP exchange rate.</span>
                    <button
                      type="button"
                      onClick={() => setGbpRateRetry((attempt) => attempt + 1)}
                      className="shrink-0 underline underline-offset-2"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {checkoutCurrency !== "GBP" && (
                  <p className="text-xs text-muted-foreground">
                    {checkoutCurrency === "NGN"
                      ? "Converted for display at $1 USD = ₦1,350. No order is placed until payment is configured."
                      : "Prices are shown in USD. No order is placed until payment is configured."}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-full font-medium text-sm hover:bg-primary/90 boty-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    canShowCheckoutPrices
                      ? `Continue to payment — ${formatCurrency(total * checkoutRate, checkoutCurrency)}`
                      : "Continue to payment"
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeCheckout}
                  disabled={submitting}
                  className="sm:flex-none bg-transparent border border-border text-foreground py-3.5 px-6 rounded-full font-medium text-sm hover:bg-muted boty-transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          {showGatewayWarning && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-5" role="alertdialog" aria-modal="true" aria-labelledby="gateway-warning-title">
              <div className="w-full max-w-sm rounded-lg bg-background p-6 text-center shadow-xl">
                <h2 id="gateway-warning-title" className="text-lg font-semibold text-foreground">
                  Payment gateway not configured yet.
                </h2>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setShowGatewayWarning(false)}
                  className="mt-5 min-h-11 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}
