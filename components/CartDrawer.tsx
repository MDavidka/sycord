"use client"

import { useState } from "react"
import { useFlowerShopStore, CartItem, OrderDetails } from "@/lib/store"
import { formatPrice } from "@/lib/utils"
import { X, ShoppingBag, Trash2, Plus, Minus, Calendar, Clock, MapPin, Truck, ChevronRight, HelpCircle } from "lucide-react"

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    clearCart,
    setActiveOrder,
    setActiveTab,
    simulateOrderProgress
  } = useFlowerShopStore()

  // Checkout Form State
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [deliverySlot, setDeliverySlot] = useState("afternoon")
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [step, setStep] = useState<"cart" | "delivery">("cart")

  if (!isCartOpen) return null

  const subtotal = getCartTotal()
  const deliveryFee = subtotal > 100 || subtotal === 0 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + deliveryFee + tax

  const handleQuantityMinus = (item: CartItem) => {
    if (item.quantity === 1) {
      removeFromCart(item.id)
    } else {
      updateQuantity(item.id, item.quantity - 1)
    }
  }

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !address || !phone || !deliveryDate) return

    setIsCheckingOut(true)

    // Simulate payment processing for 1.5 seconds
    setTimeout(() => {
      const orderId = `PB-${Math.floor(100000 + Math.random() * 900000)}`
      
      const orderDetails: OrderDetails = {
        orderId,
        status: "ordered",
        progress: 10,
        recipient: {
          name,
          address,
          phone,
          deliveryDate,
          deliverySlot: deliverySlot === "morning" ? "Morning (8 AM - 12 PM)" : deliverySlot === "afternoon" ? "Afternoon (12 PM - 5 PM)" : "Evening (5 PM - 9 PM)"
        },
        items: [...cart],
        subtotal,
        deliveryFee,
        tax,
        total,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setActiveOrder(orderDetails)
      simulateOrderProgress() // Start delivery progress simulation
      
      // Reset form and cart
      clearCart()
      setStep("cart")
      setName("")
      setAddress("")
      setPhone("")
      setDeliveryDate("")
      setIsCheckingOut(false)
      setCartOpen(false)
      
      // Redirect to tracker tab
      setActiveTab("tracker")
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-background shadow-2xl transition-all duration-300 flex flex-col h-full border-l border-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground font-serif">
                {step === "cart" ? "Your Shopping Cart" : "Delivery Details"}
              </h2>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Contents */}
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50/50">
              <span className="text-5xl animate-bounce">🛒</span>
              <h3 className="text-base font-bold text-foreground mt-4">Your Cart is Empty</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                Add some of our beautiful signature bouquets or handcraft your own custom arrangement in the DIY Studio!
              </p>
              <button
                onClick={() => {
                  setCartOpen(false)
                  setActiveTab("catalog")
                }}
                className="mt-5 rounded-full bg-primary hover:bg-primary-600 px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <>
              {step === "cart" ? (
                /* STEP 1: Cart Items List */
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-xl border border-border bg-white p-3 shadow-xs hover:border-stone-300 transition-all"
                    >
                      {/* Item Image */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100 border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Item Info */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-foreground font-serif line-clamp-1">
                              {item.name}
                            </h4>
                            <span className="text-xs font-bold text-foreground shrink-0">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>

                          {/* Customization Details */}
                          <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                            {!item.isCustom ? (
                              <p>Size: {item.options.size.split(" (")[0]} • Wrap: {item.options.wrap}</p>
                            ) : (
                              <p>Wrap: {item.options.wrap}</p>
                            )}
                            
                            {/* Stems list for custom bouquets */}
                            {item.isCustom && item.stems && (
                              <div className="bg-stone-50 rounded p-1.5 mt-1 border border-stone-100">
                                <p className="font-semibold text-stone-600 mb-0.5">Custom Recipe:</p>
                                <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                  {item.stems.map((stem, idx) => (
                                    <li key={idx} className="line-clamp-1">
                                      • {stem.count}x {stem.name}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {item.options.cardMessage && (
                              <p className="italic text-amber-800 bg-amber-50/50 rounded px-1.5 py-0.5 mt-1 border border-amber-100 line-clamp-1">
                                &ldquo;{item.options.cardMessage}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-border">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleQuantityMinus(item)}
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Decrease Quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Increase Quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-stone-400 hover:text-red-500 transition-colors"
                            aria-label="Remove Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* STEP 2: Delivery details Form */
                <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/50">
                  <div className="rounded-xl border border-border bg-white p-4 space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-secondary" />
                      Recipient Information
                    </h3>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Recipient Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Who is receiving these beautiful blooms?"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Delivery Address</label>
                      <input
                        type="text"
                        required
                        placeholder="Street address, apartment, suite"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Contact Phone</label>
                      <input
                        type="tel"
                        required
                        placeholder="Recipient's phone (for delivery coordination)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-white p-4 space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-secondary" />
                      Delivery Schedule
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Select Date</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split("T")[0]}
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Time Window</label>
                        <select
                          value={deliverySlot}
                          onChange={(e) => setDeliverySlot(e.target.value)}
                          className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                          <option value="morning">Morning (8 AM - 12 PM)</option>
                          <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                          <option value="evening">Evening (5 PM - 9 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-secondary/40 bg-secondary/5 p-3 flex items-start gap-2.5 text-secondary text-xs">
                    <Truck className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Hand-Delivered Fresh</p>
                      <p className="text-[10px] text-secondary/90 mt-0.5">
                        Delivered in a climate-controlled vehicle with water hydration wrap. If recipient is not home, the courier will call or leave in a safe place.
                      </p>
                    </div>
                  </div>

                  {/* Hidden Submit Button to allow enter key submit */}
                  <input type="submit" className="hidden" />
                </form>
              )}

              {/* Footer / Summary Panel */}
              <div className="border-t border-border bg-white px-4 py-6 sm:px-6 space-y-4 shadow-lg">
                {/* Calculations */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax (8%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-[10px] text-secondary font-medium">💡 Add {formatPrice(100 - subtotal)} more for FREE delivery!</p>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
                    <span>Total Amount</span>
                    <span className="text-base text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {step === "cart" ? (
                    <button
                      onClick={() => setStep("delivery")}
                      className="w-full flex items-center justify-center gap-1.5 rounded-full bg-primary hover:bg-primary-600 text-white py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Proceed to Delivery
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep("cart")}
                        className="rounded-full border border-border px-4 py-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckoutSubmit}
                        disabled={isCheckingOut || !name || !address || !phone || !deliveryDate}
                        className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-600 disabled:bg-stone-200 text-white py-3 text-xs font-bold shadow-md hover:shadow-lg disabled:shadow-none disabled:cursor-not-allowed transition-all"
                      >
                        {isCheckingOut ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing Secure Payment...
                          </>
                        ) : (
                          <>
                            Secure Checkout ({formatPrice(total)})
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setCartOpen(false)}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
