import { create } from "zustand"

export type ActiveTab = "home" | "catalog" | "builder" | "care" | "tracker"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  category?: string
  options: {
    size: "Standard" | "Deluxe (+ $15)" | "Grand Luxe (+ $35)"
    wrap: string
    cardMessage?: string
  }
  isCustom?: boolean
  stems?: { name: string; count: number; price: number; color: string }[]
}

export interface Product {
  id: string
  name: string
  price: number
  rating: number
  reviews: number
  image: string
  category: "bouquets" | "indoor" | "single" | "wedding" | "sympathy"
  description: string
  features: string[]
  tags: string[]
  isBestSeller?: boolean
  isNew?: boolean
}

export interface StemOption {
  id: string
  name: string
  color: string
  colorHex: string
  price: number
  image: string
}

export interface WrapOption {
  id: string
  name: string
  colorHex: string
  price: number
}

export interface OrderDetails {
  orderId: string
  status: "ordered" | "arranging" | "delivering" | "delivered"
  progress: number // 0 to 100
  recipient: {
    name: string
    address: string
    phone: string
    deliveryDate: string
    deliverySlot: string
  }
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  createdAt: string
}

interface FlowerShopStore {
  // Navigation
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  
  // Catalog Search/Filter
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  sortBy: "popular" | "price-low" | "price-high" | "newest"
  setSortBy: (sort: "popular" | "price-low" | "price-high" | "newest") => void

  // Product Preview Modal
  previewProduct: Product | null
  setPreviewProduct: (product: Product | null) => void

  // Cart State
  cart: CartItem[]
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number

  // Custom Bouquet Builder State
  builderStems: Record<string, number> // stemId -> count
  builderWrap: string // wrapId
  builderCardMessage: string
  builderName: string
  setBuilderName: (name: string) => void
  addBuilderStem: (stemId: string) => void
  removeBuilderStem: (stemId: string) => void
  setBuilderWrap: (wrapId: string) => void
  setBuilderCardMessage: (msg: string) => void
  resetBuilder: () => void

  // Order & Tracking State
  activeOrder: OrderDetails | null
  setActiveOrder: (order: OrderDetails | null) => void
  simulateOrderProgress: () => void
  stopSimulation: () => void
}

// Static options for Bouquet Builder
export const STEM_OPTIONS: StemOption[] = [
  { id: "rose-red", name: "Red Rose", color: "Crimson", colorHex: "#dc2626", price: 3.5, image: "🌹" },
  { id: "rose-pink", name: "Pink Rose", color: "Blush Pink", colorHex: "#f472b6", price: 3.5, image: "🌸" },
  { id: "lily-white", name: "White Lily", color: "Snow White", colorHex: "#fafaf9", price: 4.5, image: "⚜️" },
  { id: "tulip-yellow", name: "Yellow Tulip", color: "Sun Gold", colorHex: "#eab308", price: 2.5, image: "🌷" },
  { id: "peony-coral", name: "Coral Peony", color: "Peach Coral", colorHex: "#fb923c", price: 5.0, image: "🌺" },
  { id: "hydrangea-blue", name: "Blue Hydrangea", color: "Sky Blue", colorHex: "#60a5fa", price: 6.0, image: "🪻" },
  { id: "eucalyptus", name: "Eucalyptus Leaves", color: "Sage Green", colorHex: "#86efac", price: 1.5, image: "🌿" },
  { id: "baby-breath", name: "Baby's Breath", color: "Cloud White", colorHex: "#f3f4f6", price: 2.0, image: "✨" },
]

export const WRAP_OPTIONS: WrapOption[] = [
  { id: "kraft", name: "Rustic Kraft Paper", colorHex: "#d7c0a3", price: 4.0 },
  { id: "sage", name: "Sage Silk Ribbon Wrap", colorHex: "#a1c5b6", price: 6.0 },
  { id: "pink-mesh", name: "Blush Organza Netting", colorHex: "#fbcfe8", price: 7.5 },
  { id: "luxury-black", name: "Matte Black Parisian Wrap", colorHex: "#1c1917", price: 8.0 },
  { id: "none", name: "Glass Vase Arrangement", colorHex: "#e2e8f0", price: 15.0 },
]

let simulationInterval: any = null

