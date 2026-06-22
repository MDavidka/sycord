"use client"

import { useState, useEffect } from "react"
import { useFlowerShopStore, OrderDetails, STEM_OPTIONS, WRAP_OPTIONS } from "@/lib/store"
import { formatPrice } from "@/lib/utils"
import { MapPin, Clock, Calendar, CheckCircle2, Truck, Gift, RefreshCw, Search, ArrowRight, User, Phone, ClipboardCheck } from "lucide-react"

export default function OrderTracker() {
  const { activeOrder, setActiveOrder, simulateOrderProgress, stopSimulation } = useFlowerShopStore()
  const [searchCode, setSearchQuery] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Clean up simulation on unmount
  useEffect(() => {
    return () => {
      stopSimulation()
    }
  }, [stopSimulation])

  const loadDemoOrder = () => {
    const demoId = `PB-${Math.floor(100000 + Math.random() * 900000)}`
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]

    const demoOrder: OrderDetails = {
      orderId: demoId,
      status: "arranging",
      progress: 45,
      recipient: {
        name: "Charlotte Dubois",
        address: "742 Evergreen Terrace, Springfield",
        phone: "+1 (555) 234-5678",
        deliveryDate: dateStr,
        deliverySlot: "Afternoon (12 PM - 5 PM)"
      },
      items: [
        {
          id: "demo-1",
          name: "Eternal Romance Bouquet",
          price: 85.00,
          image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=400",
          quantity: 1,
          options: {
            size: "Deluxe (+ $15)",
            wrap: "Matte Black Parisian Wrap",
            cardMessage: "Happy Birthday, my beautiful sister! Love you always."
          }
        }
      ],
      subtotal: 100.00,
      deliveryFee: 0,
      tax: 8.00,
      total: 108.00,
      createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setActiveOrder(demoOrder)
    simulateOrderProgress()
  }

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCode.trim()) return

    // Simple validation
    if (searchCode.toUpperCase().startsWith("PB-") && searchCode.length === 9) {
      setErrorMsg("")
      // Load a random order matching that ID
      const now = new Date()
      const dateStr = now.toISOString().split("T")[0]
      const searchedOrder: OrderDetails = {
        orderId: searchCode.toUpperCase(),
        status: "ordered",
        progress: 15,
        recipient: {
          name: "Alex Johnson",
          address: "128 Oakwood Lane, Apt 4B, Brooklyn NY",
          phone: "+1 (212) 555-8912",
          deliveryDate: dateStr,
          deliverySlot: "Evening (5 PM - 9 PM)"
        },
        items: [
          {
            id: "searched-1",
            name: "Blushing Grace Peonies",
            price: 95.00,
            image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=400",
            quantity: 1,
            options: {
              size: "Standard",
              wrap: "Rustic Kraft Paper",
              cardMessage: "Thank you for being such an amazing friend."
            }
          }
        ],
        subtotal: 95.00,
        deliveryFee: 9.99,
        tax: 7.60,
        total: 112.59,
        createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setActiveOrder(searchedOrder)
      simulateOrderProgress()
    } else {
      setErrorMsg("Invalid tracking code format. Code must be like PB-XXXXXX (e.g. PB-582910)")
    }
  }

  // Generate simulated status feed based on progress
  const getStatusFeed = (order: OrderDetails) => {
    const feed = []
    const createdTime = order.createdAt

    feed.push({
      time: createdTime,
      title: "Order Confirmed",
      desc: `Order code ${order.orderId} successfully placed and payment verified.`,
      done: true
    })

    if (order.progress >= 25 || order.status !== "ordered") {
      feed.push({
        time: "10 mins later",
        title: "Florist Selecting Blooms",
        desc: "Master florist Sarah is hand-selecting fresh stems and preparing the wrap.",
        done: order.progress >= 25
      })
    }

    if (order.progress >= 50 || ["delivering", "delivered"].includes(order.status)) {
      feed.push({
        time: "25 mins later",
        title: "Bouquet Assembled & Wrapped",
        desc: `Bouquet beautifully handcrafted and wrapped in ${order.items[0]?.options.wrap || "Kraft Paper"}. Water pack attached for freshness.`,
        done: order.progress >= 50
      })
    }

    if (order.progress >= 75 || order.status === "delivered") {
      feed.push({
        time: "40 mins later",
        title: "In Transit",
        desc: "Handed over to courier Leo. In transit in temperature-controlled vehicle.",
        done: order.progress >= 75
      })
    }

    if (order.status === "delivered") {
      feed.push({
        time: "Just now",
        title: "Delivered & Signed",
        desc: `Successfully hand-delivered to recipient ${order.recipient.name}. Freshness guarantee active!`,
        done: true
      })
    }

    return feed.reverse() // show latest at top
  }

  const steps = [
    { id: "ordered", label: "Order Placed", icon: ClipboardCheck },
    { id: "arranging", label: "Arranging", icon: Gift },
    { id: "delivering", label: "In Transit", icon: Truck },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
  ] as const

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border pb-6 text-center md:text-left">
        <span className="rounded-full bg-secondary/10 text-secondary px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          Live Order Tracking
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 font-serif">
          Track Your Blooms
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Follow your bouquet&apos;s journey from our flower cold-room, through our master florists&apos; hands, onto our delivery vans, and straight to your recipient.
        </p>
      </div>

      {!activeOrder ? (
        /* EMPTY STATE: Enter tracking code or load demo */
        <div className="mt-12 max-w-xl mx-auto text-center">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm space-y-6">
            <span className="text-5xl animate-pulse">📦</span>
            <div>
              <h3 className="text-lg font-bold text-foreground font-serif">No Active Order Tracked</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-sm mx-auto">
                If you just placed an order, it will appear here automatically. Otherwise, enter your 9-digit tracking code below or load our live interactive demo.
              </p>
            </div>

            {/* Tracking Search Form */}
            <form onSubmit={handleTrackSubmit} className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter order code (e.g. PB-582910)"
                  value={searchCode}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border pl-10 pr-4 py-2.5 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              {errorMsg && <p className="text-[10px] text-red-500 font-semibold text-left pl-2">{errorMsg}</p>}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background py-2.5 text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Track Order
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink mx-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            {/* Quick Demo Button */}
            <button
              onClick={loadDemoOrder}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 py-3 text-xs font-bold transition-all"
            >
              <RefreshCw className="h-4 w-4 animate-spin-slow" />
              Load Live Interactive Simulation
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE TRACKING PANEL */
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Progress Stepper & Live Feed (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Progress Card */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tracking Code</span>
                  <h3 className="text-xl font-bold text-foreground font-serif">{activeOrder.orderId}</h3>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase text-emerald-600 tracking-wider bg-emerald-50 rounded-full px-2.5 py-0.5">
                    {activeOrder.status === "ordered" ? "Order Placed" : activeOrder.status === "arranging" ? "Arranging" : activeOrder.status === "delivering" ? "In Transit" : "Delivered"}
                  </span>
                </div>
              </div>

              {/* Visual Stepper */}
              <div className="mt-8 relative">
                {/* Connector Line */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[calc(100%-48px)] h-1 bg-stone-100 hidden md:block">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${
                        activeOrder.status === "ordered" ? "10%" : activeOrder.status === "arranging" ? "45%" : activeOrder.status === "delivering" ? "80%" : "100%"
                      }%`
                    }}
                  />
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-0 relative z-10">
                  {steps.map((step, idx) => {
                    const StepIcon = step.icon
                    const isCompleted =
                      activeOrder.status === "delivered" ||
                      (activeOrder.status === "delivering" && step.id !== "delivered") ||
                      (activeOrder.status === "arranging" && ["ordered", "arranging"].includes(step.id)) ||
                      (activeOrder.status === "ordered" && step.id === "ordered")

                    const isActive = activeOrder.status === step.id

                    return (
                      <div key={step.id} className="flex md:flex-col items-center text-left md:text-center gap-4 md:gap-2">
                        {/* Icon Circle */}
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isCompleted
                              ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                              : isActive
                              ? "bg-white border-primary text-primary ring-4 ring-primary/10"
                              : "bg-white border-stone-200 text-stone-300"
                          }`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>

                        {/* Labels */}
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isCompleted || isActive ? "text-foreground" : "text-stone-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground md:hidden mt-0.5">
                            {step.id === "ordered" ? "Payment verified" : step.id === "arranging" ? "Florist craft room" : step.id === "delivering" ? "Out in van" : "Arrived safely"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Progress Bar (Mobile) */}
              <div className="mt-6 md:hidden">
                <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span className="text-primary">{Math.round(activeOrder.progress)}%</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${activeOrder.progress}%` }} />
                </div>
              </div>
            </div>

            {/* Live Feed Card */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Delivery Timeline Updates
              </h3>
              
              <div className="relative border-l-2 border-stone-100 pl-6 ml-3 space-y-6">
                {getStatusFeed(activeOrder).map((feed, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Bullet */}
                    <span
                      className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white transition-colors ${
                        feed.done ? "border-primary text-primary" : "border-stone-200 text-stone-300"
                      }`}
                    >
                      {feed.done && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </span>

                    <div className={feed.done ? "opacity-100" : "opacity-50"}>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-foreground">{feed.title}</h4>
                        <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {feed.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feed.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Recipient & Item Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Recipient details */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                Recipient Details
              </h3>

              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground">{activeOrder.recipient.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Recipient Name</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">{activeOrder.recipient.address}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Delivery Location</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">{activeOrder.recipient.phone}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Contact Number</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {activeOrder.recipient.deliveryDate} • {activeOrder.recipient.deliverySlot}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Scheduled Delivery Window</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Summary Card */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                Items Ordered
              </h3>

              <div className="space-y-3">
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="h-12 w-12 rounded-lg border border-border overflow-hidden bg-stone-50 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-foreground font-serif line-clamp-1">{item.name}</h4>
                        <span className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Qty: {item.quantity} • Size: {item.options.size.split(" (")[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="border-t border-dashed border-border pt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">{formatPrice(activeOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{activeOrder.deliveryFee === 0 ? "FREE" : formatPrice(activeOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2">
                  <span>Total Paid</span>
                  <span className="text-primary">{formatPrice(activeOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Stop Simulation Button */}
            <button
              onClick={() => setActiveOrder(null)}
              className="w-full rounded-full border border-stone-200 hover:bg-stone-50 text-stone-500 py-2.5 text-xs font-semibold transition-all"
            >
              Clear Tracker & Track Another Order
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
