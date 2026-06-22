"use client"

import { useState, useMemo } from "react"
import { Search, Heart, BookOpen, AlertTriangle, Droplet, Scissors, ThermometerSun, RefreshCw } from "lucide-react"

interface CareTip {
  id: string
  name: string
  emoji: string
  difficulty: "Easy" | "Medium" | "Advanced"
  watering: string
  trimming: string
  placement: string
  extra: string
}

const SPECIAL_CARE_TIPS: CareTip[] = [
  {
    id: "roses",
    name: "Artisan Roses",
    emoji: "🌹",
    difficulty: "Easy",
    watering: "Change water every 2 days. Fill the vase up to 2/3 with clean, lukewarm water mixed with flower food.",
    trimming: "Re-cut stems at a 45-degree angle every 2-3 days using sharp shears. Remove any leaves that sit below the water line.",
    placement: "Keep in a cool, draft-free room away from direct sunlight and ripening fruit (which emits ethylene gas).",
    extra: "If a rose head begins to droop, submerge the entire stem in warm water for 30 minutes to rehydrate the capillaries."
  },
  {
    id: "peonies",
    name: "Luxury Peonies",
    emoji: "🌸",
    difficulty: "Medium",
    watering: "Peonies are heavy drinkers! Check the water level daily and keep the vase filled with fresh, cool water.",
    trimming: "Cut stems at a sharp angle. If they are in tight buds, gently massage the petals or use warm water to encourage blooming.",
    placement: "Thrive in cool environments. To slow down their bloom, place them in a cool dark room overnight.",
    extra: "Peonies secrete a sticky sap. If buds are stuck closed, gently wipe them with a damp, warm cotton pad to help them open."
  },
  {
    id: "lilies",
    name: "Majestic Lilies",
    emoji: "⚜️",
    difficulty: "Easy",
    watering: "Keep water clean and clear. Lilies prefer deep vases with clean, room-temperature water.",
    trimming: "Trim 1 inch off the bottom of the stems. Crucially, remove the yellow pollen anthers from the center as they open.",
    placement: "Place in indirect light. Keep away from curious pets—lilies are highly toxic to cats.",
    extra: "Removing the pollen anthers prevents staining of petals and tablecloths, and significantly extends the flower's lifespan."
  },
  {
    id: "tulips",
    name: "Vibrant Tulips",
    emoji: "🌷",
    difficulty: "Easy",
    watering: "Tulips prefer ice-cold water! They will continue to grow in height even after being cut.",
    trimming: "Prune stems straight across rather than angled. Pinprick the stem just below the bloom to prevent drooping.",
    placement: "Keep away from heat. Tulips are phototropic—they bend toward light sources, so rotate the vase daily.",
    extra: "Never mix tulips in a vase with fresh daffodils, as daffodils secrete an acidic sap that is toxic to other flowers."
  },
  {
    id: "orchids",
    name: "Elegant Orchids",
    emoji: "🪻",
    difficulty: "Advanced",
    watering: "Water sparingly. Give them 3 ice cubes once a week, or soak the root bark and let it drain completely.",
    trimming: "Do not cut the main green spikes unless they turn yellow/brown. Prune dead roots with sterile scissors.",
    placement: "Thrive in humid, warm environments with bright, filtered indirect sunlight (like a bathroom windowsill).",
    extra: "Use a special orchid potting mix (bark) rather than soil, and feed with diluted orchid fertilizer once a month."
  },
  {
    id: "hydrangeas",
    name: "Hydrangeas",
    emoji: "🪻",
    difficulty: "Medium",
    watering: "They love water (hence 'hydra'!). Spray their heads gently with a misting bottle daily.",
    trimming: "Cut stems at a 45-degree angle, then make a vertical 1-inch slit up the bottom of the stem to maximize water absorption.",
    placement: "Keep cool and shaded. Direct hot sun will cause instant wilting.",
    extra: "If your hydrangea wilts, submerge the entire flower head in cool water for 1-2 hours. It will absorb water through its petals and fully revive!"
  }
]

