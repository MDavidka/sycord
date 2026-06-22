"use client"

import { useFlowerShopStore } from "@/lib/store"
import { formatPrice } from "@/lib/utils"
import { Truck, CheckCircle2, Clock, MapPin, Phone, User, Gift, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"

export default function OrderTracker() {
  const { activeOrder, setActiveOrder, simulateOrderProgress } = useFlowerShopStore()

  // Load a demo order if they want to see the tracker in action
  const handleLoadDemoOrder = () => {
    const demoOrder = {
      orderId: "PB-582910",
      status: "arranging" as const,
      progress: 40,
      recipient: {
        name: "Clara Oswald",
        address: "742 Evergreen Terrace, Springfield",
        phone: "+1 (555) 321-9988",
        deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // tomorrow
        deliverySlot: "Afternoon (12 PM - 5 PM)"
      },
      items: [
        {
          id: "eternal-romance-demo",
          name: "Eternal Romance Bouquet",
          price: 85.00,
          image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=400",
          quantity: 1,
          options: {
            size: "Standard" as const,
            wrap: "Rustic Kraft Paper"
          }
        }
      ],
      subtotal: 85.00,
      deliveryFee: 0,
      tax: 6.80,
      total: 91.80,
      createdAt: "10:30 AM"
    }

    setActiveOrder(demoOrder)
    simulateOrderProgress()
  }

  const steps = [
    { id: "ordered", label: "Order Placed", desc: "We received your order", icon: "📝", progressMin: 0 },
    { id: "arranging", label: "Arranging Flowers", desc: "Our florists are hand-tying your blooms", icon: "💐", progressMin: 25 },
    { id: "delivering", label: "Out for Delivery", desc: "Your courier is on the way in a cold van", icon: "🚚", progressMin: 60 },
    { id: "delivered", label: "Delivered", desc: "Hand-delivered fresh to recipient", icon: "🎁", progressMin: 100 },
  ]

  const getStepStatus = (stepProgressMin: number, orderProgress: number, orderStatus: string, stepId: string) => {
    if (orderStatus === "delivered") return "completed"
    if (orderProgress >= stepProgressMin) {
      if (orderProgress === stepProgressMin || (orderStatus === stepId)) return "active"
      return "completed"
    }
    return "pending"
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border pb-6 text-center md:text-left">
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          Live Delivery Tracker
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 font-serif">
          Track Your Fresh Blooms
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Follow your bouquet&apos;s journey from our design table to their doorstep in real-time.
        </p>
      </div>

      {!activeOrder ? (
        /* Empty State */
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-white p-8 md:p-12 text-center max-w-xl mx-auto">
          <span className="text-5xl animate-float inline-block">🛸</span>
          <h3 className="text-lg font-bold text-foreground mt-5">No Active Deliveries Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
            You don&apos;t have any active orders right now. Place an order through our catalog or custom builder to watch it live here!
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleLoadDemoOrder}
              className="rounded-full border border-border bg-stone-50 hover:bg-stone-100 text-foreground px-5 py-2.5 text-xs font-semibold transition-colors"
            >
              Simulate Demo Order
            </button>
            <span className="text-xs text-muted-foreground hidden sm:inline">or</span>
            <button
              onClick={() => {
                const store = useFlowerShopStore.getState()
                store.setActiveTab("catalog")
              }}
              className="rounded-full bg-primary hover:bg-primary-600 text-white px-6 py-2.5 text-xs font-semibold shadow-sm transition-all"
            >
              Order Flowers Now
            </button>
          </div>
        </div>
      ) : (
        /* Active Order Tracker */
        <div className="mt-8 space-y-6">
          {/* Tracker Card */}
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm space-y-6">
            {/* ID and Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tracking ID</span>
                <h3 className="text-lg font-bold text-foreground">{activeOrder.orderId}</h3>
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-3.5 py-1.5 text-secondary text-xs font-bold">
                {activeOrder.status === "ordered" && <Clock className="h-3.5 w-3.5 animate-pulse" />}
                {activeOrder.status === "arranging" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {activeOrder.status === "delivering" && <Truck className="h-3.5 w-3.5 animate-bounce" />}
                {activeOrder.status === "delivered" && <CheckCircle2 className="h-3.5 w-3.5" />}
                <span className="capitalize">
                  {activeOrder.status === "ordered" && "Order Placed"}
                  {activeOrder.status === "arranging" && "Designing Bouquet"}
                  {activeOrder.status === "delivering" && "Out for Delivery"}
                  {activeOrder.status === "delivered" && "Delivered Fresh!"}
                </span>
              </div>
            </div>

            {/* Visual Stepper */}
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-[22px] left-4 right-4 h-1 bg-stone-100 -z-10 rounded-full sm:left-12 sm:right-12">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${activeOrder.progress}%` }}
                />
              </div>

              {/* Steps grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {steps.map((step) => {
                  const status = getStepStatus(step.progressMin, activeOrder.progress, activeOrder.status, step.id)
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      {/* Node Circle */}
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg shadow-sm transition-all duration-500 ${
                          status === "completed"
                            ? "bg-primary border-primary text-white"
                            : status === "active"
                            ? "bg-white border-primary text-primary scale-110 ring-4 ring-primary/10"
                            : "bg-white border-stone-200 text-stone-400"
                        }`}
                      >
                        {status === "completed" ? "✓" : step.icon}
                      </div>

                      {/* Labels */}
                      <h4
                        className={`text-xs font-bold mt-2 font-serif transition-colors ${
                          status === "active" ? "text-primary" : status === "completed" ? "text-foreground" : "text-stone-400"
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-[9px] text-muted-foreground mt-0.5 max-w-[100px] hidden md:block leading-tight">
                        {step.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Current Status Update Box */}
            <div className="rounded-xl bg-stone-50 border border-border p-4 flex items-start gap-3 text-xs leading-relaxed">
              <span className="text-xl">💡</span>
              <div>
                <p className="font-bold text-foreground">
                  {activeOrder.status === "ordered" && "We have received your order!"}
                  {activeOrder.status === "arranging" && "Master florist Sarah is currently handcrafting your floral arrangement."}
                  {activeOrder.status === "delivering" && "Courier Leo has loaded your bouquet in a chilled hydration capsule and is heading out."}
                  {activeOrder.status === "delivered" && "Your flowers have been hand-delivered! We hope they bring massive smiles."}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {activeOrder.status === "ordered" && `Placed today at ${activeOrder.createdAt}`}
                  {activeOrder.status === "arranging" && "Stems are being trimmed under water to ensure maximum freshness."}
                  {activeOrder.status === "delivering" && "Estimated delivery in 15-30 minutes."}
                  {activeOrder.status === "delivered" && `Signed for by recipient. Enjoy your beautiful blooms!`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Delivery Details Card (7 cols) */}
            <div className="md:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-secondary" />
                Delivery Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Recipient</span>
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-stone-400" />
                    {activeOrder.recipient.name}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Phone Number</span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-stone-400" />
                    {activeOrder.recipient.phone}
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Shipping Address</span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    {activeOrder.recipient.address}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Delivery Date</span>
                  <p className="font-semibold text-foreground">
                    {activeOrder.recipient.deliveryDate}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Time Window</span>
                  <p className="font-semibold text-foreground">
                    {activeOrder.recipient.deliverySlot}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Summary Card (5 cols) */}
            <div className="md:col-span-5 rounded-2xl border border-border bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5 mb-3">
                  <ShoppingBag className="h-4 w-4 text-secondary" />
                  Order Summary
                </h3>

                <div className="space-y-3 max-h-[150px] overflow-y-auto pr-1">
                  {activeOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-2 text-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg object-cover border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          Qty: {item.quantity} • {item.options.size.split(" (")[0]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-3 mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(activeOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{activeOrder.deliveryFee === 0 ? "FREE" : formatPrice(activeOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>{formatPrice(activeOrder.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-foreground">
                  <span>Total Paid</span>
                  <span className="text-primary">{formatPrice(activeOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
