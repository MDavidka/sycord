"use client"

import { useState } from "react"
import { Search, Flower, Scissors, Droplets, ThermometerSun, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface GuideSpecies {
  id: string
  name: string
  emoji: string
  lifespan: string
  water: string
  temp: string
  danger?: string
  proTip: string
  instructions: string[]
}

const SPECIES_GUIDES: GuideSpecies[] = [
  {
    id: "roses",
    name: "Roses (Signature & Spray)",
    emoji: "🌹",
    lifespan: "7 - 10 Days",
    water: "Lukewarm water, filled 3/4 high",
    temp: "Cool room, away from drafts & direct sun",
    proTip: "If a rose head droops, re-cut the stem under warm water and submerge it deep. This clears air locks in the stem.",
    instructions: [
      "Cut stems at a 45-degree angle under water to prevent air bubbles from entering.",
      "Remove any leaves that fall below the water line to prevent bacterial growth.",
      "Gently peel away the 2-3 outer 'guard petals' if they look bruised; they are meant to protect the bud.",
      "Change water every 2 days and add fresh flower food."
    ]
  },
  {
    id: "peonies",
    name: "Peonies",
    emoji: "🌺",
    lifespan: "5 - 7 Days",
    water: "Cold water, filled 1/2 high",
    temp: "Very cool spot; they open rapidly in warmth",
    proTip: "To speed up opening, gently massage the closed bud under warm running water to dissolve the natural sticky sap.",
    instructions: [
      "Peonies are heavy drinkers; check the water level daily as they can empty a vase quickly.",
      "Keep them in a cool dark room overnight to prolong their short blooming window.",
      "Cut stems short; shorter stems allow water to reach the heavy bloom faster."
    ]
  },
  {
    id: "lilies",
    name: "Oriental & Asiatic Lilies",
    emoji: "⚜️",
    lifespan: "10 - 14 Days",
    water: "Room temperature water, filled 1/2 high",
    temp: "Standard room temperature",
    danger: "TOXIC TO CATS: All parts of lilies, including pollen and vase water, are extremely poisonous to felines.",
    proTip: "Gently pinch off the orange-brown pollen anthers as soon as the buds open. This prevents staining of the petals and your clothes.",
    instructions: [
      "Remove pollen anthers immediately using a tissue (do not touch with bare fingers as it stains).",
      "Lilies open sequentially. Snipping off older, wilted blooms keeps the arrangement looking fresh.",
      "Keep away from ripening fruit; fruits emit ethylene gas which causes lily buds to drop."
    ]
  },
  {
    id: "tulips",
    name: "Tulips",
    emoji: "🌷",
    lifespan: "5 - 7 Days",
    water: "Ice-cold water, filled 1/3 high (shallow)",
    temp: "Very cool room; avoid any heat sources",
    proTip: "Tulips continue growing after being cut! They also phototrope, bending toward light. Rotate the vase daily to keep them upright.",
    instructions: [
      "Use very cold water; adding a few ice cubes to the vase daily will keep them crisp.",
      "Tulips prefer shallow water; deep water can cause the stems to get soggy and rot.",
      "Prick a tiny hole with a pin just below the flower head to prevent air locks and drooping."
    ]
  },
  {
    id: "orchids",
    name: "Phalaenopsis Orchids",
    emoji: "🪻",
    lifespan: "1 - 3 Months (Potted)",
    water: "1-2 ice cubes once a week, or soak and drain",
    temp: "Warm, humid room (65°F - 85°F)",
    proTip: "Never let standing water sit in the crown of the orchid leaves, as this causes crown rot which kills the plant.",
    instructions: [
      "Place in bright, indirect sunlight. Avoid direct scorching sun which burns the leaves.",
      "Water only when the potting bark feels completely dry and the roots look silvery-grey.",
      "If roots are bright green, they have plenty of water. If they are grey, they are thirsty."
    ]
  },
  {
    id: "hydrangeas",
    name: "Hydrangeas",
    emoji: "🌐",
    lifespan: "5 - 9 Days",
    water: "Warm water, filled 3/4 high (very thirsty)",
    temp: "Cool room, high humidity",
    proTip: "Hydrangeas can drink water through their petals! If they wilt, submerge the entire flower head in cool water for 30 minutes to revive them.",
    instructions: [
      "Hydrangea stems produce a sticky sap that blocks water intake. Dip the cut stem end in hot water or alum powder before placing in vase.",
      "Cut stems with a long, vertical slit up the center to increase the water-drinking surface area.",
      "Mist the flower heads daily with water to keep them hydrated."
    ]
  }
]

export default function CareGuide() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>("roses")

  const filteredGuides = SPECIES_GUIDES.filter((guide) =>
    guide.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.instructions.some((inst) => inst.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border pb-6 text-center md:text-left">
        <span className="rounded-full bg-secondary/10 text-secondary px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          Flower Care Center
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 font-serif">
          Make Your Blooms Last Longer
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Did you know proper care can double the lifespan of your fresh flowers? Read our essential florist tips and specific care guides for different species.
        </p>
      </div>

      {/* The Golden Rules Banner */}
      <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground font-serif mb-4 flex items-center gap-2">
          <span className="text-xl">✨</span>
          The Five Golden Rules of Flower Care
        </h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-stone-50 border border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <Flower className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-foreground mb-1">1. Clean Vase</h4>
            <p className="text-muted-foreground">Wash your vase with soap and warm water to eliminate bacteria before filling.</p>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-stone-50 border border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <Scissors className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-foreground mb-1">2. 45° Angle Trim</h4>
            <p className="text-muted-foreground">Trim 1 inch off stems at a 45-degree angle. This keeps stems from sitting flat on the vase bottom.</p>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-stone-50 border border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <Droplets className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-foreground mb-1">3. Strip Lower Leaves</h4>
            <p className="text-muted-foreground">Remove all leaves that sit below the water level. Submerged leaves rot and breed bacteria.</p>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-stone-50 border border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <RefreshCw className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-foreground mb-1">4. Refresh Water</h4>
            <p className="text-muted-foreground">Change water completely every 2 days. Flowers prefer fresh, cool, clean drinking water.</p>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-stone-50 border border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <ThermometerSun className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-foreground mb-1">5. Avoid Heat</h4>
            <p className="text-muted-foreground">Keep flowers away from direct sun, drafts, radiators, and ripening fruit bowls.</p>
          </div>
        </div>
      </div>

      {/* Specific Species Guides */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Search and Accordion (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <h3 className="text-md font-bold text-foreground font-serif">Species-Specific Care Guidelines</h3>
            
            {/* Quick Search */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search species (e.g. rose, lily)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border pl-8 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {filteredGuides.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-white">
              <p className="text-sm text-muted-foreground">No specific care guide found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGuides.map((guide) => {
                const isExpanded = expandedId === guide.id
                return (
                  <div
                    key={guide.id}
                    className="rounded-xl border border-border bg-white overflow-hidden shadow-xs transition-all"
                  >
                    {/* Accordion Trigger */}
                    <button
                      onClick={() => toggleExpand(guide.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center shadow-inner">
                          {guide.emoji}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{guide.name}</h4>
                          <span className="text-[10px] text-muted-foreground">Average Lifespan: {guide.lifespan}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {isExpanded ? "Hide Details" : "View Details"}
                      </span>
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="border-t border-border p-5 bg-stone-50/50 space-y-4 animate-in slide-in-from-top-4 duration-200">
                        {/* Vital Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="flex items-center gap-2 bg-white rounded-lg border border-border p-2.5">
                            <Droplets className="h-4.5 w-4.5 text-secondary shrink-0" />
                            <div>
                              <p className="font-bold text-foreground">Water Requirements</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{guide.water}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-white rounded-lg border border-border p-2.5">
                            <ThermometerSun className="h-4.5 w-4.5 text-secondary shrink-0" />
                            <div>
                              <p className="font-bold text-foreground">Temperature & Environment</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{guide.temp}</p>
                            </div>
                          </div>
                        </div>

                        {/* Pet Danger Warning */}
                        {guide.danger && (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-red-700 text-xs font-medium">
                            <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                            <span>{guide.danger}</span>
                          </div>
                        )}

                        {/* Care Instructions List */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Step-by-Step Care:</h5>
                          <ul className="space-y-2 text-xs text-muted-foreground">
                            {guide.instructions.map((inst, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{inst}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Pro Tip */}
                        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 flex items-start gap-2.5 text-amber-900 text-xs">
                          <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-800">Florist Pro-Tip: </span>
                            <span className="italic leading-relaxed">{guide.proTip}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: General Care Tips & FAQ (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Flower Food FAQ */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Understanding Flower Food
            </h3>
            
            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div>
                <h4 className="font-bold text-foreground">What is inside the flower food packet?</h4>
                <p className="mt-1">
                  Our custom flower food contains three essential ingredients: **Bactericides** (to kill vase bacteria), **Acidifiers** (to balance water pH so it travels up stems faster), and **Sucrose** (carbohydrate sugar to nourish the cells).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-foreground">Can I make DIY flower food?</h4>
                <p className="mt-1">
                  Yes! If you run out of packets, mix:
                  <span className="block font-semibold text-foreground mt-1">• 1 quart of warm water</span>
                  <span className="block font-semibold text-foreground">• 2 tablespoons fresh lemon juice</span>
                  <span className="block font-semibold text-foreground">• 1 tablespoon sugar</span>
                  <span className="block font-semibold text-foreground">• 1/4 teaspoon household bleach (kills bacteria)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Water Temperature Guide */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Water Temperature Guide
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3">
                <span className="text-xl shrink-0">❄️</span>
                <div>
                  <h4 className="font-bold text-foreground">Ice Cold Water</h4>
                  <p className="text-muted-foreground mt-0.5">Best for **Tulips, Daffodils, Hyacinths, and Peonies**. Cold water slows down their rapid opening rate.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-xl shrink-0">🌡️</span>
                <div>
                  <h4 className="font-bold text-foreground">Lukewarm Water (Room Temp)</h4>
                  <p className="text-muted-foreground mt-0.5">Best for **most flowers** (Roses, Lilies, Carnations). Warm water is absorbed much faster than cold water.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-xl shrink-0">🔥</span>
                <div>
                  <h4 className="font-bold text-foreground">Hot Water (Not Boiling)</h4>
                  <p className="text-muted-foreground mt-0.5">Use on woody stems like **Hydrangeas or Lilacs** for 30 seconds to clear clogged sap before transferring to warm water.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
