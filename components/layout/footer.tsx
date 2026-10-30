"use client"

import Link from "next/link"
import { useState } from "react"
import { PolicyModal } from "@/components/shared/policy-modal"

type ModalType = "privacy" | "terms" | "shipping"

const footerLinks = {
  shop: [
    { name: "All Products", href: "/shop" },
    { name: "Wigs", href: "/shop" }
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "FAQ", href: "/faq" },
    { name: "Shipping", href: "#" }
  ]
}

export function Footer() {
  const [modal, setModal] = useState<ModalType | null>(null)
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background py-14 sm:py-16">
      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="mb-3 font-serif text-2xl text-foreground">Ammie N</h2>
            <p className="mb-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Premium wigs, lace fronts, and hair extensions for those who believe beauty should feel as good as it looks.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/ammie_nwigs?igsh=MWR4NXJyeXB4dTlvZw=="
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@amysglamroom?_r=1&_t=ZS-988kqtnNJoq"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4h5" />
                  <path d="M15 4a5 5 0 0 0 3 4" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/share/1PFS4iCgiH/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@TheAmmieN"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                aria-label="YouTube"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  {link.name === "Shipping" ? (
                    <button
                      onClick={() => setModal("shipping")}
                      className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-5">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
              <button
                onClick={() => setModal("privacy")}
                className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setModal("terms")}
                className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </button>
              <button
                onClick={() => setModal("shipping")}
                className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Shipping
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Ammie N. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>

      <PolicyModal type={modal} onClose={() => setModal(null)} />
    </footer>
  )
}
