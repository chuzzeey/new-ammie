import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/providers/cart-context'
import { SearchBlurProvider } from '@/components/providers/search-blur-context'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/query-provider'
import { LenisProvider } from '@/components/providers/lenis-provider'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600']
});

const playfairDisplay = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700']
});

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
  themeColor: '#F7F4EF',
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
      <body className={`${dmSans.variable} ${playfairDisplay.variable} font-sans antialiased`}>
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
      </body>
    </html>
  )
}
