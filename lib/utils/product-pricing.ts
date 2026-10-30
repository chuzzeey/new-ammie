export function getDiscountedPrice(price: number, discountPercentage = 0): number {
  if (!Number.isFinite(price) || price <= 0) return 0
  if (!Number.isFinite(discountPercentage) || discountPercentage < 5 || discountPercentage > 50) {
    return price
  }

  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100
}

export function formatUsdPrice(value: number | string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}
