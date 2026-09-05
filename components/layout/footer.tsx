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
    <footer className="bg-card pt-20 pb-10 relative overflow-hidden">
      {/* Giant Background Text */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none z-0">
        <span className="font-serif text-[200px] sm:text-[200px] md:text-[400px] lg:text-[400px] xl:text-[400px] font-bold text-white/20 whitespace-nowrap leading-none">
          Ammie N
        </span>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-serif text-3xl text-foreground mb-4">Ammie N</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Premium wigs, lace fronts, and hair extensions for those who believe beauty should feel as good as it looks.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/ammie_nwigs?igsh=MWR4NXJyeXB4dTlvZw=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition boty-shadow"
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
                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition boty-shadow"
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
                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition boty-shadow"
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
                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition boty-shadow"
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
            <h3 className="font-medium text-foreground mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground boty-transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-medium text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  {link.name === "Shipping" ? (
                    <button
                      onClick={() => setModal("shipping")}
                      className="text-sm text-muted-foreground hover:text-foreground boty-transition cursor-pointer"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground boty-transition"
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
        <div className="pt-6 border-t border-border/50">
          <div className="flex flex-col items-center gap-2">
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setModal("privacy")}
                className="text-sm text-muted-foreground hover:text-foreground boty-transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setModal("terms")}
                className="text-sm text-muted-foreground hover:text-foreground boty-transition cursor-pointer"
              >
                Terms of Service
              </button>
              <button
                onClick={() => setModal("shipping")}
                className="text-sm text-muted-foreground hover:text-foreground boty-transition cursor-pointer"
              >
                Shipping
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              &copy; {new Date().getFullYear()} Ammie N. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>

      <PolicyModal type={modal} onClose={() => setModal(null)} />
    </footer>
  )
}
