import type { ReactNode } from "react"

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Shared card shell for the admin auth pages (login / forgot-password / update-password),
 * matching the existing brand styling used across the storefront.
 */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 boty-shadow border border-border/50">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl text-foreground mb-2">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </main>
  )
}