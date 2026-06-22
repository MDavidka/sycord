"use client"

import { useState, useMemo } from "react"
import { useFlowerShopStore, Product, WRAP_OPTIONS } from "@/lib/store"
import { formatPrice } from "@/lib/utils"
import { Search, SlidersHorizontal, Star, ShoppingBag, X, Gift, Check, Info } from "lucide-react"

// Static Product Data
export const PRODUCTS: Product[] = [
  {
    id: "eternal-romance",
    name: "Eternal Romance Bouquet",
    price: 85.00,
    rating: 4.9,
    reviews: 142,
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=600",
    category: "bouquets",
    description: "A breathtaking arrangement of deep crimson velvet roses, blush pink spray roses, and silver-dollar eucalyptus. Hand-tied and wrapped in premium Parisian paper. The ultimate expression of love and passion.",
    features: ["12 premium long-stem crimson roses", "6 blush pink spray roses", "Fresh silver-dollar eucalyptus foliage", "Handcrafted by a master florist", "Includes flower food and water pack"],
    tags: ["Romantic", "Roses", "Anniversary"],
    isBestSeller: true
  },
  {
    id: "blushing-grace",
    name: "Blushing Grace Peonies",
    price: 95.00,
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600",
    category: "bouquets",
    description: "Elegant, cloud-like coral and blush pink peonies styled with white ranunculus and delicate baby's breath. These highly coveted blooms are known for their sweet fragrance and stunning layered petals.",
    features: ["8 premium blush peonies", "6 white ranunculus stems", "Delicate baby's breath accents", "Sweet, natural floral fragrance", "Delivered in bud stage for maximum vase life"],
    tags: ["Peony", "Luxury", "Birthday"],
    isNew: true
  },
  {
    id: "sunny-meadows",
    name: "Sunny Meadows Tulip Pot",
    price: 45.00,
    rating: 4.7,
    reviews: 64,
    image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&q=80&w=600",
    category: "single",
    description: "A vibrant arrangement of sun-kissed yellow tulips and crisp white tulips, accented with fresh green foliage. Carefully arranged in a rustic, reusable ceramic planter.",
    features: ["10 vibrant yellow tulips", "10 crisp white tulips", "Fresh green salal leaves", "Reusable rustic white ceramic pot", "Easy-care arrangement"],
    tags: ["Tulips", "Vibrant", "Get Well"],
  },
  {
    id: "starlight-orchids",
    name: "Starlight Phalaenopsis Orchid",
    price: 65.00,
    rating: 4.9,
    reviews: 112,
    image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&q=80&w=600",
    category: "indoor",
    description: "A stunning double-stemmed white Phalaenopsis orchid in a sleek minimalist ceramic pot. Symbolizing beauty, refinement, and strength, this long-lasting plant is an elegant addition to any home or office.",
    features: ["Double-stemmed white Phalaenopsis orchid", "Sleek white minimalist ceramic pot", "Decorated with natural moss and bamboo support", "Blooms last up to 3 months with proper care", "Includes detailed care instructions"],
    tags: ["Orchid", "Minimalist", "Housewarming"],
    isBestSeller: true
  },
  {
    id: "white-symphony",
    name: "White Symphony Lily Bouquet",
    price: 75.00,
    rating: 4.6,
    reviews: 53,
    image: "https://images.unsplash.com/photo-1508784932211-488ccaf24aa3?auto=format&fit=crop&q=80&w=600",
    category: "sympathy",
    description: "A serene and respectful arrangement of majestic white Oriental lilies, white snapdragons, and cream carnations, nestled in lush leatherleaf fern and salal. Perfect for expressing heartfelt sympathy or bringing peace to a space.",
    features: ["5 large multi-bud white Oriental lilies", "6 white snapdragons", "6 cream carnations", "Lush leatherleaf fern and salal backing", "Arranged carefully to convey peace and comfort"],
    tags: ["Lilies", "Elegant", "Sympathy"],
  },
  {
    id: "wildflower-meadow",
    name: "Bohemian Wildflower Meadow",
    price: 58.00,
    rating: 4.8,
    reviews: 76,
    image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=600",
    category: "bouquets",
    description: "A whimsical, rustic bouquet reminiscent of a sun-drenched field. Featuring blue delphiniums, purple lavender, chamomile daisies, and orange cosmos, hand-tied with a natural burlap ribbon.",
    features: ["Blue delphinium spires", "Aromatic English lavender stems", "Chamomile daisies and orange cosmos", "Fresh silver dollar eucalyptus", "Hand-tied with authentic rustic burlap ribbon"],
    tags: ["Wildflowers", "Rustic", "Just Because"],
  },
  {
    id: "monarch-velvet",
    name: "Monarch Velvet Rose Box",
    price: 120.00,
    rating: 5.0,
    reviews: 38,
    image: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&q=80&w=600",
    category: "single",
    description: "An ultra-luxurious, dense arrangement of 24 premium, perfectly uniform red roses. Nestled in our signature black velvet keepsake gift box, embossed with gold lettering.",
    features: ["24 premium Grade-A red roses", "Signature black velvet keepsake box", "Dense, dome-style florist arrangement", "No vase required - roses are placed in hydrating floral foam", "Gold-embossed satin ribbon hanger"],
    tags: ["Luxury", "Roses", "Anniversary"],
    isNew: true
  },
  {
    id: "fiddle-leaf",
    name: "Fiddle Leaf Fig Tree",
    price: 110.00,
    rating: 4.5,
    reviews: 42,
    image: "https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&q=80&w=600",
    category: "indoor",
    description: "The ultimate statement plant. Features large, glossy, violin-shaped leaves on an upright woody trunk. Potted in an eco-friendly fiberstone planter that blends perfectly into modern interiors.",
    features: ["Healthy, well-rooted Fiddle Leaf Fig (approx. 3.5ft tall)", "Modern eco-friendly grey fiberstone planter", "Glossy, high-quality, large leaves", "Air-purifying properties", "Packaged securely for safe shipping"],
    tags: ["Indoor Tree", "Statement", "Air Purifying"],
  }
]

