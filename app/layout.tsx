import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/providers/cart-context'
import { SearchBlurProvider } from '@/components/providers/search-blur-context'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { BrandLoader } from '@/components/layout/brand-loader'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/query-provider'
import { LenisProvider } from '@/components/providers/lenis-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ammie N — Premium Hair & Extensions',
  description: 'Premium wigs, lace fronts, and hair extensions. Wear confidence with Ammie N.',
  generator: 'v0.app',
  keywords: ['wigs', 'hair extensions', 'lace frontals', 'human hair', 'beauty', 'hair care', 'lace wigs'],
  icons: {
    icon: 'https://res.cloudinary.com/deafv5ovi/image/upload/v1784555201/a_dow3yp.png',
    apple: 'https://res.cloudinary.com/deafv5ovi/image/upload/v1784555201/a_dow3yp.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <BrandLoader />
          <QueryProvider>
            <CartProvider>
              <SearchBlurProvider>
                <LenisProvider>
                  {children}
                </LenisProvider>
              </SearchBlurProvider>
            </CartProvider>
          </QueryProvider>
          <WhatsAppButton />
          <Analytics />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
