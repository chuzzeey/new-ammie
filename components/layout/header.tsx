"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search, LogOut } from "lucide-react"
import { CartDrawer } from "./cart-drawer"
import { useCart } from "@/components/providers/cart-context"
import { useSearchBlur } from "@/components/providers/search-blur-context"

export function Header({ variant = "default", onLogoutClick }: { variant?: "default" | "admin"; onLogoutClick?: () => void } = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { setIsOpen, itemCount } = useCart()
  const { setSearchOpen } = useSearchBlur()
  const isAdmin = variant === "admin"

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      {/* Mobile menu backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 lg:px-8 backdrop-blur-md rounded-lg py-0 my-0 animate-scale-fade-in bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.32)]" style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px' }}>
        <div className="relative z-50 flex items-center justify-between h-[68px]">
          {/* Mobile menu button */}
          {!isAdmin && (
            <button
              type="button"
              className="lg:hidden p-2 text-foreground/80 hover:text-foreground boty-transition cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Desktop Navigation - Left */}
          {!isAdmin && (
            <div className="hidden lg:flex items-center gap-8">
              <Link
                href="/"
                className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition"
              >
                Home
              </Link>
              <Link
                href="/shop"
                className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition"
              >
                Shop
              </Link>
              <Link
                href="/#reviews"
                className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition"
              >
                Reviews
              </Link>
              <Link
                href="/faq"
                className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition"
              >
                Contact
              </Link>
            </div>
          )}

          {/* Logo - Only show on non-admin pages */}
          {!isAdmin && (
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl tracking-wider text-foreground">Ammie N</h1>
            </Link>
          )}

          {/* Right Actions */}
          {!isAdmin ? (
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-foreground/70 hover:text-foreground boty-transition cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative p-2 text-foreground/70 hover:text-foreground boty-transition cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0 -right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full text-xs sm:text-sm tracking-wide boty-transition hover:bg-destructive/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {!isAdmin && (
          <div
            className={`lg:hidden overflow-hidden boty-transition relative z-[60] ${
              isMenuOpen ? "max-h-120 pb-6 pointer-events-auto" : "max-h-0 pointer-events-none"
            }`}
          >
          <div className="flex flex-col gap-14 pt-4 border-t border-border/50">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition cursor-pointer"
            >
              Shop
            </Link>
            <Link
              href="/#reviews"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition cursor-pointer"
            >
              Reviews
            </Link>
            <Link
              href="/faq"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition cursor-pointer"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition cursor-pointer"
            >
              Contact
            </Link>
          </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal */}
      {isAdmin && showLogoutModal && onLogoutClick && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={() => setShowLogoutModal(false)}
          />
          <div
            className="relative bg-card rounded-2xl max-w-md w-full boty-shadow border border-border/50 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl text-foreground mb-4">Confirm Logout</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5 cursor-pointer"
                >
                  No, Stay logged in
                </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false)
                  onLogoutClick()
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-destructive/10 text-destructive px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-destructive/20 cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </header>
  )
}
