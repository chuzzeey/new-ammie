import Link from "next/link"

/**
 * Branded 404 page — rendered for any unmatched route.
 * Also satisfies Next.js's "missing required error components" dev warning.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground">404</p>
      <h1 className="mb-3 font-sans text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
        Page not found
      </h1>
      <p className="mb-8 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to Home
      </Link>
    </main>
  )
}
