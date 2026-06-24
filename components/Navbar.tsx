"use client"

import { useState } from "react"
import { useFlowerShopStore } from "@/lib/store"
import { ShoppingBag, Menu, X, Flower, MapPin, Search } from "lucide-react"

export default function Navbar() {
  const { activeTab, setActiveTab, cart, setCartOpen } = useFlowerShopStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "catalog", label: "Shop Bouquets" },
    { id: "builder", label: "DIY Bouquet Studio" },
    { id: "care", label: "Flower Care Guide" },
    { id: "tracker", label: "Track Order" },
  ] as const

  const handleNavClick = (tab: typeof navLinks[number]["id"]) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      {/* Top Banner */}
      <div className="bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground">
        ✨ Fresh flower delivery straight to your doorstep. Order before 12 PM for same-day delivery!
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2 text-left group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:rotate-12">
            <Flower className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl font-serif">
              Petal & Bloom
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-1 hidden sm:block">
              Artisan Florist
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`relative py-2 text-sm font-medium transition-colors hover:text-primary ${
                activeTab === link.id
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
              {activeTab === link.id && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Track Button */}
          <button
            onClick={() => handleNavClick("tracker")}
            className="hidden lg:flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 text-secondary" />
            Track Order
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"
            aria-label="Open Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce-short">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground md:hidden hover:bg-muted transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === link.id
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
                {activeTab === link.id && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
          
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <button
              onClick={() => handleNavClick("tracker")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <MapPin className="h-4 w-4 text-secondary" />
              Track Delivery
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
