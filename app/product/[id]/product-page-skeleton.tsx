/**
 * Skeleton loading state for the product detail page.
 * Rendered immediately during streaming while the client component loads.
 */
export function ProductPageSkeleton() {
  return (
    <div className="min-h-screen overflow-x-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="h-20 bg-muted" />

      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Back button skeleton */}
          <div className="h-4 w-32 bg-muted rounded mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
            {/* Image skeleton */}
            <div>
              <div className="flex gap-4 items-stretch">
                <div className="flex-1 rounded-3xl bg-muted" style={{ minHeight: "400px" }} />
                <div className="flex flex-col gap-3 shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-16 h-16 md:w-[76px] md:h-[76px] rounded-xl bg-muted" />
                  ))}
                </div>
              </div>
            </div>

            {/* Text content skeleton */}
            <div className="flex flex-col gap-6">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-3/4 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-8 w-32 bg-muted rounded" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 w-20 bg-muted rounded-full" />
                ))}
              </div>
              <div className="flex gap-4">
                <div className="flex-1 h-14 bg-muted rounded-full" />
                <div className="flex-1 h-14 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions skeleton */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-8 w-64 bg-muted rounded mx-auto mb-12" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted rounded-3xl overflow-hidden">
                <div className="aspect-square bg-muted" />
                <div className="p-5">
                  <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-4 w-1/3 bg-muted rounded mb-3" />
                  <div className="h-10 w-full bg-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="h-60 bg-muted" />
    </div>
  )
}