export const useFlowerShopStore = create<FlowerShopStore>((set, get) => ({
  // Navigation
  activeTab: "home",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Catalog State
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedCategory: "all",
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  priceRange: [15, 250],
  setPriceRange: (range) => set({ priceRange: range }),
  sortBy: "popular",
  setSortBy: (sort) => set({ sortBy: sort }),

  // Product Preview
  previewProduct: null,
  setPreviewProduct: (product) => set({ previewProduct: product }),

  // Cart State
  cart: [],
  isCartOpen: false,
  setCartOpen: (open) => set({ isCartOpen: open }),
  
  addToCart: (item) => set((state) => {
    // Generate a unique identifier based on ID and customization options to group identical customized items
    const optionHash = `${item.id}-${item.options.size}-${item.options.wrap}-${item.options.cardMessage || ""}`
    
    const existingItemIndex = state.cart.findIndex(
      (i) => `${i.id}-${i.options.size}-${i.options.wrap}-${i.options.cardMessage || ""}` === optionHash
    )

    if (existingItemIndex > -1) {
      const newCart = [...state.cart]
      newCart[existingItemIndex].quantity += item.quantity || 1
      return { cart: newCart, isCartOpen: true }
    }

    return { 
      cart: [...state.cart, { ...item, quantity: item.quantity || 1 } as CartItem],
      isCartOpen: true 
    }
  }),

  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== itemId)
  })),

  updateQuantity: (itemId, quantity) => set((state) => ({
    cart: state.cart.map((item) => 
      item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
    )
  })),

  clearCart: () => set({ cart: [] }),
  
  getCartTotal: () => {
    const { cart } = get()
    return cart.reduce((acc, item) => {
      // Calculate item cost with options
      let basePrice = item.price
      if (item.options.size === "Deluxe (+ $15)") basePrice += 15
      if (item.options.size === "Grand Luxe (+ $35)") basePrice += 35
      return acc + basePrice * item.quantity
    }, 0)
  },

  // Custom Bouquet State
  builderStems: {},
  builderWrap: "kraft",
  builderCardMessage: "",
  builderName: "My Custom Bouquet",
  setBuilderName: (name) => set({ builderName: name }),
  
  addBuilderStem: (stemId) => set((state) => {
    const current = state.builderStems[stemId] || 0
    // Max 40 stems total
    const totalStems = Object.values(state.builderStems).reduce((a, b) => a + b, 0)
    if (totalStems >= 40) return {}
    return {
      builderStems: {
        ...state.builderStems,
        [stemId]: Math.min(24, current + 1)
      }
    }
  }),

  removeBuilderStem: (stemId) => set((state) => {
    const current = state.builderStems[stemId] || 0
    if (current <= 0) return {}
    const updated = { ...state.builderStems }
    if (current === 1) {
      delete updated[stemId]
    } else {
      updated[stemId] = current - 1
    }
    return { builderStems: updated }
  }),

  setBuilderWrap: (wrapId) => set({ builderWrap: wrapId }),
  setBuilderCardMessage: (msg) => set({ builderCardMessage: msg }),
  
  resetBuilder: () => set({
    builderStems: {},
    builderWrap: "kraft",
    builderCardMessage: "",
    builderName: "My Custom Bouquet"
  }),

  // Order & Tracking State
  activeOrder: null,
  setActiveOrder: (order) => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      simulationInterval = null
    }
    set({ activeOrder: order })
  },

  simulateOrderProgress: () => {
    const { activeOrder, setActiveOrder } = get()
    if (!activeOrder) return

    if (simulationInterval) {
      clearInterval(simulationInterval)
    }

    simulationInterval = setInterval(() => {
      const currentOrder = get().activeOrder
      if (!currentOrder) {
        clearInterval(simulationInterval)
        return
      }

      let nextStatus = currentOrder.status
      let nextProgress = currentOrder.progress + 4 // increase progress slowly

      if (nextProgress >= 100) {
        nextProgress = 100
        if (currentOrder.status === "ordered") {
          nextStatus = "arranging"
          nextProgress = 25
        } else if (currentOrder.status === "arranging") {
          nextStatus = "delivering"
          nextProgress = 60
        } else if (currentOrder.status === "delivering") {
          nextStatus = "delivered"
          nextProgress = 100
          clearInterval(simulationInterval)
        }
      }

      set({
        activeOrder: {
          ...currentOrder,
          status: nextStatus,
          progress: nextProgress
        }
      })
    }, 4000) // update every 4 seconds for immediate visual feedback
  },

  stopSimulation: () => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      simulationInterval = null
    }
  }
}))