export default function ProductCatalog() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    addToCart,
    previewProduct,
    setPreviewProduct
  } = useFlowerShopStore()

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Customization state for detail modal
  const [selectedSize, setSelectedSize] = useState<"Standard" | "Deluxe (+ $15)" | "Grand Luxe (+ $35)">("Standard")
  const [selectedWrap, setSelectedWrap] = useState<string>("kraft")
  const [cardMessage, setCardMessage] = useState<string>("")

  const categories = [
    { id: "all", label: "All Flowers" },
    { id: "bouquets", label: "Signature Bouquets" },
    { id: "single", label: "Single Stems" },
    { id: "indoor", label: "Indoor Plants" },
    { id: "wedding", label: "Wedding & Events" },
    { id: "sympathy", label: "Sympathy" },
  ]

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
      
      return matchesSearch && matchesCategory && matchesPrice
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price
      if (sortBy === "price-high") return b.price - a.price
      if (sortBy === "newest") return b.isNew ? 1 : -1
      return b.rating - a.rating // popular
    })
  }, [searchQuery, selectedCategory, priceRange, sortBy])

  const openPreview = (product: Product) => {
    setPreviewProduct(product)
    setSelectedSize("Standard")
    setSelectedWrap("kraft")
    setCardMessage("")
  }

  const handleAddToCart = (product: Product) => {
    const wrapObj = WRAP_OPTIONS.find(w => w.id === selectedWrap) || WRAP_OPTIONS[0]
    
    addToCart({
      id: `${product.id}-${Date.now()}`, // unique cart item id
      name: product.name,
      price: product.price + wrapObj.price,
      image: product.image,
      category: product.category,
      options: {
        size: selectedSize,
        wrap: wrapObj.name,
        cardMessage: cardMessage.trim() || undefined
      }
    })
    setPreviewProduct(null)
  }

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      price: product.price + WRAP_OPTIONS[0].price, // Kraft wrap by default
      image: product.image,
      category: product.category,
      options: {
        size: "Standard",
        wrap: WRAP_OPTIONS[0].name,
      }
    })
  }

  const activeWrapObj = WRAP_OPTIONS.find(w => w.id === selectedWrap) || WRAP_OPTIONS[0]
  const currentPrice = useMemo(() => {
    if (!previewProduct) return 0
    let price = previewProduct.price + activeWrapObj.price
    if (selectedSize === "Deluxe (+ $15)") price += 15
    if (selectedSize === "Grand Luxe (+ $35)") price += 35
    return price
  }, [previewProduct, selectedSize, activeWrapObj])

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">
            Our Floral Catalog
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Handcrafted luxury arrangements for every occasion.
          </p>
        </div>

        {/* Search and Filter trigger */}
        <div className="flex items-center gap-2 w-full md:w-auto max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search roses, lilies, orchids..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-border bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Category Tabs & Sorting (Desktop) */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-stone-200 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest Blooms</option>
          </select>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="rounded-xl border border-border bg-muted p-4 mt-4 space-y-4 md:hidden animate-in slide-in-from-top duration-200">
          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Price Limit</h4>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="15"
                max="250"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-primary"
              />
              <span className="text-xs font-semibold whitespace-nowrap">Up to {formatPrice(priceRange[1])}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <button
              onClick={() => setPriceRange([15, 250])}
              className="text-xs text-primary font-medium"
            >
              Reset Price
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="rounded-full bg-foreground text-background px-4 py-1 text-xs font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="mt-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-white">
            <span className="text-4xl">🥀</span>
            <h3 className="text-lg font-semibold mt-3">No Blooms Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              We couldn&apos;t find any flowers matching your filter. Try adjusting your search query or price range.
            </p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
                setPriceRange([15, 250])
              }}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => openPreview(product)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Badges */}
                  <div className="absolute left-3 top-3 flex flex-col gap-1">
                    {product.isBestSeller && (
                      <span className="rounded-full bg-accent text-accent-foreground px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                        Best Seller
                      </span>
                    )}
                    {product.isNew && (
                      <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                        New
                      </span>
                    )}
                  </div>

                  {/* Quick Add Overlay Button */}
                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-primary hover:text-white transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                    title="Quick Add to Cart (Standard/Kraft)"
                  >
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      {product.category}
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span className="text-xs font-semibold">{product.rating}</span>
                    </div>
                  </div>

                  <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 font-serif">
                    {product.name}
                  </h3>
                  
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      + Free Gift Card
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail & Customization Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-background shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Close Button */}
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-border text-foreground hover:bg-white hover:text-primary transition-colors shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column: Image & Details */}
              <div className="bg-stone-50 p-6 sm:p-8 flex flex-col justify-between border-r border-border">
                <div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewProduct.image}
                      alt={previewProduct.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mt-4 font-serif">{previewProduct.name}</h3>
                  
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-4 w-4 fill-amber-500" />
                      <span className="font-bold">{previewProduct.rating}</span>
                    </div>
                    <span className="text-muted-foreground">({previewProduct.reviews} verified reviews)</span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    {previewProduct.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">What&apos;s Included:</h4>
                    <ul className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                      {previewProduct.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-lg p-3 text-secondary text-xs">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>Freshness Guarantee: Delivered in bud stage to bloom in 2-3 days.</span>
                </div>
              </div>

              {/* Right Column: Customization Panel */}
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">1. Choose Size</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Standard", "Deluxe (+ $15)", "Grand Luxe (+ $35)"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-lg border p-2.5 text-center text-xs font-medium transition-all ${
                            selectedSize === size
                              ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                              : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {size.split(" (")[0]}
                          <span className="block text-[9px] mt-0.5 opacity-80">
                            {size.includes("(+") ? size.split(" (")[1].replace(")", "") : "Base Price"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">2. Select Wrapping Style</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {WRAP_OPTIONS.map((wrap) => (
                        <button
                          key={wrap.id}
                          onClick={() => setSelectedWrap(wrap.id)}
                          className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                            selectedWrap === wrap.id
                              ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                              : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-stone-400 shrink-0"
                            style={{ backgroundColor: wrap.colorHex }}
                          />
                          <div className="leading-tight">
                            <span>{wrap.name.split(" ")[0]}</span>
                            <span className="block text-[9px] text-muted-foreground mt-0.5">
                              {wrap.price === 0 ? "Free" : `+ ${formatPrice(wrap.price)}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Gift className="h-3.5 w-3.5 text-primary" />
                        3. Custom Greeting Card (Free)
                      </h4>
                      <span className="text-[10px] text-muted-foreground">{cardMessage.length}/120 chars</span>
                    </div>
                    <textarea
                      maxLength={120}
                      rows={2}
                      placeholder="Write a sweet message (e.g., 'Happy Anniversary, my love! - David')"
                      value={cardMessage}
                      onChange={(e) => setCardMessage(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-xs placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />

                    {/* Greeting Card Live Preview */}
                    {cardMessage.trim() && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-center relative overflow-hidden animate-in fade-in duration-300">
                        <span className="absolute -right-2 -top-2 text-2xl opacity-10 rotate-12">💌</span>
                        <p className="font-serif italic text-xs text-amber-900 leading-relaxed max-w-xs mx-auto">
                          &ldquo;{cardMessage}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Price:</span>
                    <h4 className="text-2xl font-bold text-foreground">{formatPrice(currentPrice)}</h4>
                  </div>
                  <button
                    onClick={() => handleAddToCart(previewProduct)}
                    className="flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-600 text-white px-8 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
