"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Ban, CheckCircle2, CreditCard, Loader2, ShoppingCart } from "lucide-react"
import { Header } from "@/components/layout/header"
import { supabase } from "@/lib/supabase"

type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_country: string
  items: Array<{ name?: string; quantity?: number }>
  total: number
  status: OrderStatus
  created_at: string
}

const paymentStatuses = [
  {
    title: "Completed orders",
    emptyMessage: "No completed orders to show yet.",
    icon: CheckCircle2,
    status: "completed" as const,
  },
  {
    title: "Cancelled orders",
    emptyMessage: "No cancelled orders to show yet.",
    icon: Ban,
    status: "cancelled" as const,
  },
  {
    title: "Abandoned checkouts",
    emptyMessage: "Abandoned checkouts are not stored as orders.",
    icon: ShoppingCart,
    status: null,
  },
  {
    title: "Order activity",
    emptyMessage: "No orders to show yet.",
    icon: CreditCard,
    status: "all" as const,
  },
]

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [activePaymentTab, setActivePaymentTab] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError("")
    const { data, error: loadError } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, customer_country, items, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100)

    if (loadError) {
      console.error("Unable to load payment orders.", loadError)
      setError("Orders could not be loaded. Please try again.")
      setLoading(false)
      return
    }

    setOrders((data ?? []) as Order[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const visibleOrders = useMemo(() => {
    const status = paymentStatuses[activePaymentTab].status
    if (status === null) return []
    if (status === "all") return orders
    return orders.filter((order) => order.status === status)
  }, [activePaymentTab, orders])

  const cancelOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId)
    const { data, error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .select("id, status")
      .single()

    if (updateError) {
      console.error("Unable to cancel order.", updateError)
      setError("The order could not be cancelled. Please try again.")
    } else if (data?.status === "cancelled") {
      setOrders((current) =>
        current.map((order) => order.id === orderId ? { ...order, status: "cancelled" } : order)
      )
    } else {
      setError("The order was not found and could not be cancelled.")
    }
    setUpdatingOrderId(null)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Unable to log out from the payments page.", error)
      return
    }
    router.replace("/admin/login")
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <Header variant="admin" onLogoutClick={handleLogout} />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </nav>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Store management</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Payments</h1>
        </div>

        <div className="border-b border-border">
          <div
            role="tablist"
            aria-label="Payment activity"
            className="-mb-px flex snap-x snap-mandatory gap-6 overflow-x-auto"
          >
            {paymentStatuses.map(({ title, icon: Icon }, index) => (
              <button
                key={title}
                id={`payment-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={activePaymentTab === index}
                aria-controls="payment-tab-panel"
                onClick={() => setActivePaymentTab(index)}
                className={`inline-flex min-h-12 shrink-0 snap-start items-center gap-2 border-b-2 px-0.5 text-sm font-medium transition-colors ${
                  activePaymentTab === index
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${activePaymentTab === index ? "text-foreground" : ""}`} />
                {title}
              </button>
            ))}
          </div>
        </div>

        <section
          id="payment-tab-panel"
          role="tabpanel"
          aria-labelledby={`payment-tab-${activePaymentTab}`}
          className="min-h-48 py-8 sm:py-10"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading orders…
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-sm text-destructive" role="alert">{error}</p>
              <button type="button" onClick={() => void loadOrders()} className="mt-3 text-sm font-medium underline underline-offset-4">
                Try again
              </button>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-foreground">{paymentStatuses[activePaymentTab].emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleOrders.map((order) => (
                <article key={order.id} className="rounded-lg border border-border bg-background p-4 text-left sm:p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <h2 className="font-medium text-foreground">{order.customer_name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.customer_phone} · {order.customer_country || "Country not provided"}
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {(order.items ?? []).map((item) => `${item.name || "Product"} × ${item.quantity || 1}`).join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <span className="font-semibold text-foreground">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(order.total) || 0)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        order.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  {activePaymentTab === 3 && order.status !== "cancelled" && order.status !== "completed" && (
                    <div className="mt-4 border-t border-border pt-3 text-right">
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => void cancelOrder(order.id)}
                        className="text-sm font-medium text-destructive underline underline-offset-4 disabled:opacity-50"
                      >
                        {updatingOrderId === order.id ? "Cancelling…" : "Cancel order"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
