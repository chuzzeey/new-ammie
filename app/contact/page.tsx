"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Phone } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-32 sm:pt-40">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          {/* Header */}
          <div className="mb-12 max-w-2xl">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Get In Touch
            </span>
            <h1 className="mb-4 font-sans text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              Contact Us
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Have a question or need assistance? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <section>
              <h2 className="mb-4 text-sm font-semibold text-foreground">Connect with us</h2>
              <div className="divide-y divide-border border-y border-border">
              {[
                {
                  name: "Instagram",
                  icon: "https://res.cloudinary.com/deafv5ovi/image/upload/v1784573107/instagram_u9lr7l.png",
                  url: "https://www.instagram.com/ammie_nwigs?igsh=MWR4NXJyeXB4dTlvZw==",
                },
                {
                  name: "TikTok",
                  icon: "https://res.cloudinary.com/deafv5ovi/image/upload/v1784573107/tiktok_rsrzwc.png",
                  url: "https://www.tiktok.com/@amysglamroom?_r=1&_t=ZS-988kqtnNJoq",
                },
                {
                  name: "Facebook",
                  icon: "https://res.cloudinary.com/deafv5ovi/image/upload/v1784573107/facebook_qgj6dg.png",
                  url: "https://www.facebook.com/share/1PFS4iCgiH/?mibextid=wwXIfr",
                },
                {
                  name: "YouTube",
                  icon: "https://res.cloudinary.com/deafv5ovi/image/upload/v1784573106/youtube_qtbvcz.png",
                  url: "https://www.youtube.com/@TheAmmieN",
                },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-4 transition-colors hover:text-muted-foreground"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <img src={social.icon} alt="" className="h-7 w-7 object-contain" />
                    {social.name}
                  </span>
                </a>
              ))}
              </div>
            </section>

            <aside className="h-fit rounded-md bg-muted p-6 sm:p-8">
              <h2 className="mb-2 font-sans text-xl font-medium text-foreground">We’re here to help</h2>
              <p className="mb-6 text-sm leading-6 text-muted-foreground">
                Questions about a product, your order, or finding the right fit? Reach out and we’ll be happy to help.
              </p>
              <a
                href="mailto:amysglamroom@gmail.com"
                className="mb-3 block break-all text-sm font-medium text-foreground underline underline-offset-4"
              >
                amysglamroom@gmail.com
              </a>
              <a
                href="tel:+2349031560905"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Phone className="h-4 w-4" />
                Call us
              </a>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
