"use client"

import { useState } from "react"
import { Search, ChevronDown, ChevronUp, Flower, ShieldCheck, Heart, Sparkles } from "lucide-react"

interface CareTip {
  id: string
  species: string
  emoji: string
  difficulty: "Easy" | "Medium" | "Challenging"
  summary: string
  water: string
  light: string
  temperature: string
  proTip: string
}

const CARE_TIPS: CareTip[] = [
  {
    id: "roses",
    species: "Roses (Cut Bouquets)",
    emoji: "🌹",
    difficulty: "Easy",
    summary: "Cut roses can last up to 10-14 days with proper water hygiene and stem trimming.",
    water: "Change water every 2 days. Use lukewarm water mixed with the provided flower food. Wash the vase thoroughly before refilling to eliminate bacteria.",
    light: "Keep in a cool, draft-free room away from direct sunlight, radiators, or ripening fruit (which releases ethylene gas that ages flowers).",
    temperature: "Cooler temperatures (60-68°F / 15-20°C) prolong rose life significantly.",
    proTip: "Trim stems at a 45-degree angle under water using sharp shears. This prevents air bubbles from blocking the stem's water absorption capillaries."
  },
  {
    id: "lilies",
    species: "Lilies (Oriental & Asiatic)",
    emoji: "⚜️",
    difficulty: "Easy",
    summary: "Lilies are hardy blooms that open sequentially, giving a long-lasting show.",
    water: "Fill the vase halfway with fresh water and flower food. Snip 1 inch off the stems every 3 days.",
    light: "Thrive in bright, indirect light. Direct sunlight can scorch delicate petals.",
    temperature: "Standard indoor room temperature (65-72°F) is perfect.",
    proTip: "Gently snip off the pollen-bearing anthers from the center as soon as each bloom opens. This prevents staining of petals, furniture, and clothes, and extends the bloom's lifespan!"
  },
  {
    id: "orchids",
    species: "Phalaenopsis Orchids (Potted)",
    emoji: "🪻",
    difficulty: "Medium",
    summary: "Potted orchids can bloom for months on end with minimal, precise watering.",
    water: "Water once a week. The 'ice cube trick' (placing 3 ice cubes on the bark) works, but running lukewarm water through the bark for 30 seconds and letting it drain fully is ideal. Never let roots sit in water.",
    light: "Bright, filtered indirect light (e.g., behind a sheer curtain). Yellow leaves indicate too much light; dark green leaves indicate too little.",
    temperature: "65-80°F (18-27°C) during the day, with a slight drop at night.",
    proTip: "Once all blooms fall, do not throw the plant away! Cut the stem just above the second node from the base to encourage a secondary flower spike in a few months."
  },
  {
    id: "tulips",
    species: "Tulips",
    emoji: "🌷",
    difficulty: "Easy",
    summary: "Tulips continue to grow and bend toward the light even after being cut!",
    water: "Keep water levels shallow (2-3 inches) but fresh. Tulips are thirsty but can rot if submerged too deep.",
    light: "Keep in a cool spot away from bright sunlight. They naturally curve toward any ambient light source.",
    temperature: "Keep as cool as possible. Adding an ice cube to the water can revive droopy tulips.",
    proTip: "Tulips are phototropic (bend toward light). If you want them to stand straight, wrap them tightly in damp newspaper for a few hours after cutting before arranging them."
  },
  {
    id: "peonies",
    species: "Peonies",
    emoji: "🌺",
    difficulty: "Medium",
    summary: "Stunning, massive blooms that transition from tight 'golf balls' to fluffy clouds.",
    water: "Peonies are heavy drinkers. Keep vase filled with clean, food-treated water.",
    light: "Moderate indirect light. Warm rooms will cause them to open very rapidly.",
    temperature: "Cool spots extend their short but glorious blooming window.",
    proTip: "If your peonies are stuck in tight buds and you need them to open for an event, gently massage the bud under warm water to dissolve the sticky sap holding the petals together."
  }
]

export default function CareGuide() {
  const [search, setSearch] = useState("")
  const [openId, setOpenId] = useState<string | null>("roses")

  const filteredTips = CARE_TIPS.filter((tip) =>
    tip.species.toLowerCase().includes(search.toLowerCase()) ||
    tip.summary.toLowerCase().includes(search.toLowerCase())
  )

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border pb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">
          Flower Care & Longevity Guide
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
          Learn the secrets of professional florists to keep your fresh cut bouquets and potted plants blooming beautifully for weeks.
        </p>
      </div>

      {/* Quick Search */}
      <div className="mt-6 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search flower species (e.g. Roses, Orchids)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-border bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* General Golden Rules */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col items-center text-center space-y-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h4 className="text-xs font-bold uppercase text-foreground">1. Keep it Clean</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">Bacteria is the #1 enemy of cut flowers. Wash your vase with soap and warm water before arranging.</p>
        </div>
        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 flex flex-col items-center text-center space-y-2">
          <Heart className="h-6 w-6 text-secondary" />
          <h4 className="text-xs font-bold uppercase text-foreground">2. Feed Them</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">Always use the provided flower food. It contains glucose for nourishment and a bactericide to keep water clear.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 flex flex-col items-center text-center space-y-2">
          <Sparkles className="h-6 w-6 text-amber-600" />
          <h4 className="text-xs font-bold uppercase text-foreground">3. Trim & Prune</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">Snip 1 inch off stems at an angle every 2 days, and strip any leaves that sit below the water level to prevent rot.</p>
        </div>
      </div>

      {/* Species Accordion */}
      <div className="mt-8 space-y-3">
        {filteredTips.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white text-muted-foreground text-xs">
            No care guides found matching your search. Try &ldquo;Roses&rdquo; or &ldquo;Lilies&rdquo;.
          </div>
        ) : (
          filteredTips.map((tip) => {
            const isOpen = openId === tip.id
            return (
              <div
                key={tip.id}
                className="rounded-xl border border-border bg-white overflow-hidden shadow-xs transition-all duration-200"
              >
                {/* Accordion Trigger */}
                <button
                  onClick={() => toggleOpen(tip.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tip.emoji}</span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-serif">{tip.species}</h3>
                      <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${
                        tip.difficulty === "Easy"
                          ? "bg-emerald-50 text-emerald-600"
                          : tip.difficulty === "Medium"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                      }`}>
                        Difficulty: {tip.difficulty}
                      </span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="border-t border-border p-4 sm:p-6 bg-stone-50/50 space-y-4 text-xs text-muted-foreground animate-in slide-in-from-top duration-200">
                    <p className="text-foreground font-medium italic border-l-2 border-primary pl-3 py-0.5">
                      &ldquo;{tip.summary}&rdquo;
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground flex items-center gap-1">💧 Water & Hydration</h4>
                        <p className="leading-relaxed text-[11px]">{tip.water}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground flex items-center gap-1">☀️ Light & Placement</h4>
                        <p className="leading-relaxed text-[11px]">{tip.light}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground flex items-center gap-1">🌡️ Temperature</h4>
                        <p className="leading-relaxed text-[11px]">{tip.temperature}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex items-start gap-2.5 text-amber-900 leading-relaxed">
                      <span className="text-lg shrink-0">💡</span>
                      <div>
                        <span className="font-bold text-amber-950">Florist Pro-Tip:</span>
                        <p className="text-[11px] mt-0.5">{tip.proTip}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
