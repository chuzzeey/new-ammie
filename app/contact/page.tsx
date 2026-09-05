"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Phone } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Get In Touch
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 text-balance">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question or need assistance? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>

          {/* Social Links */}
          <div className="max-w-3xl mx-auto mb-16">

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card boty-shadow hover:shadow-md transition-shadow duration-300"
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-sm font-medium text-foreground">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-10 md:p-14 text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              We'd love to hear from you
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Whether you have a question about our products, need help with an order, or want to provide feedback, our team is ready to assist you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:+2349031560905"
                className="inline-flex items-center justify-center gap-2 bg-background text-foreground px-8 py-4 rounded-full text-sm tracking-wide boty-transition hover:bg-background/80 boty-shadow border border-border"
              >
                <Phone className="w-4 h-4" />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
