"use client"

import { useFlowerShopStore } from "@/lib/store"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ProductCatalog from "@/components/ProductCatalog"
import BouquetBuilder from "@/components/BouquetBuilder"
import CareGuide from "@/components/CareGuide"
import OrderTracker from "@/components/OrderTracker"
import CartDrawer from "@/components/CartDrawer"
import { ArrowRight, Flower, Sparkles, Heart, Star, Gift } from "lucide-react"

export default function Home() {
  const { activeTab, setActiveTab } = useFlowerShopStore()

  const handleShopNow = () => {
    setActiveTab("catalog")
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 400, behavior: "smooth" })
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {activeTab === "home" && (
          <div className="animate-in fade-in duration-500">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-stone-100 py-16 sm:py-24 border-b border-border">
              {/* Background Art */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#db4869_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
              <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                  <div className="md:col-span-7 space-y-6 text-center md:text-left">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                      <Sparkles className="h-3 w-3" />
                      Artisan Flower Shop
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-serif leading-tight text-balance">
                      Express Your Heart Through <span className="text-primary italic font-normal">Fresh Petals</span>
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed text-pretty">
                      Bespoke, handcrafted bouquets hand-tied by master florists. Sourced from organic farms, arranged with passion, and delivered fresh in temperature-controlled vans.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
                      <button
                        onClick={handleShopNow}
                        className="rounded-full bg-primary hover:bg-primary-600 text-white px-8 py-3.5 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        Shop Signature Bouquets
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab("builder")}
                        className="rounded-full border border-border bg-white text-foreground hover:bg-muted px-8 py-3.5 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        DIY Bouquet Studio
                        <Flower className="h-4 w-4 text-secondary" />
                      </button>
                    </div>

                    {/* Simple Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border max-w-md mx-auto md:mx-0 text-center md:text-left">
                      <div>
                        <p className="text-2xl font-bold text-foreground font-serif">100%</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Freshness Guarantee</p>
                      </div>
                      <div className="border-x border-border px-4">
                        <p className="text-2xl font-bold text-foreground font-serif">4.9 ★</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">12k+ Reviews</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground font-serif">Same-Day</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Hand Delivery</p>
                      </div>
                    </div>
                  </div>

                  {/* Hero Image */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative aspect-[4/5] w-full max-w-[340px] rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-500">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=600"
                        alt="Signature Rose Bouquet"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 backdrop-blur-md p-3.5 shadow-md flex justify-between items-center border border-white/20">
                        <div>
                          <h4 className="text-xs font-bold text-foreground font-serif">Eternal Romance</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Our Signature Rose Bouquet</p>
                        </div>
                        <span className="text-xs font-bold text-primary">$85.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Collections Promo banner */}
            <section className="bg-secondary text-secondary-foreground py-12">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="rounded-full bg-white/20 text-white px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                      New Experience
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif">DIY Custom Bouquet Studio</h2>
                    <p className="text-xs sm:text-sm text-secondary-foreground/90 leading-relaxed max-w-xl">
                      Unleash your inner florist. Select individual stems (Roses, Peonies, Eucalyptus, Baby&apos;s Breath), choose a premium wrap style, and name your design. We will hand-tie it exactly as you visualize!
                    </p>
                    <button
                      onClick={() => setActiveTab("builder")}
                      className="rounded-full bg-white text-secondary hover:bg-stone-100 px-6 py-2.5 text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5"
                    >
                      Enter DIY Studio
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center text-3xl">🌹</div>
                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center text-3xl">🌷</div>
                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center text-3xl">🌺</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Catalog section directly on Home */}
            <ProductCatalog />

            {/* Flower Care Tip of the Day */}
            <section className="bg-stone-50 border-t border-b border-border py-12">
              <div className="mx-auto max-w-3xl px-4 text-center space-y-4">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-bold font-serif text-foreground">Flower Care Tip of the Day</h3>
                <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed max-w-xl mx-auto">
                  &ldquo;To extend the life of fresh roses, trim their stems at a 45-degree angle under water. This prevents air bubbles from entering the stem&apos;s drinking capillaries, ensuring they stay hydrated!&rdquo;
                </p>
                <button
                  onClick={() => setActiveTab("care")}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View Full Care Guide →
                </button>
              </div>
            </section>

            {/* Testimonials */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">Loved by Flower Enthusiasts</h2>
                <p className="text-xs text-muted-foreground mt-1">See why thousands trust Petal & Bloom for their special moments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Samantha L.",
                    text: "The custom bouquet builder is incredible! I built my mom a mix of peonies and eucalyptus for her birthday, and she cried when she saw it. The delivery was exactly on time and the flowers were fresh.",
                    stars: 5,
                    title: "Breathtakingly beautiful"
                  },
                  {
                    name: "Michael K.",
                    text: "Absolutely premium service. The roses look like they were plucked from a Parisian garden this morning. I love that they send tracking updates from the florist's desk to the delivery van.",
                    stars: 5,
                    title: "Exceptional quality & service"
                  },
                  {
                    name: "Elena R.",
                    text: "I appreciate the detailed care guide included in the shipment. My lilies have been blooming sequentially for almost two weeks now. This is my go-to florist from now on.",
                    stars: 5,
                    title: "Super long-lasting blooms"
                  }
                ].map((test, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(test.stars)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                      ))}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{test.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 italic">&ldquo;{test.text}&rdquo;</p>
                    </div>
                    <p className="text-[10px] font-bold uppercase text-secondary tracking-wider pt-1">{test.name} • Verified Buyer</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "catalog" && <ProductCatalog />}
        {activeTab === "builder" && <BouquetBuilder />}
        {activeTab === "care" && <CareGuide />}
        {activeTab === "tracker" && <OrderTracker />}
      </main>

      <Footer />
      <CartDrawer />
    </>
  )
}
