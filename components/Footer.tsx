"use client"

import { useState } from "react"
import { useFlowerShopStore } from "@/lib/store"
import { Flower, Mail, Phone, MapPin, Heart, CheckCircle2 } from "lucide-react"

export default function Footer() {
  const { setActiveTab } = useFlowerShopStore()
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setIsSubscribed(true)
      setEmail("")
    }
  }

  const navigateTo = (tab: "home" | "catalog" | "builder" | "care" | "tracker") => {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      {/* Brand values banner */}
      <div className="border-b border-stone-800 bg-stone-950 px-4 py-8 text-center">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-3 text-sm">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🌸</span>
            <h4 className="font-semibold text-stone-100">100% Freshness Guarantee</h4>
            <p className="text-stone-400 text-xs max-w-xs">Sourced directly from sustainable farms and delivered in bud stage for long-lasting beauty.</p>
          </div>
          <div className="flex flex-col items-center gap-2 border-y border-stone-800 py-6 sm:border-y-0 sm:border-x sm:py-0 px-4">
            <span className="text-2xl">💝</span>
            <h4 className="font-semibold text-stone-100">Artisanal Hand-Tied</h4>
            <p className="text-stone-400 text-xs max-w-xs">Every arrangement is handcrafted with passion by our certified master florists.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h4 className="font-semibold text-stone-100">Same-Day Hand Delivery</h4>
            <p className="text-stone-400 text-xs max-w-xs">Hand-delivered in temperature-controlled vans to preserve delicate petals.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Flower className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-stone-100 font-serif">Petal & Bloom</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              We compose floral stories that express emotions when words are not enough. Celebrating life&apos;s beautiful moments since 2018.
            </p>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>+1 (800) 555-FLOWERS</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-secondary" />
                <span>452 Rosebud Ave, Paris / New York</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider mb-4">Shop Collections</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo("catalog")} className="hover:text-primary transition-colors text-left">
                  Signature Bouquets
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo("builder")} className="hover:text-primary transition-colors text-left">
                  DIY Custom Builder
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo("catalog")} className="hover:text-primary transition-colors text-left">
                  Indoor Plants & Succulents
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo("catalog")} className="hover:text-primary transition-colors text-left">
                  Wedding & Special Events
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div>
            <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider mb-4">Customer Care</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo("tracker")} className="hover:text-primary transition-colors text-left">
                  Track Your Delivery
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo("care")} className="hover:text-primary transition-colors text-left">
                  Flower Care Instructions
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Delivery Areas & Rates
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  FAQs & Support
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter Subscription */}
          <div>
            <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider mb-4">Join the Bloom Club</h3>
            <p className="text-xs text-stone-400 mb-3 leading-relaxed">
              Subscribe to get 15% off your first order, secret promo codes, and flower care tips.
            </p>

            {isSubscribed ? (
              <div className="rounded-lg bg-emerald-950/40 border border-emerald-800 p-3 flex items-start gap-2 text-emerald-400 animate-in fade-in duration-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-emerald-300">Welcome to the Club!</h4>
                  <p className="text-[10px] text-emerald-400/90 mt-0.5">Your 15% discount code has been sent to your inbox.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-stone-800 border border-stone-700 px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary-600 transition-colors"
                    aria-label="Subscribe"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-stone-500">We respect your privacy. Unsubscribe anytime.</span>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Petal & Bloom Florist. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-primary fill-primary animate-pulse" /> in Paris & New York
          </p>
        </div>
      </div>
    </footer>
  )
}
