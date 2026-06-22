"use client"

import { useMemo } from "react"
import { useFlowerShopStore, STEM_OPTIONS, WRAP_OPTIONS } from "@/lib/store"
import { formatPrice } from "@/lib/utils"
import { Plus, Minus, Flower, Sparkles, ShoppingBag, Trash2, Heart, Gift } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"

export default function BouquetBuilder() {
  const {
    builderStems,
    builderWrap,
    builderCardMessage,
    builderName,
    setBuilderName,
    addBuilderStem,
    removeBuilderStem,
    setBuilderWrap,
    setBuilderCardMessage,
    resetBuilder,
    addToCart
  } = useFlowerShopStore()

  // Calculate stem totals
  const totalStems = useMemo(() => {
    return Object.values(builderStems).reduce((acc, count) => acc + count, 0)
  }, [builderStems])

  // Get active wrap object
  const activeWrapObj = useMemo(() => {
    return WRAP_OPTIONS.find((w) => w.id === builderWrap) || WRAP_OPTIONS[0]
  }, [builderWrap])

  // Calculate total price
  const totalPrice = useMemo(() => {
    const stemsCost = Object.entries(builderStems).reduce((acc, [stemId, count]) => {
      const stem = STEM_OPTIONS.find((s) => s.id === stemId)
      return acc + (stem ? stem.price * count : 0)
    }, 0)
    return stemsCost + activeWrapObj.price
  }, [builderStems, activeWrapObj])

  // Generate a list of all items currently in the visual bouquet for rendering
  const visualStemsList = useMemo(() => {
    const list: { id: string; stemId: string; emoji: string; color: string; index: number }[] = []
    let globalIndex = 0
    Object.entries(builderStems).forEach(([stemId, count]) => {
      const stem = STEM_OPTIONS.find((s) => s.id === stemId)
      if (stem) {
        for (let i = 0; i < count; i++) {
          list.push({
            id: `${stemId}-${i}`,
            stemId,
            emoji: stem.image,
            color: stem.colorHex,
            index: globalIndex++
          })
        }
      }
    })
    return list
  }, [builderStems])

  const handleAddCustomBouquet = () => {
    if (totalStems === 0) return

    // Trigger celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#db4869", "#558a77", "#fb923c", "#f472b6"]
    })

    // Construct stems description for the cart
    const stemsRecipe = Object.entries(builderStems).map(([stemId, count]) => {
      const stem = STEM_OPTIONS.find((s) => s.id === stemId)!
      return {
        name: stem.name,
        count,
        price: stem.price,
        color: stem.color
      }
    })

    addToCart({
      id: `custom-${Date.now()}`,
      name: builderName.trim() || "My Custom Bouquet",
      price: totalPrice,
      image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=400", // beautiful placeholder
      category: "Custom DIY Studio",
      isCustom: true,
      stems: stemsRecipe,
      options: {
        size: "Standard", // standard custom size
        wrap: activeWrapObj.name,
        cardMessage: builderCardMessage.trim() || undefined
      }
    })

    // Reset builder
    resetBuilder()
  }

  // Calculate angle for stems in visual bouquet
  const getStemStyle = (index: number, total: number) => {
    if (total === 1) return { rotate: 0, scale: 1, x: 0, y: 0 }
    
    // Distribute flowers in a fan shape
    const spreadAngle = 60 // total spread in degrees
    const step = spreadAngle / (total - 1 || 1)
    const startAngle = -spreadAngle / 2
    const rotate = startAngle + index * step
    
    // Spiral radius distribution
    const radius = Math.min(60, 20 + Math.floor(index / 5) * 12)
    const rad = (rotate * Math.PI) / 180
    const x = Math.sin(rad) * radius
    const y = -Math.cos(rad) * radius - 15

    return {
      rotate,
      x,
      y,
      scale: 1.1 - (index * 0.005) // slightly scale down outer ones
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border pb-6 text-center md:text-left">
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          DIY Bouquet Studio
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 font-serif">
          Handcraft Your Own Arrangement
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Pick your favorite fresh stems, choose your wrapping style, and add a custom greeting card. We will hand-tie your custom recipe exactly as you design it!
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Visual Canvas (4 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[380px] aspect-[4/5] rounded-2xl border border-border bg-gradient-to-b from-stone-50 to-stone-100/50 p-6 flex flex-col justify-between relative overflow-hidden shadow-inner">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#db4869_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Bouquet Name Badge */}
            <div className="relative z-10 self-center">
              <input
                type="text"
                value={builderName}
                onChange={(e) => setBuilderName(e.target.value)}
                maxLength={25}
                className="bg-transparent border-b border-transparent hover:border-border focus:border-primary text-center font-serif text-lg font-bold text-foreground focus:outline-none px-2 py-0.5"
                placeholder="Name your bouquet..."
              />
            </div>

            {/* Bouquet Visual Composition */}
            <div className="relative flex-1 flex items-center justify-center">
              {/* Wrapping paper layer */}
              <div
                className="absolute bottom-4 w-32 h-36 rounded-b-full opacity-80 blur-[0.5px] transition-all duration-300"
                style={{
                  backgroundColor: activeWrapObj.colorHex,
                  clipPath: "polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)",
                  transform: "translateY(15px)"
                }}
              />

              {/* Ribbon layer */}
              {builderWrap !== "none" && (
                <div className="absolute bottom-12 z-20 flex flex-col items-center">
                  <div className="h-2 w-14 bg-amber-500 rounded-full shadow-sm" />
                  <div className="flex gap-1 -mt-0.5">
                    <div className="h-3 w-3 rounded-full bg-amber-500 rotate-45" />
                    <div className="h-3 w-3 rounded-full bg-amber-500 -rotate-45" />
                  </div>
                </div>
              )}

              {/* Stems Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence>
                  {visualStemsList.map((item) => {
                    const style = getStemStyle(item.index, visualStemsList.length)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -100, scale: 2 }}
                        animate={{
                          opacity: 1,
                          y: style.y,
                          x: style.x,
                          rotate: style.rotate,
                          scale: style.scale
                        }}
                        exit={{ opacity: 0, scale: 0.5, y: 50 }}
                        transition={{ type: "spring", stiffness: 120, damping: 14 }}
                        className="absolute cursor-default select-none text-4xl sm:text-5xl"
                        style={{ originY: "bottom" }}
                      >
                        {item.emoji}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Empty State visual */}
                {totalStems === 0 && (
                  <div className="text-center text-muted-foreground flex flex-col items-center animate-pulse-soft">
                    <Flower className="h-12 w-12 text-stone-300 stroke-[1.5]" />
                    <p className="text-xs font-medium mt-2">Add stems below to begin</p>
                  </div>
                )}
              </div>
            </div>

            {/* Price & Stem Count Summary */}
            <div className="relative z-10 flex items-center justify-between border-t border-border pt-4 bg-white/50 backdrop-blur-sm rounded-xl p-3">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Stems</span>
                <p className="text-sm font-bold text-foreground">{totalStems} / 40 stems</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Price</span>
                <p className="text-lg font-bold text-primary">{formatPrice(totalPrice)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Stems (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Select Wrap */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">1</span>
              Choose Wrapper Style
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {WRAP_OPTIONS.map((wrap) => (
                <button
                  key={wrap.id}
                  onClick={() => setBuilderWrap(wrap.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-medium transition-all ${
                    builderWrap === wrap.id
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-stone-400 shrink-0"
                    style={{ backgroundColor: wrap.colorHex }}
                  />
                  <div className="leading-tight">
                    <p className="font-semibold">{wrap.name.split(" ")[0]}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {wrap.price === 0 ? "Free" : `+ ${formatPrice(wrap.price)}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Add Stems */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">2</span>
                Select Flowers & Foliage
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
                {totalStems} / 40 stems max
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {STEM_OPTIONS.map((stem) => {
                const count = builderStems[stem.id] || 0
                return (
                  <div
                    key={stem.id}
                    className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-stone-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl bg-stone-100 h-11 w-11 rounded-xl flex items-center justify-center shadow-inner">
                        {stem.image}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{stem.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {stem.color} • {formatPrice(stem.price)} / stem
                        </p>
                      </div>
                    </div>

                    {/* Counter */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeBuilderStem(stem.id)}
                        disabled={count === 0}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                          count > 0
                            ? "border-border text-foreground hover:bg-muted"
                            : "border-stone-200 text-stone-300 cursor-not-allowed"
                        }`}
                        aria-label={`Remove ${stem.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{count}</span>
                      <button
                        onClick={() => addBuilderStem(stem.id)}
                        disabled={totalStems >= 40}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                          totalStems < 40
                            ? "border-border text-foreground hover:bg-muted hover:text-primary"
                            : "border-stone-200 text-stone-300 cursor-not-allowed"
                        }`}
                        aria-label={`Add ${stem.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 3: Card Message & Save */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">3</span>
                  Greeting Card Message (Free)
                </h3>
                <span className="text-[10px] text-muted-foreground">{builderCardMessage.length}/120 chars</span>
              </div>
              <textarea
                maxLength={120}
                rows={2}
                placeholder="Add a greeting card message to your custom creation..."
                value={builderCardMessage}
                onChange={(e) => setBuilderCardMessage(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border gap-4">
              <button
                onClick={resetBuilder}
                disabled={totalStems === 0 && builderWrap === "kraft" && builderCardMessage === ""}
                className="flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2.5 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Builder
              </button>

              <button
                onClick={handleAddCustomBouquet}
                disabled={totalStems === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-600 disabled:bg-stone-200 text-white py-3 text-xs font-bold shadow-md hover:shadow-lg disabled:shadow-none disabled:cursor-not-allowed transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                Add Custom Bouquet to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
