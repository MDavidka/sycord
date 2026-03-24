import './style.css';
import { Product, CartItem } from './types';
import { getLocalStorage, setLocalStorage, generateId } from './utils';

// Component Imports
import { renderNav } from './components/nav';
import { renderHero } from './components/hero';
import { renderFeatureGrid } from './components/feature-grid';
import { renderProductCard } from './components/product-card';
import { renderCartDrawer } from './components/cart-drawer';
import { renderFooter } from './components/footer';

// --- Mock Data ---
const MOCK_PRODUCTS: Product[] = [
    {
        id: 'prod_x1_pro',
        name: 'Aura X1 Pro',
        description: 'Aerospace-grade titanium design with our most advanced camera system yet.',
        price: 1199,
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop',
        category: 'smartphones',
        isNew: true,
        colors: [
            { name: 'Natural Titanium', hex: '#b5b6b9' },
            { name: 'Space Black', hex: '#2c2c2e' }
        ],
        specs: {
            screenSize: '6.7"',
            storage: ['256GB', '512GB', '1TB'],
            camera: '48MP Main | 12MP Ultrawide | 5x Telephoto',
            battery: '4422 mAh'
        }
    },
    {
        id: 'prod_x1',
        name: 'Aura X1',
        description: 'The perfect balance of power and beauty. Featuring the new A17 Bionic chip.',
        price: 899,
        imageUrl: 'https://images.unsplash.com/photo-1652808628470-3333a088d453?q=80&w=1000&auto=format&fit=crop',
        category: 'smartphones',
        isNew: true,
        colors: [
            { name: 'Midnight', hex: '#1c1d21' },
            { name: 'Starlight', hex: '#f9f6ef' },
            { name: 'Ocean Blue', hex: '#295270' }
        ],
        specs: {
            screenSize: '6.1"',
            storage: ['128GB', '256GB', '512GB'],
            camera: '48MP Main | 12MP Ultrawide',
            battery: '3877 mAh'
        }
    },
    {
        id: 'prod_lite',
        name: 'Aura Lite',
        description: 'Essential features at an incredible value. All-day battery life and stunning OLED display.',
        price: 599,
        imageUrl: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=1000&auto=format&fit=crop',
        category: 'smartphones',
        isNew: false,
        colors: [
            { name: 'Graphite', hex: '#4c4c4e' },
            { name: 'Product Red', hex: '#c80815' }
        ],
        specs: {
            screenSize: '6.1"',
            storage: ['128GB', '256GB'],
            camera: '12MP Main | 12MP Ultrawide',
            battery: '3279 mAh'
        }
    }
];

// --- Application State ---
let cart: CartItem[] = [];
let isCartOpen: boolean = false;

// --- State Management ---
function loadCart() {
    cart = getLocalStorage<CartItem[]>('aura_cart', []);
}

function saveCart() {
    setLocalStorage('aura_cart', cart);
    updateDynamicUI();
}

function handleAddToCart(product: Product, color: { name: string; hex: string }) {
    // Check if item with same product and color already exists
    const existingItemIndex = cart.findIndex(
        item => item.product.id === product.id && item.color.name === color.name
    );

    if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += 1;
    } else {
        cart.push({
            id: generateId(),
            product,
            quantity: 1,
            color
        });
    }

    saveCart();
    isCartOpen = true; // Auto-open cart on add
    updateDynamicUI();
}

function handleUpdateQuantity(id: string, newQuantity: number) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex >= 0) {
        if (newQuantity <= 0) {
            handleRemoveItem(id);
        } else {
            cart[itemIndex].quantity = newQuantity;
            saveCart();
        }
    }
}

function handleRemoveItem(id: string) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
}

function toggleCart(forceState?: boolean) {
    isCartOpen = forceState !== undefined ? forceState : !isCartOpen;
    updateDynamicUI();
}

// --- UI Rendering ---

/**
 * Updates only the parts of the UI that depend on state (Nav & Cart)
 */
function updateDynamicUI() {
    const navContainer = document.getElementById('nav-container');
    const cartContainer = document.getElementById('cart-container');

    if (navContainer) {
        const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        renderNav({
            container: navContainer,
            cartCount,
            onCartClick: () => toggleCart(true)
        });
    }

    if (cartContainer) {
        renderCartDrawer({
            container: cartContainer,
            cart,
            isOpen: isCartOpen,
            onClose: () => toggleCart(false),
            onUpdateQuantity: handleUpdateQuantity,
            onRemoveItem: handleRemoveItem,
            onCheckout: () => {
                alert('Checkout flow would initiate here. Connecting to Appwrite/Stripe...');
            }
        });
    }
}

/**
 * Initial render of the static/semi-static page sections
 */
function renderStaticSections() {
    const heroContainer = document.getElementById('hero-container');
    const featuresContainer = document.getElementById('features-container');
    const productsGrid = document.getElementById('products-grid');
    const footerContainer = document.getElementById('footer-container');

    if (heroContainer) {
        renderHero({
            container: heroContainer,
            onCtaClick: () => {
                const productsSection = document.getElementById('products-section');
                productsSection?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (featuresContainer) {
        renderFeatureGrid({ container: featuresContainer });
    }

    if (productsGrid) {
        productsGrid.innerHTML = ''; // Clear before appending
        MOCK_PRODUCTS.forEach(product => {
            const cardWrapper = document.createElement('div');
            productsGrid.appendChild(cardWrapper);
            
            renderProductCard({
                container: cardWrapper,
                product,
                onAddToCart: handleAddToCart
            });
        });
    }

    if (footerContainer) {
        renderFooter({ container: footerContainer });
    }
}

/**
 * Builds the base DOM structure
 */
function buildLayout(root: HTMLElement) {
    root.innerHTML = `
        <div id="nav-container" class="sticky top-0 z-50 w-full"></div>
        
        <main class="flex-1 w-full flex flex-col">
            <div id="hero-container"></div>
            <div id="features-container"></div>
            
            <section id="products-section" class="py-24 md:py-32 bg-[var(--color-bg-secondary)] relative">
                <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div class="container-custom">
                    <div class="max-w-3xl mb-16 md:mb-24">
                        <h2 class="text-3xl md:text-5xl font-bold tracking-tighter mb-6">
                            <span class="text-gradient">Latest Models.</span>
                        </h2>
                        <p class="text-lg md:text-xl text-[var(--color-text-secondary)]">
                            Choose the perfect device for your lifestyle. Engineered for tomorrow.
                        </p>
                    </div>
                    <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        <!-- Products injected here -->
                    </div>
                </div>
            </section>
        </main>

        <div id="footer-container" class="w-full mt-auto"></div>
        <div id="cart-container"></div>
    `;
}

// --- Initialization ---
export function init() {
    const appRoot = document.getElementById('app');
    if (!appRoot) {
        console.error('Critical Error: Root element #app not found in index.html');
        return;
    }

    // 1. Build Layout Shell
    buildLayout(appRoot);

    // 2. Load State
    loadCart();

    // 3. Render Components
    renderStaticSections();
    updateDynamicUI();
}

// Boot the application when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}