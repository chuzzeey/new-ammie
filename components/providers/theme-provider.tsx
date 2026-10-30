'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname === '/admin' || pathname?.startsWith('/admin/') === true

  return (
    <NextThemesProvider
      {...props}
      storageKey="ammie-admin-theme"
      forcedTheme={isAdminRoute ? undefined : 'light'}
    >
      {children}
    </NextThemesProvider>
  )
}
