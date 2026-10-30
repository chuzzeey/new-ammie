"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search, LogOut, Eye, EyeOff, UserRound, Settings, CreditCard, Sun, Moon, Bell } from "lucide-react"
import { CartDrawer } from "./cart-drawer"
import { useCart } from "@/components/providers/cart-context"
import { useSearchBlur } from "@/components/providers/search-blur-context"
import { supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"

export function Header({
  variant = "default",
  onLogoutClick,
  onPreviewClick,
  isPreviewOpen = false,
}: {
  variant?: "default" | "admin"
  onLogoutClick?: () => void
  onPreviewClick?: () => void
  isPreviewOpen?: boolean
} = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [adminName, setAdminName] = useState("Admin")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminAvatarUrl, setAdminAvatarUrl] = useState("")
  const adminMenuRef = useRef<HTMLDivElement>(null)
  const { setIsOpen, itemCount } = useCart()
  const { setSearchOpen } = useSearchBlur()
  const { resolvedTheme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  const isAdmin = variant === "admin"

  useEffect(() => {
    setThemeMounted(true)
  }, [])

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

  useEffect(() => {
    if (!isAdmin) return

    let active = true
    const updateAdminIdentity = (user: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) return
      const fullName = user.user_metadata?.full_name
      setAdminName(
        typeof fullName === "string" && fullName.trim()
          ? fullName.trim()
          : user.email?.split("@")[0] || "Admin"
      )
      setAdminEmail(user.email || "")
      const avatarUrl = user.user_metadata?.avatar_url
      setAdminAvatarUrl(typeof avatarUrl === "string" ? avatarUrl : "")
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "USER_UPDATED") updateAdminIdentity(session?.user || null)
    })

    const loadAdminIdentity = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!active) return

      if (error) {
        console.error("Unable to load admin account identity.", error)
        return
      }

      updateAdminIdentity(data.user)
    }

    void loadAdminIdentity()
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [isAdmin])

  useEffect(() => {
    if (!showAdminMenu) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!adminMenuRef.current?.contains(event.target as Node)) {
        setShowAdminMenu(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowAdminMenu(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showAdminMenu])

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      {/* Mobile menu backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {isAdmin && showAdminMenu && (
        <button
          type="button"
          aria-label="Close admin menu"
          onClick={() => setShowAdminMenu(false)}
          className="fixed inset-0 z-[45] cursor-default border-0 bg-black/10 p-0 backdrop-blur-[2px]"
        />
      )}
      <nav className={`relative z-50 w-full animate-scale-fade-in border-b ${
        isAdmin ? "border-border bg-background" : "border-border/80 bg-background/95 backdrop-blur-xl"
      }`}>
        <div className="relative z-50 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          {!isAdmin && (
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-foreground/80 hover:text-foreground boty-transition cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Desktop Navigation - Left */}
          {!isAdmin && (
            <div className="hidden lg:flex items-center gap-7">
              <Link
                href="/"
                className="text-[13px] font-medium text-foreground/70 hover:text-foreground boty-transition"
              >
                Home
              </Link>
              <Link
                href="/shop"
                className="text-[13px] font-medium text-foreground/70 hover:text-foreground boty-transition"
              >
                Shop
              </Link>
              <Link
                href="/#reviews"
                className="text-[13px] font-medium text-foreground/70 hover:text-foreground boty-transition"
              >
                Reviews
              </Link>
              <Link
                href="/faq"
                className="text-[13px] font-medium text-foreground/70 hover:text-foreground boty-transition"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="text-[13px] font-medium text-foreground/70 hover:text-foreground boty-transition"
              >
                Contact
              </Link>
            </div>
          )}

          {/* Logo - Only show on non-admin pages */}
          {!isAdmin && (
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="font-serif text-xl sm:text-2xl md:text-[1.7rem] tracking-[0.04em] text-foreground">Ammie N</h1>
            </Link>
          )}

          {isAdmin && onPreviewClick && (
            <button
              type="button"
              onClick={onPreviewClick}
              aria-expanded={isPreviewOpen}
              aria-label={isPreviewOpen ? "Close store preview" : "Preview store"}
              className="absolute left-1/2 top-1/2 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center gap-2 rounded-sm border border-border text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto sm:px-3 sm:text-sm"
            >
              {isPreviewOpen ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
              <span className="hidden sm:inline">{isPreviewOpen ? "Close Preview" : "Preview Store"}</span>
            </button>
          )}

          {/* Right Actions */}
          {!isAdmin ? (
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground boty-transition cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground boty-transition cursor-pointer"
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
              <Link
                href="/admin/settings#notifications"
                aria-label="Notifications"
                title="Notifications"
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Bell className="h-4 w-4" />
              </Link>
              <div className="relative" ref={adminMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowAdminMenu((isOpen) => !isOpen)}
                  aria-label={showAdminMenu ? "Close admin menu" : "Open admin menu"}
                  aria-controls="admin-account-menu"
                  aria-haspopup="menu"
                  aria-expanded={showAdminMenu}
                  className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d8c8b5] bg-[#f4eee7] text-[#6d5137] transition-colors hover:bg-[#ece2d7]"
                >
                  {adminAvatarUrl ? (
                    <img src={adminAvatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <UserRound className="h-5 w-5" />
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                </button>
                <div
                  id="admin-account-menu"
                  role="menu"
                  aria-label="Admin account"
                  aria-hidden={!showAdminMenu}
                  inert={!showAdminMenu}
                  className={`admin-account-menu${showAdminMenu ? " admin-account-menu-open" : ""}`}
                >
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-medium text-foreground">{adminName}</p>
                    <p className="truncate text-xs text-muted-foreground">{adminEmail || "Loading account…"}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    aria-pressed={resolvedTheme === "dark"}
                    className="mt-1 flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      {themeMounted && resolvedTheme === "dark" ? (
                        <Moon className="h-4 w-4 text-[#7188b5]" />
                      ) : (
                        <Sun className="h-4 w-4 text-[#ad7542]" />
                      )}
                      {themeMounted && resolvedTheme === "dark" ? "Dark mode" : "Light mode"}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        themeMounted && resolvedTheme === "dark" ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                          themeMounted && resolvedTheme === "dark" ? "translate-x-[18px]" : "translate-x-0.5"
                        }`}
                      />
                    </span>
                  </button>
                  <Link
                    href="/admin/profile"
                    role="menuitem"
                    onClick={() => setShowAdminMenu(false)}
                    className="mt-1 flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <UserRound className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    role="menuitem"
                    onClick={() => setShowAdminMenu(false)}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/admin/payments"
                    role="menuitem"
                    onClick={() => setShowAdminMenu(false)}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <CreditCard className="h-4 w-4" />
                    Payments
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowAdminMenu(false)
                      setShowLogoutModal(true)
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {!isAdmin && (
          <div
            className={`lg:hidden overflow-hidden boty-transition relative z-[60] ${
              isMenuOpen ? "max-h-96 pb-5 pointer-events-auto" : "max-h-0 pointer-events-none"
            }`}
          >
          <div className="flex flex-col gap-1 pt-3 border-t border-border/70">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] rounded-md px-2 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground boty-transition cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] rounded-md px-2 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground boty-transition cursor-pointer"
            >
              Shop
            </Link>
            <Link
              href="/#reviews"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] rounded-md px-2 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground boty-transition cursor-pointer"
            >
              Reviews
            </Link>
            <Link
              href="/faq"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] rounded-md px-2 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground boty-transition cursor-pointer"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="relative z-[60] rounded-md px-2 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground boty-transition cursor-pointer"
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
