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
        a: "Ready to deliver wigs are processed within 3 to 5 business days. Processing time for custom orders varies depending on the style. Standard shipping takes 5 to 7 business days depending on the customer's location. Express shipping is available at checkout for faster delivery. All deliveries are handled by DHL."
      },
      {
        q: "Is delivery door to door?",
        a: "Yes. All deliveries are door to door through DHL. Tracking numbers will be provided after the order has been processed."
      },
      {
        q: "How much is shipping?",
        a: "Shipping rates vary depending on the customer's location and the weight of the order. The exact shipping cost will be shown at checkout before the order is completed. We offer free shipping on orders over $800. This does not apply to wholesale or bulk orders. Express shipping is available at an additional cost."
      }
    ]
  },
  {
    title: "Returns and Exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "Due to the hygienic nature of hair products, all sales of custom wigs, altered units, and sale items are final. For ready to ship wigs, we offer store credit or exchanges within 7 days of delivery, subject to a 25% restocking fee. To qualify, the security tag must be fully intact, the lace must be uncut, the wig must be completely unworn, and the unit must be free from perfumes, smoke, glue, or other smells. The customer is responsible for tracked return shipping. To start a return, email amysglamroom@gmail.com or contact us through the WhatsApp icon. Once the return is approved, we will provide the return shipping address and a Return Authorization Number. The package must be mailed back within 3 business days of receiving approval. Once the returned unit is received, please allow 3 to 5 business days for our team to inspect the unit and issue store credit or process the exchange."
      },
      {
        q: "Can I exchange my wig?",
        a: "Yes. Exchanges are available for eligible ready to ship wigs within 7 days of delivery. The customer is responsible for tracked return shipping. The new item will be shipped at the full current delivery cost. Custom wigs, altered units, and sale items are not eligible for exchanges."
      },
      {
        q: "Can I get a refund?",
        a: "We do not offer refunds on custom wigs, altered units, or sale items. Eligible ready to ship wigs may qualify for store credit or an exchange within 7 days of delivery, subject to the return conditions and a 25% restocking fee."
      }
    ]
  },
  {
    title: "Damaged or Defective Items",
    questions: [
      {
        q: "What if my wig arrives damaged or defective?",
        a: "We inspect every unit before shipping, but damage can sometimes occur during transit. Please inspect your package immediately after delivery. If your item arrives damaged or defective, contact us at amysglamroom@gmail.com within 48 hours of delivery. You must provide your order number, clear photos of the damaged shipping box, and clear photos or videos showing the specific defect. Do not cut the lace, alter the unit, or throw away the original packaging. Valid claims will receive a complimentary replacement at a 40% discount with no additional delivery cost. Claims submitted after 48 hours or without the required photographic proof will not be accepted."
      }
    ]
  },
  {
    title: "Our Error",
    questions: [
      {
        q: "What happens if you send me the wrong item?",
        a: "If our team made the mistake, you may qualify for a replacement, exchange, or store credit depending on the situation. Qualifying errors are strictly limited to: Wrong Item Sent — you received a completely different wig style or texture from what is listed on your original invoice. Wrong Cap Size Sent — you ordered a specific cap size but received a different cap size. This policy applies to custom orders and does not apply to ready to ship or sale items. To qualify, contact us at amysglamroom@gmail.com or through WhatsApp within 48 hours of delivery. You must provide your order number, clear photos, and a video of the unboxing. The security tag must remain fully intact and the wig must remain unworn and unaltered. If we confirm the error was made by our team, we will provide prepaid return shipping and issue a replacement after receiving and inspecting the unit."
      }
    ]
  },
  {
    title: "Wig Care",
    questions: [
      {
        q: "How do I care for my wig?",
        a: "Wash your wig every 6 to 8 wears using sulfate free shampoo and conditioner. Use cool water and avoid rubbing or twisting the hair. Apply a leave in conditioner and allow the wig to air dry on a wig stand. When not in use, store the wig on a wig stand or in a silk bag."
      }
    ]
  },
  {
    title: "Hair Quality",
    questions: [
      {
        q: "What type of hair do you use?",
        a: "We use 100% virgin human hair for our closures, frontals, full lace wigs, and hair extensions. Our human hair can be styled, colored, and treated similarly to natural hair. For braiding, we use kanekalon or synthetic fiber hair."
      }
    ]
  },
  {
    title: "Sizing and Fit",
    questions: [
      {
        q: "How do I choose the right size?",
        a: "Please refer to our size chart. Our wigs come in standard sizes with adjustable straps. If you are between sizes or have a larger head circumference, please contact us for custom sizing options."
      },
      {
        q: "Are the wigs adjustable?",
        a: "Yes. Our wigs feature adjustable straps and combs inside the cap, allowing you to customize the fit for comfort and security. Most wigs fit head circumferences between 21 and 23 inches."
      }
    ]
  },
  {
    title: "Styling",
    questions: [
      {
        q: "Can I style my wig with heat tools?",
        a: "Yes. Our 100% virgin human hair wigs can be styled using heat tools. For curly textures, we recommend limiting heating to help preserve the texture. Kanekalon and synthetic fiber hair should only be exposed to heat or hot water when the specific product is designed to handle it."
      }
    ]
  },
  {
    title: "Wig Lifespan",
    questions: [
      {
        q: "How long will my wig last?",
        a: "With proper care, our wigs can last 1 to 3 years or longer. The lifespan depends on how frequently the wig is worn, how well it is maintained, and the products used on it. Following our wig care instructions will help maximize its longevity."
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

      <div className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Got Questions?
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 text-balance">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Everything you need to know about our products, shipping, returns, and more
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-16">
            {faqCategories.map((category) => (
              <section key={category.title}>
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8 pb-4 border-b border-border/50">
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((item, index) => (
                    <details
                      key={index}
                      className="group bg-card rounded-2xl boty-shadow overflow-hidden boty-transition open:bg-card"
                    >
                      <summary className="flex items-center justify-between gap-4 p-5 md:p-6 cursor-pointer list-none text-foreground font-medium hover:text-primary boty-transition">
                        <span className="text-sm md:text-base">{item.q}</span>
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 boty-transition group-open:rotate-180" />
                      </summary>
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
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
          <div className="mt-20 text-center bg-card rounded-3xl p-10 md:p-14 boty-shadow">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Can't find the answer you're looking for? Please reach out to our friendly team.
            </p>
            <a
              href="mailto:amysglamroom@gmail.com"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow"
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