"use client"

import { useState, useEffect, useMemo } from "react"
import { Minus, Plus, Trash2, ShoppingBag, X, Loader2, Search, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
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
import { createClientBrowser } from "@/lib/supabase"

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
  const { items, removeItem, updateQuantity, clearCart, isOpen, setIsOpen, itemCount, subtotal } = useCart()
  const isMobile = useIsMobile()
  const router = useRouter()

  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("NG")
  const [selectedState, setSelectedState] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Country dropdown state
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // State dropdown state
  const [stateSearch, setStateSearch] = useState("")
  const [showStateDropdown, setShowStateDropdown] = useState(false)

  const shipping = 0
  const total = subtotal + shipping

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

    try {
      const client = createClientBrowser()

      const orderData = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_country: selectedCountryObj?.name || "Nigeria",
        customer_state: countryStates.find((s) => s.isoCode === selectedState)?.name || "",
        customer_address: customerAddress.trim(),
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal,
        shipping,
        total,
        status: "pending",
      }

      const { data, error: insertError } = await client
        .from("orders")
        .insert([orderData])
        .select()
        .single()

      if (insertError) throw insertError

      clearCart()
      setShowCheckoutModal(false)

      router.push(`/invoice/${data.id}?token=${data.access_token}&fresh=1`)
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err?.message || "Something went wrong. Please try again.")
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
              ? "h-[85vh] max-h-[85vh] rounded-t-3xl border-t"
              : "h-full w-full sm:max-w-[440px]"
          }
        >
          {isMobile && (
            <div className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          <DrawerHeader className="border-b border-border/50 p-4 sm:p-6 py-2.5">
            <DrawerTitle className="font-serif text-xl sm:text-2xl">Cart</DrawerTitle>
            <DrawerDescription>{itemCount} {itemCount === 1 ? 'item' : 'items'}</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-sm sm:text-base text-foreground mb-0.5 sm:mb-1 font-semibold leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-muted-foreground mb-2 sm:mb-3 text-xs sm:text-sm">
                        Premium quality hair product
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center border border-border rounded-full">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 sm:p-1.5 hover:bg-muted boty-transition rounded-l-full touch-manipulation"
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
                            className="p-2 sm:p-1.5 hover:bg-muted boty-transition rounded-r-full touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2.5 sm:p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 boty-transition rounded-full touch-manipulation"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-foreground text-sm sm:text-base whitespace-nowrap">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((item.price * item.quantity) || 0)}
                      </p>
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
                className="w-full bg-primary text-primary-foreground py-3.5 sm:py-4 rounded-full font-medium text-sm sm:text-base hover:bg-primary/90 boty-transition active:scale-[0.98] transition-transform touch-manipulation"
              >
                Checkout
              </button>

              <DrawerClose asChild>
                <button
                  type="button"
                  className="w-full border border-border text-foreground py-3.5 sm:py-4 rounded-full font-medium text-sm sm:text-base hover:bg-muted boty-transition active:scale-[0.98] transition-transform touch-manipulation"
                >
                  Continue Shopping
                </button>
              </DrawerClose>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      {/* ── Checkout Modal ── */}
      {showCheckoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        >
          <div className="absolute inset-0" onClick={closeCheckout} />

          <div
            className="relative bg-card rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90dvh] overflow-y-auto boty-shadow border border-border/50 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-6 pb-4 border-b border-border/50">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-foreground">Checkout</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Enter your details to place the order</p>
              </div>
              <button
                type="button"
                onClick={closeCheckout}
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-foreground boty-transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCheckout} className="p-6 space-y-5">
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
                    <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="whitespace-nowrap">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((item.price * item.quantity) || 0)}</span>
                  </div>
                ))}
                <div className="border-t border-border/50 pt-2 mt-2 flex justify-between font-medium text-foreground">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total || 0)}</span>
                </div>
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
                      Placing Order...
                    </>
                  ) : (
                    `Place Order — ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total || 0)}`
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
        </div>
      )}
    </>
  )
}
