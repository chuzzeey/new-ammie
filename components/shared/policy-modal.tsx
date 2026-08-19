"use client"

import { useEffect, useState } from "react"
import { X, Copy, Check } from "lucide-react"

type ModalType = "privacy" | "terms" | "shipping"

interface PolicyModalProps {
  type: ModalType | null
  onClose: () => void
}

const content: Record<ModalType, { title: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    body: `We respect your privacy and are committed to protecting the personal information you provide when using our website or placing an order.

Information We Collect
Information provided by customers may include information necessary to process orders, provide customer support, arrange delivery, and communicate with customers regarding their purchases.

How We Use Your Information
Customer information should only be used for legitimate business purposes related to providing our products and services.

Data Security
We take reasonable steps to protect customer information and maintain the security of information submitted through our website.

Contact
Customers should contact our customer service team if they have questions regarding their personal information or its use.

Customer service email: amysglamroom@gmail.com`
  },
  terms: {
    title: "Terms of Service",
    body: `By using our website or placing an order, you agree to the store's current terms, policies, and conditions.

Customers are responsible for reviewing product information, sizing information, order details, shipping information, and applicable return or exchange conditions before completing an order.

Once an order is placed and processed, the applicable processing, shipping, return, exchange, and product policies will apply.

Custom Orders
Custom wigs are subject to specific processing requirements because they are made according to the customer's requested specifications. Due to the hygienic nature of hair products and the labor involved in custom wig construction, custom wigs are final sale except where the specific "Our Error" policy applies. Custom wigs cannot be returned simply because the customer changes their mind or no longer wants the product.

Altered Units and Sale Items
All sales of altered units and sale items are final. These items are not eligible for the standard ready to ship return and exchange policy.

Ready to Ship Wigs
Eligible ready to ship wigs may be returned for store credit or exchanged within 7 days of delivery. A 25% restocking fee applies. The security tag must remain fully intact. The lace must completely remain uncut. The wig must be completely unworn. The wig must be free from perfumes, smoke, glue, or other smells. The customer is responsible for tracked return shipping.

Return Process
To request a return, customers must contact amysglamroom@gmail.com or use the WhatsApp contact option. Once the return is approved, the customer will receive the return shipping address and a Return Authorization Number. The package must be mailed back within 3 business days of receiving approval. Once received, the returned unit will be inspected. Customers should allow 3 to 5 business days after the returned unit is received for the inspection and processing of the applicable store credit or exchange.

Damaged or Defective Items
Customers must inspect their package immediately after delivery. If an item arrives damaged or defective, the customer must contact amysglamroom@gmail.com within 48 hours of delivery. The customer must provide: Order number, clear photos of the damaged shipping box, and clear photos or videos showing the specific defect. Customers must not cut the lace, alter the unit, or throw away the packaging before the claim is reviewed. Valid claims will receive a complimentary replacement at a 40% discount with no additional delivery cost. Claims submitted after 48 hours or without the required photographic proof will not be accepted.

Our Error Policy
If the store sends the wrong item, the customer may qualify for a resolution under the "Our Error" policy. Qualifying errors are strictly limited to: Wrong Item Sent — the customer received a completely different wig style or texture from what is listed on the original invoice. Wrong Cap Size Sent — the customer ordered a specific cap size but received a different cap size. This policy applies to custom orders and does not apply to ready to ship or sale items.

To qualify, the customer must contact the store within 48 hours of delivery through amysglamroom@gmail.com or WhatsApp. The customer must provide the order number, clear photos, and a video of the unboxing. The security tag must remain fully intact and attached. The lace must remain completely uncut. The wig must remain unworn and unaltered.

If the store confirms that the error was made by the store, prepaid return shipping will be provided and a replacement will be issued after the returned unit is received and inspected.

The store does not cover return costs for units that have been cut, styled, glued, or altered by the customer or a stylist.`
  },
  shipping: {
    title: "Shipping Policy",
    body: `All deliveries are handled by DHL and are door to door.

Ready to Deliver Wigs
Ready to deliver wigs are processed within 3 to 5 business days. After processing, standard shipping takes approximately 5 to 7 business days after delivery depending on the customer's location.

Custom Orders
Processing time for custom orders varies depending on the requested style. Customers should allow the applicable processing time before the order is shipped.

Express Shipping
Express shipping is available at checkout for customers who require faster delivery. Express shipping is available at an additional cost.

Shipping Rates
Shipping rates vary depending on the customer's location and the weight of the order. The exact shipping cost will be displayed at checkout before the customer completes the order.

Free Shipping
Free shipping is available for orders over $800. Free shipping does not apply to wholesale or bulk orders.

Tracking
All deliveries are handled through DHL. Tracking numbers will be provided after the order has been processed.

Customer Service
For any shipping-related inquiries, reach out to us at amysglamroom@gmail.com.`
  }
}

const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g

function EmailLink({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = email
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <a
        href={`mailto:${email}`}
        className="font-bold text-primary hover:text-primary/80 underline underline-offset-2 boty-transition"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 boty-transition cursor-pointer"
        aria-label={`Copy ${email}`}
        title="Copy email"
      >
        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      </button>
    </span>
  )
}

function renderWithEmails(text: string) {
  const parts = text.split(EMAIL_REGEX)
  return parts.map((part, index) => {
    if (EMAIL_REGEX.test(part)) {
      return <EmailLink key={index} email={part} />
    }
    return <span key={index}>{part}</span>
  })
}

export function PolicyModal({ type, onClose }: PolicyModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (type) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [type])

  useEffect(() => {
    if (!type) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [type])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (!type) return null

  const { title, body } = content[type]

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] backdrop-blur-sm bg-black/30 transition-all duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <div
          className="bg-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto boty-shadow hide-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-6 pb-4 border-b border-border/50">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 pt-4">
            {body.split("\n\n").map((paragraph, i) => {
              const lines = paragraph.split("\n")
              const isHeading = lines.length === 1 && lines[0].length < 50 && !lines[0].endsWith(".") && !lines[0].includes("@")

              if (isHeading) {
                return (
                  <h3 key={i} className="font-medium text-foreground mt-5 mb-2 first:mt-0">
                    {lines[0]}
                  </h3>
                )
              }

              return (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-4 last:mb-0">
                  {renderWithEmails(paragraph)}
                </p>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}