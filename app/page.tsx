"use client"

import { useFlowerShopStore } from "@/lib/store"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ProductCatalog, { PRODUCTS } from "@/components/ProductCatalog"
import BouquetBuilder from "@/components/BouquetBuilder"
import CartDrawer from "@/components/CartDrawer"
import OrderTracker from "@/components/OrderTracker"
import CareGuide from "@/components/CareGuide"
import { ArrowRight, Sparkles, Flower, Heart, Star, ShieldCheck, Clock, Quote } from "lucide-react"

export default function Home() {
  const { activeTab, setActiveTab, setPreviewProduct } = useFlowerShopStore()

  const featuredBouquets = PRODUCTS.filter((p: any) => p.isBestSeller).slice(0, 3)

  const handleOpenFeatured = (product: typeof PRODUCTS[0]) => {
    setActiveTab("catalog")
    setTimeout(() => {
      setPreviewProduct(product)
    }, 100)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === "home" && (
          <div className="animate-in fade-in duration-300">
            {/* Hero Section */}
            <section className="relative bg-stone-900 text-white overflow-hidden py-24 sm:py-32">
              {/* Background Image Overlay */}
              <div className="absolute inset-0 z-0 opacity-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1600"
                  alt="Premium Flower Shop Background"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              
              {/* Gradient mask */}
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-stone-950 via-stone-900/80 to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary-foreground mb-4">
                    <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                    Valentine&apos;s & Spring Collections Now Live
                  </div>
                  
                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl font-serif text-stone-100 leading-tight">
                    Artisanal Floral Stories <br />
                    <span className="text-primary">Delivered Fresh</span>
                  </h1>
                  
                  <p className="mt-6 text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
                    We hand-select premium blooms from sustainable farms to compose breathtaking bouquets that express your deepest emotions. Hand-wrapped and delivered in temperature-controlled vans.
                  </p>
                  
                  <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                    <button
                      onClick={() => setActiveTab("catalog")}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-full bg-primary hover:bg-primary-600 text-white px-8 py-3.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      Shop Signature Bouquets
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab("builder")}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-full border border-stone-400 bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 text-sm font-semibold backdrop-blur-xs transition-all"
                    >
                      DIY Bouquet Studio
                      <Flower className="h-4 w-4 text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Features / Trust Badges */}
            <section className="bg-white border-b border-border py-8">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
                  <div className="flex flex-col items-center p-2">
                    <ShieldCheck className="h-6 w-6 text-secondary mb-2" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">7-Day Freshness</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Sourced from farms, guaranteed to last</p>
                  </div>
                  <div className="flex flex-col items-center p-2 border-l border-border">
                    <Clock className="h-6 w-6 text-secondary mb-2" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Same-Day Delivery</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Order by 12 PM for instant delivery</p>
                  </div>
                  <div className="flex flex-col items-center p-2 border-l border-border">
                    <Flower className="h-6 w-6 text-secondary mb-2" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Artisan Arranged</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Handcrafted by certified florists</p>
                  </div>
                  <div className="flex flex-col items-center p-2 border-l border-border">
                    <Heart className="h-6 w-6 text-secondary mb-2" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Free Greeting Card</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Custom printed note on heavy cardstock</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Best Sellers */}
            <section className="py-16 sm:py-24 bg-stone-50/50">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-xl mx-auto">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Curated Collections</span>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif mt-2">
                    Best-Selling Signature Bouquets
                  </h2>
                  <p className="text-xs text-muted-foreground mt-2">
                    Hand-tied and designed for moments that matter. Click to customize size, wrap, and gift card message.
                  </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredBouquets.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleOpenFeatured(product)}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-stone-100 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-accent text-accent-foreground px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                          Best Seller
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                            {product.category}
                          </span>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
                            <span className="text-xs font-bold">{product.rating}</span>
                          </div>
                        </div>

                        <h3 className="mt-2 text-base font-bold text-foreground group-hover:text-primary transition-colors font-serif">
                          {product.name}
                        </h3>
                        
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>

                        <div className="mt-auto pt-5 flex items-center justify-between border-t border-stone-100">
                          <span className="text-base font-bold text-foreground">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-xs font-bold text-primary flex items-center gap-1">
                            Customize & Order
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white hover:bg-stone-50 px-6 py-3 text-xs font-bold text-foreground shadow-sm transition-colors"
                  >
                    View Entire Floral Catalog
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </button>
                </div>
              </div>
            </section>

            {/* DIY Studio Promo banner */}
            <section className="relative bg-stone-900 text-white overflow-hidden py-20 sm:py-24">
              <div className="absolute inset-0 z-0 opacity-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=1200"
                  alt="Flower arranging stems"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                <div className="max-w-2xl mx-auto">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">DIY Bouquet Studio</span>
                  <h2 className="text-3xl font-bold tracking-tight text-stone-100 font-serif mt-2 sm:text-4xl">
                    Design Your Own Custom Bouquet
                  </h2>
                  <p className="mt-4 text-xs sm:text-sm text-stone-300 leading-relaxed">
                    Unleash your inner florist! Pick each individual flower stem (roses, peonies, tulips, lavender), select your wrapping paper, and watch your bouquet build dynamically on-screen. We will hand-tie your recipe exactly as designed.
                  </p>
                  <div className="mt-8">
                    <button
                      onClick={() => setActiveTab("builder")}
                      className="rounded-full bg-primary hover:bg-primary-600 text-white px-8 py-3.5 text-xs font-bold shadow-lg transition-all"
                    >
                      Enter DIY Studio Studio
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Flower Care Tip of the Day & Testimonials */}
            <section className="py-16 sm:py-24 bg-white">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left: Flower Care Tip (5 cols) */}
                  <div className="lg:col-span-5 bg-muted rounded-2xl border border-border p-6 sm:p-8 flex flex-col justify-between shadow-inner">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-secondary">Florist Tip of the Day</span>
                      <h3 className="text-xl font-bold text-foreground font-serif mt-2">
                        How to Revive Wilted Hydrangeas
                      </h3>
                      <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                        Hydrangeas are highly unique: they can drink water directly through their flower petals! If your hydrangea head starts drooping, do not discard it. 
                      </p>
                      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                        Simply submerge the entire flower head face-down in a bowl of cool water for 30 to 45 minutes. Remove, gently shake off excess drops, re-cut the stem end, and place back in the vase. It will look brand-new!
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Want more florist secrets?</span>
                      <button
                        onClick={() => setActiveTab("care")}
                        className="text-xs font-bold text-primary flex items-center gap-1"
                      >
                        Read Care Guide
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right: Testimonials (7 cols) */}
                  <div className="lg:col-span-7 space-y-6 flex flex-col justify-center">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">Customer Stories</span>
                      <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif mt-2">
                        What Our Bloom Club Says
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-border bg-stone-50/50 p-5 relative">
                        <Quote className="absolute right-4 top-4 h-6 w-6 text-stone-200" />
                        <div className="flex gap-0.5 text-amber-500 mb-2">
                          {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />)}
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          &ldquo;I ordered a custom bouquet for my mother&apos;s birthday. Being able to choose specific pink peonies and eucalyptus was amazing. It arrived in perfect bud stage and bloomed beautifully!&rdquo;
                        </p>
                        <h4 className="text-xs font-bold text-stone-800 mt-4">— Eleanor R., Boston</h4>
                      </div>

                      <div className="rounded-xl border border-border bg-stone-50/50 p-5 relative">
                        <Quote className="absolute right-4 top-4 h-6 w-6 text-stone-200" />
                        <div className="flex gap-0.5 text-amber-500 mb-2">
                          {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />)}
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          &ldquo;The live order tracking is incredible! I watched my order go from Placed to Arranged, and then saw the live update when the courier left. Fantastic service and gorgeous roses!&rdquo;
                        </p>
                        <h4 className="text-xs font-bold text-stone-800 mt-4">— Marcus K., New York</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "catalog" && <ProductCatalog />}
        {activeTab === "builder" && <BouquetBuilder />}
        {activeTab === "care" && <CareGuide />}
        {activeTab === "tracker" && <OrderTracker />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer Slide-over */}
      <CartDrawer />
    </div>
  )
}
