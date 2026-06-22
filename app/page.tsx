"use client"

import { useFlowerShopStore } from "@/lib/store"
import ProductCatalog, { PRODUCTS } from "@/components/ProductCatalog"
import BouquetBuilder from "@/components/BouquetBuilder"
import CareGuide from "@/components/CareGuide"
import OrderTracker from "@/components/OrderTracker"
import { ArrowRight, Sparkles, Gift, Heart, Star, Compass, ShoppingBag } from "lucide-react"

export default function Home() {
  const { activeTab, setActiveTab, setSelectedCategory, setPreviewProduct } = useFlowerShopStore()

  const handleShopNow = (category: string = "all") => {
    setSelectedCategory(category)
    setActiveTab("catalog")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleOpenBuilder = () => {
    setActiveTab("builder")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Get 3 featured products for the homepage showcase
  const featuredProducts = PRODUCTS.slice(0, 3)

  return (
    <div className="min-h-screen">
      {/* Dynamic Tab Routing */}
      {activeTab === "home" && (
        <div className="animate-in fade-in duration-300">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-stone-100 py-16 md:py-24 border-b border-border">
            {/* Background Image / Pattern */}
            <div className="absolute inset-0 opacity-15 mix-blend-overlay">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1200"
                alt="Floral background"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
                {/* Hero Text */}
                <div className="space-y-6 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary tracking-wider uppercase">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium Same-Day Delivery
                  </div>
                  
                  <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl font-serif leading-tight">
                    Composing <span className="text-primary italic">Floral</span> Masterpieces
                  </h1>
                  
                  <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed mx-auto md:mx-0">
                    Sourced sustainably from award-winning farms, our hand-tied bouquets are crafted by master florists to express your deepest emotions.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                    <button
                      onClick={() => handleShopNow("all")}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-600 text-white px-8 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Shop Collection
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleOpenBuilder}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-border bg-white hover:bg-stone-50 text-foreground px-8 py-3.5 text-sm font-bold shadow-sm transition-all"
                    >
                      DIY Bouquet Studio
                    </button>
                  </div>
                </div>

                {/* Hero Image / Visual Collage */}
                <div className="relative flex justify-center">
                  <div className="relative w-full max-w-[360px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=600"
                      alt="Signature Bouquet"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-300">Featured Arrangement</span>
                      <h3 className="text-lg font-bold font-serif mt-0.5">Eternal Romance Bouquet</h3>
                      <p className="text-xs text-stone-200 mt-1">Lush red roses and fresh eucalyptus</p>
                    </div>
                  </div>

                  {/* Decorative Badge */}
                  <div className="absolute -bottom-4 -left-4 bg-secondary text-secondary-foreground rounded-2xl p-4 shadow-lg border border-secondary-600 max-w-[150px] rotate-[-6deg] hidden sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">Freshness</p>
                    <p className="text-xs font-bold font-serif mt-0.5">Guaranteed 7 Days of Bloom</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Occasions Grid */}
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">
                Shop by Occasion
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Perfectly composed arrangements to convey exactly what you feel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { id: "bouquets", label: "Anniversary", emoji: "💖", desc: "Celebrate love" },
                { id: "single", label: "Birthdays", emoji: "🎂", desc: "Bring smiles" },
                { id: "wedding", label: "Weddings", emoji: "👰", desc: "Luxurious events" },
                { id: "indoor", label: "Housewarming", emoji: "🏡", desc: "Green plants" },
                { id: "sympathy", label: "Sympathy", emoji: "🕊️", desc: "Express peace" },
              ].map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => handleShopNow(occ.id as any)}
                  className="group rounded-2xl border border-border bg-white p-5 text-center shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-300"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform duration-300">{occ.emoji}</span>
                  <h3 className="text-xs font-bold text-foreground mt-3 font-serif">{occ.label}</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{occ.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Featured Showcase */}
          <section className="bg-stone-50 border-y border-border py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div className="text-center sm:text-left">
                  <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-[10px] font-bold tracking-wider uppercase">
                    Florist Favourites
                  </span>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 font-serif">
                    Best-Selling Bouquets
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our most highly rated and frequently requested fresh arrangements.
                  </p>
                </div>

                <button
                  onClick={() => handleShopNow("all")}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-600 transition-colors self-center sm:self-auto"
                >
                  View Full Catalog
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedCategory("all")
                      setActiveTab("catalog")
                      setPreviewProduct(product)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="group rounded-2xl border border-border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-accent text-accent-foreground px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                        Best Seller
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-foreground font-serif group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <span className="text-sm font-bold text-foreground">{formatPrice(product.price)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-500" />
                          <span className="font-bold text-foreground">{product.rating}</span>
                        </div>
                        <span>Free Hand-Written Card</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DIY Builder Promo Section */}
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-border bg-stone-900 text-stone-100 p-8 md:p-12 relative overflow-hidden shadow-xl">
              {/* Background Accent */}
              <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
                <div className="space-y-5 text-center md:text-left">
                  <span className="rounded-full bg-primary/20 text-primary-300 border border-primary-800 px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase">
                    Interactive DIY Studio
                  </span>
                  <h2 className="text-3xl font-bold font-serif md:text-4xl text-white leading-tight">
                    Hand-Tie Your Own Perfect Custom Bouquet
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300 max-w-md leading-relaxed mx-auto md:mx-0">
                    Unleash your inner florist! Choose from dozens of fresh individual stems (Roses, Peonies, Eucalyptus, Lilies), select a premium wrapping paper, and watch your creation stack dynamically in real-time. We will hand-tie it exactly as you design!
                  </p>
                  <button
                    onClick={handleOpenBuilder}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-600 text-white px-8 py-3.5 text-xs font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Open DIY Bouquet Studio
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex justify-center">
                  <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-4 w-full max-w-[320px] shadow-2xl relative">
                    <span className="absolute -right-3 -top-3 bg-accent text-accent-foreground rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold animate-bounce shadow-md">
                      ✨
                    </span>
                    <h4 className="text-xs font-bold text-stone-200 border-b border-stone-700 pb-2 mb-3 font-serif">Recipe Checklist</h4>
                    <ul className="space-y-2 text-xs text-stone-300">
                      <li className="flex items-center gap-2">
                        <span className="text-stone-500">✓</span> 8x Crimson Red Roses
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-stone-500">✓</span> 4x Coral Peonies
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-stone-500">✓</span> 6x Eucalyptus Foliage
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-stone-500">✓</span> Rustic Kraft Wrapping
                      </li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-stone-700 flex justify-between items-center text-xs font-bold text-white">
                      <span>DIY Price:</span>
                      <span className="text-primary-400">$61.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="bg-stone-50 py-16 border-t border-border">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-xl mx-auto mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                  What Our Flower Lovers Say
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Read verified feedback from customers who received our fresh blooms.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {[
                  {
                    name: "Genevieve L.",
                    text: "Absolutely gorgeous! The peonies arrived in secure bud stages and opened up beautifully over 3 days. They lasted a full 12 days in my living room!",
                    stars: 5,
                    title: "Stunning Quality"
                  },
                  {
                    name: "Arthur M.",
                    text: "The DIY Bouquet Studio is the coolest thing ever. I created a custom rose and eucalyptus mix for my mother's birthday. She was blown away by the recipe card!",
                    stars: 5,
                    title: "Fantastic Builder"
                  },
                  {
                    name: "Sophia K.",
                    text: "Unbelievable service. I ordered at 10 AM, and the bouquet was hand-delivered to my best friend's office by 2 PM. Fresh, cold, and beautiful.",
                    stars: 5,
                    title: "Incredible Delivery"
                  }
                ].map((test, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-0.5 text-amber-500 mb-2">
                        {[...Array(test.stars)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                        ))}
                      </div>
                      <h4 className="text-xs font-bold text-foreground font-serif mb-1">{test.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">&ldquo;{test.text}&rdquo;</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-secondary tracking-wider mt-4 block">{test.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "catalog" && <ProductCatalog />}
      {activeTab === "builder" && <BouquetBuilder />}
      {activeTab === "care" && <CareGuide />}
      {activeTab === "tracker" && <OrderTracker />}
    </div>
  )
}
