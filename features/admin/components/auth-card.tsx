import type { ReactNode } from "react"

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
  variant?: "default" | "login"
}

/**
 * Shared card shell for the admin auth pages (login / forgot-password / update-password),
 * matching the neutral storefront design system.
 */
export function AuthCard({ title, subtitle, children, footer, variant = "default" }: AuthCardProps) {
  const heading = (
    <div className="mb-8">
      {variant === "login" && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#927451]">
          Secure admin portal
        </p>
      )}
      <h1 className="mb-2 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
    </div>
  )

  if (variant === "login") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f2ee] px-4 py-8 sm:px-8">
        <div className="w-full max-w-5xl">
          <div className="grid overflow-hidden rounded-3xl border border-[#e7e0d7] bg-white shadow-[0_28px_90px_-42px_rgba(47,35,25,0.35)] md:grid-cols-[0.9fr_1.1fr]">
            <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-[#211b17] p-10 text-white md:flex lg:p-14">
              <div
                aria-hidden="true"
                className="absolute -right-32 -top-20 h-96 w-96 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-4 h-64 w-64 rounded-full border border-white/10"
              />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c4a47d]" />
                  Store management
                </span>
              </div>
              <div className="relative">
                <p className="mb-4 font-serif text-4xl font-semibold tracking-tight lg:text-5xl">
                  AmmieN<span className="text-[#c4a47d]">.shop</span>
                </p>
                <p className="max-w-xs text-sm leading-7 text-white/65">
                  Premium hair, made for you.
                  <br />
                  Your store, all in one place.
                </p>
              </div>
              <p className="relative text-xs tracking-wide text-white/40">
                PRIVATE ACCESS · AUTHORIZED USERS ONLY
              </p>
            </aside>

            <section className="p-7 sm:p-12 lg:p-16">
              {heading}
              {children}
            </section>
          </div>
          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-md border border-border bg-background p-6 sm:p-9">
          {heading}
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </main>
  )
}