export default function CareGuide() {
  const [search, setSearch] = useState("")
  const [selectedTip, setSelectedTip] = useState<CareTip | null>(SPECIAL_CARE_TIPS[0])

  const filteredTips = useMemo(() => {
    return SPECIAL_CARE_TIPS.filter((tip) =>
      tip.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border pb-6 text-center md:text-left">
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          Florist Secrets
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 font-serif">
          Flower Care & Longevity Guide
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Learn how to make your premium hand-tied bouquets and indoor plants bloom beautifully for up to 14 days.
        </p>
      </div>

      {/* Universal Golden Rules */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4 flex gap-3 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">1. Trim Stems</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Cut 1 inch off stems at a 45° angle under running water. This prevents air bubbles from blocking hydration.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 flex gap-3 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Droplet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">2. Clean Water</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Wash the vase thoroughly. Fill with fresh water and stir in the flower food packet. Change water every 2 days.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 flex gap-3 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ThermometerSun className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">3. Cool Spot</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Keep blooms away from direct hot sun, cold drafts, radiators, and ripening fruit (which wilts petals).
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 flex gap-3 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">4. Prune Foliage</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Pinch off any leaves that sit below the water level. Submerged leaves rot, cultivating harmful bacteria.
            </p>
          </div>
        </div>
      </div>

      {/* Ethylene gas warning box */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">The Silent Wilter: Ripening Fruit</p>
          <p className="text-[10px] text-amber-800 mt-0.5 leading-relaxed">
            Keep your fresh flower arrangements far away from fruit bowls! Ripening fruits (especially bananas, apples, and avocados) release invisible ethylene gas, which triggers rapid aging and premature wilting in delicate petals.
          </p>
        </div>
      </div>

      {/* Specialty Species Guides */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Species List (5 cols) */}
        <div className="md:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search flower species..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="space-y-2 max-h-[300px] md:max-h-none overflow-y-auto">
            {filteredTips.map((tip) => (
              <button
                key={tip.id}
                onClick={() => setSelectedTip(tip)}
                className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  selectedTip?.id === tip.id
                    ? "border-primary bg-primary/5 text-primary shadow-xs"
                    : "border-border bg-white text-muted-foreground hover:bg-stone-50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{tip.emoji}</span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{tip.name}</h4>
                    <span className="text-[9px] text-muted-foreground">Difficulty: {tip.difficulty}</span>
                  </div>
                </div>
                {selectedTip?.id === tip.id && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            ))}
            {filteredTips.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No matching flower guides found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Species Detail Card (8 cols) */}
        <div className="md:col-span-8">
          {selectedTip ? (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl bg-stone-50 h-14 w-14 rounded-xl flex items-center justify-center shadow-inner border border-border">
                    {selectedTip.emoji}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-foreground font-serif">{selectedTip.name} Care</h3>
                    <span className="inline-block rounded-full bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 mt-1">
                      {selectedTip.difficulty} Care Level
                    </span>
                  </div>
                </div>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="h-4 w-4" />
                  Save Guide
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px] text-secondary flex items-center gap-1">
                    <Droplet className="h-3.5 w-3.5" />
                    Hydration & Water
                  </h4>
                  <p className="text-muted-foreground">{selectedTip.watering}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px] text-secondary flex items-center gap-1">
                    <Scissors className="h-3.5 w-3.5" />
                    Trimming & Pruning
                  </h4>
                  <p className="text-muted-foreground">{selectedTip.trimming}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px] text-secondary flex items-center gap-1">
                    <ThermometerSun className="h-3.5 w-3.5" />
                    Temperature & Placement
                  </h4>
                  <p className="text-muted-foreground">{selectedTip.placement}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px] text-secondary flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    Florist Pro-Tip
                  </h4>
                  <p className="text-muted-foreground italic bg-stone-50 rounded-lg p-2.5 border border-stone-100">
                    &ldquo;{selectedTip.extra}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-stone-50 p-8 text-center h-full flex flex-col items-center justify-center">
              <BookOpen className="h-10 w-10 text-stone-300 stroke-[1.5]" />
              <p className="text-xs text-muted-foreground mt-2">Select a flower species from the left list to view detailed tips.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
