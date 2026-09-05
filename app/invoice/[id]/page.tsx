"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Printer, Copy, Check, Clock, ChevronRight, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// ── Types ──

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

interface OrderData {
  id: string
  customer_name: string
  customer_phone: string
  customer_country?: string
  customer_state?: string
  customer_address: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: string
  access_token: string
  created_at: string
}

// ── Helpers ──

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// ── Vendor WhatsApp config ──

const VENDOR_PHONE = "2349031560905"

function buildWhatsAppMessage(customerName: string, url: string) {
  return `Hi, I'm ${customerName}, I placed an order in your store\n\n${url}`
}

// ── Component ──

export default function InvoicePage() {
  const params = useParams()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [invoiceUrlWithToken, setInvoiceUrlWithToken] = useState("")
  const [isFreshOrder, setIsFreshOrder] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [sending, setSending] = useState(false)
  const whatsappOpened = useRef(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get("token")
        const fresh = urlParams.get("fresh")

        setIsFreshOrder(fresh === "1")

        let query = supabase.from("orders").select("*")
        if (token) {
          query = query.eq("id", params.id).eq("access_token", token)
        } else {
          query = query.eq("id", params.id)
        }

        const { data, error: err } = await query.single()
        if (err) throw err
        setOrder(data)
      } catch (err: any) {
        setError(err?.message || "Invoice not found")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchOrder()
  }, [params.id])

  // Set client-side only URLs after mount (avoids hydration mismatch)
  useEffect(() => {
    if (order) {
      const baseUrl = order.access_token
        ? `${window.location.origin}/invoice/${order.id}?token=${order.access_token}`
        : window.location.href
      setInvoiceUrlWithToken(baseUrl)
    }
  }, [order])

  // Show locked modal for fresh orders after invoice loads
  useEffect(() => {
    if (order && isFreshOrder && !whatsappOpened.current) {
      const timer = setTimeout(() => {
        setShowModal(true)
        requestAnimationFrame(() => setModalVisible(true))
        document.body.style.overflow = "hidden"
      }, 500)
      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ""
      }
    }
  }, [order, isFreshOrder])

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  const handleProceed = () => {
    if (whatsappOpened.current) return
    setSending(true)

    if (!order) return

    const url = `${window.location.origin}/invoice/${order.id}?token=${order.access_token}`
    const message = buildWhatsAppMessage(order.customer_name, url)
    const whatsappUrl = `https://wa.me/${VENDOR_PHONE}?text=${encodeURIComponent(message)}`

    whatsappOpened.current = true
    window.open(whatsappUrl, "_blank", "noopener,noreferrer")

    // Close modal after opening WhatsApp
    setTimeout(() => {
      setModalVisible(false)
      setTimeout(() => {
        setShowModal(false)
        setSending(false)
        document.body.style.overflow = ""
      }, 300)
    }, 500)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invoiceUrlWithToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  // Vendor WhatsApp URL for the share button (always available)
  const vendorWhatsAppUrl = order
    ? `https://wa.me/${VENDOR_PHONE}?text=${encodeURIComponent(
        buildWhatsAppMessage(
          order.customer_name,
          `${window.location.origin}/invoice/${order.id}?token=${order.access_token}`
        )
      )}`
    : "#"

  // ── Loading ──

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="animate-pulse space-y-6 w-full max-w-[860px]">
          <div className="h-10 w-56 bg-neutral-200 rounded mx-auto" />
          <div className="h-5 w-36 bg-neutral-200 rounded mx-auto" />
          <div className="h-[460px] bg-neutral-100 rounded-2xl border border-neutral-200" />
        </div>
      </div>
    )
  }

  // ── Not found ──

  if (!order || error) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-neutral-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-7 h-7 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">Invoice Not Found</h1>
          <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
            This invoice could not be located. It may have been removed or the link may be incorrect.
          </p>
          <a
            href="/shop"
            className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-7 py-3.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Continue Shopping
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1)

  // ── Invoice ──

  return (
    <>
      {/* ─── Locked Modal (fresh order only) ─── */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop — blocks all interaction */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
              modalVisible ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Modal Card */}
          <div
            className={`relative bg-white rounded-2xl max-w-sm w-full boty-shadow border border-neutral-200/50 transition-all duration-300 ${
              modalVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 12v4m0 0l-2-2m2 2l2-2"
                  />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-neutral-900 mb-2">
                Send invoice to vendor
              </h2>
              <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
                Share this invoice with the vendor via WhatsApp so they can process your order.
              </p>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={handleProceed}
                disabled={sending}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening WhatsApp...
                  </>
                ) : (
                  "Proceed"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Action Bar (hidden when printing) ─── */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-neutral-900 text-white z-[9999] backdrop-blur-sm">
        <div className="max-w-[860px] mx-auto px-5 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold tracking-wide">Invoice #{order.id.slice(0, 8).toUpperCase()}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
              <a
                href={vendorWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <Image
                  src="https://res.cloudinary.com/deafv5ovi/image/upload/v1784388399/wa_a2bmcx.png"
                  alt="WhatsApp"
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] object-contain"
                />
                <span className="hidden sm:inline">Share with vendor</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Invoice Document ─── */}
      <div className="bg-neutral-100 print:bg-white min-h-screen pt-16 sm:pt-20 print:pt-0 pb-10 sm:pb-16 print:pb-0 px-4 sm:px-6">
        <div
          id="invoice-document"
          className="max-w-[860px] mx-auto bg-white print:shadow-none shadow-2xl print:rounded-none rounded-2xl overflow-hidden border border-neutral-200/60 print:border-none"
          style={{ fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
        >
          <div className="p-6 sm:p-12 md:p-16">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12 pb-10 border-b border-neutral-200">
              <div className="flex items-start gap-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm border border-neutral-200">
                  <Image
                    src="https://res.cloudinary.com/deafv5ovi/image/upload/v1784555201/a_dow3yp.png"
                    alt="Ammie N"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] mb-1">Ammie N</p>
                  <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-neutral-900 leading-none tracking-tight mb-2">
                    INVOICE
                  </h1>
                  <p className="text-sm text-neutral-500">Premium Hair & Extensions</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${order.status === "delivered" ? "bg-emerald-400" : order.status === "cancelled" ? "bg-red-400" : "bg-amber-400"}`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${order.status === "delivered" ? "bg-emerald-500" : order.status === "cancelled" ? "bg-red-500" : "bg-amber-500"}`} />
                  </span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${order.status === "delivered" ? "text-emerald-600" : order.status === "cancelled" ? "text-red-600" : "text-amber-600"}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="text-neutral-500">
                    <span className="font-medium text-neutral-900">Invoice No.</span>
                    <br />
                    <span className="font-mono text-xs tracking-wider">{order.id.slice(0, 8).toUpperCase()}</span>
                  </p>
                  <p className="text-neutral-500 pt-1.5">
                    <span className="font-medium text-neutral-900">Issued</span>
                    <br />
                    {formatDate(order.created_at)}
                    <br />
                    <span className="text-xs text-neutral-400">{formatTime(order.created_at)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── Customer Info ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3">Customer</h3>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-neutral-900">{order.customer_name}</p>
                  <p className="text-sm text-neutral-600">{order.customer_phone}</p>
                </div>
              </div>
              <div className="sm:text-right">
                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3">Delivery Address</h3>
                <div className="space-y-1">
                  {(order.customer_state || order.customer_country) && (
                    <p className="text-sm font-medium text-neutral-700">
                      {[order.customer_state, order.customer_country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{order.customer_address}</p>
                </div>
              </div>
            </div>

            {/* ── Items Table ── */}
            <div className="mb-12">
              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50">
                      <th className="text-left py-4 pl-5 pr-2 text-[11px] font-bold text-neutral-400 uppercase tracking-[0.12em] w-14">#</th>
                      <th className="text-left py-4 pr-2 text-[11px] font-bold text-neutral-400 uppercase tracking-[0.12em]">Item</th>
                      <th className="text-center py-4 pr-2 text-[11px] font-bold text-neutral-400 uppercase tracking-[0.12em] w-16">Qty</th>
                      <th className="text-right py-4 pr-5 text-[11px] font-bold text-neutral-400 uppercase tracking-[0.12em] w-36">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {order.items.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 pl-5 pr-2 text-neutral-400 font-medium text-xs align-top">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="py-4 pr-2 align-top">
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 ring-1 ring-neutral-200/50">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-neutral-900 text-sm leading-snug">{item.name}</p>
                              <p className="text-[11px] text-neutral-400 mt-0.5">SKU: AN-{item.id.slice(0, 4).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center text-neutral-600 text-sm font-medium align-top">{item.quantity}</td>
                        <td className="py-4 text-right pr-5 align-top font-semibold text-neutral-900 text-sm tabular-nums">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((item.price * item.quantity) || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Totals ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
              {/* Notes */}
              <div className="sm:max-w-[260px]">
                <div className="mt-1">
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Please retain this invoice for your records. For any inquiries, reference Invoice No. above.
                  </p>
                </div>
              </div>

              {/* Totals Panel */}
              <div className="sm:w-[300px]">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-baseline text-neutral-500 pb-3 border-b border-neutral-100">
                    <span>Subtotal</span>
                    <span className="font-medium text-neutral-900 tabular-nums">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(order.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-base font-bold text-neutral-900">Total Due</span>
                    <span className="text-xl font-bold text-neutral-900 tabular-nums tracking-tight">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(order.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="mt-16 pt-8 border-t border-neutral-100 text-center">
              <p className="text-sm font-semibold text-neutral-800 mb-1">Thank you for choosing Ammie N</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Wear confidence. Naturally you. &mdash; Premium human hair, wigs & extensions.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}