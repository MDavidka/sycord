"use client"

import { useFlowerShopStore } from "@/lib/store"
import { formatPrice } from "@/lib/utils"
import { CheckCircle2, Clock, MapPin, Truck, Gift, RefreshCw, ShoppingBag, Phone } from "lucide-react"

export default function OrderTracker() {
  const { activeOrder, setActiveOrder, simulateOrderProgress, stopSimulation } = useFlowerShopStore()

  const loadDemoOrder = () => {
    const demoItems = [
      {
        id: "demo-1",
        name: "Eternal Romance Bouquet",
        price: 85.00,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=200",
        options: {
          size: "Standard" as const,
          wrap: "Rustic Kraft Paper",
          cardMessage: "Happy Anniversary, my darling! Here's to many more years. - Arthur"
        }
      }
    ]

    const demoOrder = {
      orderId: "PB-582910",
      status: "arranging" as const,
      progress: 35,
      recipient: {
        name: "Clara Oswald",
        address: "742 Evergreen Terrace, Springfield",
        phone: "+1 (555) 382-9102",
        deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // tomorrow
        deliverySlot: "Afternoon (12 PM - 5 PM)"
      },
      items: demoItems,
      subtotal: 85.00,
      deliveryFee: 0,
      tax: 6.80,
      total: 91.80,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setActiveOrder(demoOrder)
    simulateOrderProgress()
  }

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "ordered":
        return {
          title: "Order Placed",
          desc: "We received your order and are preparing the fresh stems.",
          icon: ShoppingBag,
          color: "text-blue-500 bg-blue-50 border-blue-200"
        }
      case "arranging":
        return {
          title: "Florist Arranging",
          desc: "Our master florist is hand-tying your bespoke bouquet right now.",
          icon: Gift,
          color: "text-primary bg-primary/5 border-primary/20"
        }
      case "delivering":
        return {
          title: "Out for Delivery",
          desc: "Your bouquet is loaded in our temperature-controlled van and is on its way.",
          icon: Truck,
          color: "text-secondary bg-secondary/5 border-secondary/20"
        }
      case "delivered":
        return {
          title: "Delivered Fresh",
          desc: "The flowers have been hand-delivered to the recipient's doorstep!",
          icon: CheckCircle2,
          color: "text-emerald-500 bg-emerald-50 border-emerald-200"
        }
      default:
        return {
          title: "Processing",
          desc: "Verifying details.",
          icon: Clock,
          color: "text-stone-500 bg-stone-50 border-stone-200"
        }
    }
  }

  const steps = [
    { id: "ordered", label: "Ordered" },
    { id: "arranging", label: "Arranging" },
    { id: "delivering", label: "In Transit" },
    { id: "delivered", label: "Delivered" }
  ]

  const getStepIndex = (status: string) => {
    return steps.findIndex((step) => step.id === status)
  }

  const currentStepIndex = activeOrder ? getStepIndex(activeOrder.status) : -1
  const activeStatusDetails = activeOrder ? getStatusDetails(activeOrder.status) : null

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border pb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">
          Live Delivery Tracker
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Watch your flowers transition from fresh farm stems to hand-tied bouquets, and finally to your recipient&apos;s hands.
        </p>
      </div>

      {!activeOrder ? (
        /* Empty State */
        <div className="mt-8 text-center py-16 border border-dashed border-border rounded-2xl bg-white space-y-6">
          <span className="text-5xl animate-float inline-block">🚀</span>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Active Deliveries</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              You haven&apos;t placed an order in this session yet. Place an order through the shopping cart, or load a simulated demo order to see how our tracker works!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={loadDemoOrder}
              className="rounded-full bg-secondary hover:bg-secondary-600 text-white px-6 py-2.5 text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Load Demo Order
            </button>
          </div>
        </div>
      ) : (
        /* Tracker Panel */
        <div className="mt-8 space-y-6">
          {/* Main Status Card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tracking Number</span>
                <h3 className="text-lg font-bold text-foreground font-mono">{activeOrder.orderId}</h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimated Delivery</span>
                <p className="text-sm font-bold text-foreground">{activeOrder.recipient.deliveryDate} ({activeOrder.recipient.deliverySlot.split(" (")[0]})</p>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative pt-4">
              {/* Progress Line background */}
              <div className="absolute left-0 top-[28px] h-1 w-full bg-stone-100 rounded-full" />
              {/* Progress Line active */}
              <div
                className="absolute left-0 top-[28px] h-1 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${activeOrder.progress}%` }}
              />

              <div className="relative flex justify-between">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex
                  const isActive = idx === currentStepIndex
                  const StepIcon = idx === 0 ? ShoppingBag : idx === 1 ? Gift : idx === 2 ? Truck : CheckCircle2

                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 z-10 ${
                          isCompleted
                            ? "bg-primary border-primary text-white"
                            : isActive
                            ? "bg-white border-primary text-primary shadow-md ring-4 ring-primary/10"
                            : "bg-white border-stone-200 text-stone-400"
                        }`}
                      >
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span
                        className={`mt-2 text-[10px] font-bold tracking-wider uppercase ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status Update Feed */}
            {activeStatusDetails && (
              <div className={`rounded-xl border p-4 flex gap-4 items-start ${activeStatusDetails.color}`}>
                <activeStatusDetails.icon className="h-5 w-5 shrink-0 mt-0.5 animate-pulse-soft" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{activeStatusDetails.title}</h4>
                  <p className="text-xs mt-1 leading-relaxed">{activeStatusDetails.desc}</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery & Recipient Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
                <MapPin className="h-4 w-4 text-secondary" />
                Delivery Destination
              </h4>
              <div className="space-y-1.5 text-xs text-foreground">
                <p className="font-bold">{activeOrder.recipient.name}</p>
                <p className="text-muted-foreground leading-relaxed">{activeOrder.recipient.address}</p>
                <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{activeOrder.recipient.phone}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Items Hand-Tied
              </h4>
              <div className="space-y-3 max-h-[140px] overflow-y-auto pr-1">
                {activeOrder.items.map((item) => (
                  <div key={item.id} className="flex gap-2 text-xs">
                    <div className="h-10 w-10 rounded overflow-hidden border border-border shrink-0 bg-stone-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Qty: {item.quantity} • {item.options.size.split(" (")[0]} size
                      </p>
                    </div>
                    <span className="font-bold text-foreground shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-dashed border-border flex justify-between text-xs font-bold text-foreground">
                <span>Total Paid</span>
                <span className="text-primary">{formatPrice(activeOrder.total)}</span>
              </div>
            </div>
          </div>

          {/* Reset / Stop Tracker Simulation */}
          <div className="text-center">
            <button
              onClick={() => {
                stopSimulation()
                setActiveOrder(null)
              }}
              className="text-xs text-muted-foreground hover:text-red-500 underline transition-colors"
            >
              Cancel Tracking & Clear Simulation
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
