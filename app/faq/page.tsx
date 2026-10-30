"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ChevronDown, Copy, Check } from "lucide-react"

const faqCategories = [
  {
    title: "Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "Ready to deliver wigs are processed within 3 to 5 business days. Processing time for custom orders varies by style. Standard shipping takes 5 to 7 business days, depending on your location. Express shipping is available at checkout for faster delivery. All deliveries are handled by DHL."
      },
      {
        q: "Is delivery door to door?",
        a: "Yes. DHL delivers directly to your address. We will provide a tracking number after your order has been processed."
      },
      {
        q: "How much is shipping?",
        a: "Shipping rates depend on your location and the weight of your order. You will see the exact cost at checkout before completing your purchase. Free shipping is available on orders over $800, excluding wholesale and bulk orders. Express shipping is available at an additional cost."
      }
    ]
  },
  {
    title: "Returns and Exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "Because of the hygienic nature of hair products, all sales of custom wigs, altered units, and sale items are final. Ready to ship wigs may qualify for store credit or an exchange within 7 days of delivery, with a 25% restocking fee. To qualify, the security tag must be fully intact, the lace must be uncut, and the wig must be completely unworn and free from perfume, smoke, glue, or other odors. You are responsible for tracked return shipping. To request a return, email amysglamroom@gmail.com or contact us through WhatsApp. If your request is approved, we will provide the return address and a Return Authorization Number. Please mail the package within 3 business days of approval. After we receive the wig, allow 3 to 5 business days for inspection and for us to issue store credit or process your exchange."
      },
      {
        q: "Can I exchange my wig?",
        a: "Yes. Eligible ready to ship wigs may be exchanged within 7 days of delivery. You are responsible for tracked return shipping, and the new item will be shipped at the current delivery cost. Custom wigs, altered units, and sale items are not eligible for exchanges."
      },
      {
        q: "Can I get a refund?",
        a: "We do not offer refunds on custom wigs, altered units, or sale items. Eligible ready to ship wigs may qualify for store credit or an exchange within 7 days of delivery, subject to the return conditions and 25% restocking fee."
      }
    ]
  },
  {
    title: "Damaged or Defective Items",
    questions: [
      {
        q: "What if my wig arrives damaged or defective?",
        a: "We inspect every unit before shipping, but damage can sometimes happen in transit. Please check your package as soon as it arrives. If your item is damaged or defective, email amysglamroom@gmail.com within 48 hours of delivery. Include your order number, clear photos of the damaged shipping box, and clear photos or videos showing the defect. Please keep the original packaging, and do not cut the lace or alter the wig. Approved claims qualify for a replacement at a 40% discount, with no additional delivery cost. We cannot accept claims submitted after 48 hours or without the required photos or videos."
      }
    ]
  },
  {
    title: "Our Error",
    questions: [
      {
        q: "What happens if you send me the wrong item?",
        a: "If we made a mistake, you may qualify for a replacement, exchange, or store credit. This policy covers two situations: you received a different wig style or texture from the one on your invoice, or you received a different cap size from the one you ordered. It applies to custom orders, but not to ready to ship or sale items. Contact us at amysglamroom@gmail.com or through WhatsApp within 48 hours of delivery. Include your order number, clear photos, and a video of the unboxing. The security tag must remain intact, and the wig must be unworn and unaltered. If we confirm the error, we will provide prepaid return shipping and send a replacement after receiving and inspecting the wig."
      }
    ]
  },
  {
    title: "Wig Care",
    questions: [
      {
        q: "How do I care for my wig?",
        a: "Wash your wig every 6 to 8 wears with sulfate free shampoo and conditioner. Use cool water, and avoid rubbing or twisting the hair. Apply a leave in conditioner and let the wig air dry on a wig stand. When you are not wearing it, store the wig on a stand or in a silk bag."
      }
    ]
  },
  {
    title: "Hair Quality",
    questions: [
      {
        q: "What type of hair do you use?",
        a: "We use 100% virgin human hair for our closures, frontals, full lace wigs, and hair extensions. You can style, color, and care for the human hair much like your own hair. For braiding, we use Kanekalon or synthetic fiber hair."
      }
    ]
  },
  {
    title: "Sizing and Fit",
    questions: [
      {
        q: "How do I choose the right size?",
        a: "Use our size chart to find your fit. Our wigs come in standard sizes with adjustable straps. If you are between sizes or have a larger head circumference, contact us about custom sizing."
      },
      {
        q: "Are the wigs adjustable?",
        a: "Yes. Our wigs have adjustable straps and combs inside the cap to help you find a comfortable, secure fit. Most wigs fit head circumferences between 21 and 23 inches."
      }
    ]
  },
  {
    title: "Styling",
    questions: [
      {
        q: "Can I style my wig with heat tools?",
        a: "Yes. You can use heat tools on our 100% virgin human hair wigs. Use less heat on curly textures to help preserve the curl pattern. Only use heat or hot water on Kanekalon and synthetic fiber hair if the product is specifically made to handle it."
      }
    ]
  },
  {
    title: "Wig Lifespan",
    questions: [
      {
        q: "How long will my wig last?",
        a: "With proper care, our wigs can last 1 to 3 years or longer. How long yours lasts depends on how often you wear it, how you care for it, and which products you use. Following our wig care instructions can help extend its life."
      }
    ]
  }
]

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

export default function FAQPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-32 sm:pt-40">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
          {/* Header */}
        <div className="mb-12 max-w-3xl">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Got Questions?
            </span>
          <h1 className="mb-4 font-sans text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              Frequently Asked Questions
            </h1>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
              Everything you need to know about our products, shipping, returns, and more
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-12">
            {faqCategories.map((category) => (
              <section key={category.title}>
                <h2 className="mb-2 border-b border-border pb-3 font-sans text-lg font-semibold text-foreground">
                  {category.title}
                </h2>
                <div className="divide-y divide-border">
                  {category.questions.map((item, index) => (
                    <details
                      key={index}
                      className="group overflow-hidden"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-foreground transition-colors hover:text-muted-foreground">
                        <span className="text-sm font-medium sm:text-base">{item.q}</span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="pb-5 pr-8">
                        <p className="text-sm leading-6 text-muted-foreground">
                          {renderWithEmails(item.a)}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-16 rounded-md bg-muted p-6 sm:p-10">
            <h2 className="mb-2 font-sans text-xl font-medium text-foreground sm:text-2xl">
              Still have questions?
            </h2>
            <p className="mb-6 max-w-md text-sm leading-6 text-muted-foreground">
              Can't find the answer you're looking for? Please reach out to our friendly team.
            </p>
            <a
              href="mailto:amysglamroom@gmail.com"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}