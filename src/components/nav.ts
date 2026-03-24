import { NavItem, CartItem } from '../types';
import { calculateCartItemsCount } from '../utils';

export interface NavProps {
    container: HTMLElement;
    items: NavItem[];
    initialCart: CartItem[];
    onCartClick: () => void;
}

export interface NavInstance {
    updateCartCount: (cart: CartItem[]) => void;
}

/**
 * Renders the main navigation header with a dynamic cart counter and mobile menu.
 * 
 * @param props Configuration and callbacks for the navigation component.
 * @returns An object containing methods to interact with the rendered navigation.
 */
export function renderNav({ container, items, initialCart, onCartClick }: NavProps): NavInstance {
    const initialCount = calculateCartItemsCount(initialCart);

    // Generate Desktop Navigation Links
    const desktopLinksHtml = items.map(item => `
        <a href="${item.href}" class="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            ${item.label}
        </a>
    `).join('');

    // Generate Mobile Navigation Links
    const mobileLinksHtml = items.map(item => `
        <a href="${item.href}" class="mobile-nav-link block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            ${item.label}
        </a>
    `).join('');

    // Component HTML Structure
    const navHtml = `
        <header class="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 transition-all duration-300" id="main-header">
            <div class="container-custom h-16 flex items-center justify-between">
                
                <!-- Logo -->
                <a href="/" class="text-xl font-bold tracking-tighter text-white flex items-center gap-2 z-50 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-accent)">
                        <path d="M12 2L2 7l10 5 10-5-10-5Z"/>
                        <path d="m2 17 10 5 10-5"/>
                        <path d="m2 12 10 5 10-5"/>
                    </svg>
                    <span>NEXUS</span>
                </a>

                <!-- Desktop Navigation -->
                <nav class="hidden md:flex items-center gap-8">
                    ${desktopLinksHtml}
                </nav>

                <!-- Actions (Cart & Mobile Toggle) -->
                <div class="flex items-center gap-2 z-50 relative">
                    <button id="nav-cart-btn" class="relative p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/5" aria-label="Open cart">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="8" cy="21" r="1"/>
                            <circle cx="19" cy="21" r="1"/>
                            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                        </svg>
                        <span id="nav-cart-badge" 
                              class="absolute top-0 right-0 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center transition-transform duration-300 ${initialCount > 0 ? 'scale-100' : 'scale-0'}"
                              style="background-color: var(--color-accent);">
                            ${initialCount}
                        </span>
                    </button>

                    <!-- Mobile Menu Toggle -->
                    <button id="nav-mobile-toggle" class="md:hidden p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/5" aria-label="Toggle menu">
                        <svg id="icon-menu" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="block">
                            <line x1="4" x2="20" y1="12" y2="12"/>
                            <line x1="4" x2="20" y1="6" y2="6"/>
                            <line x1="4" x2="20" y1="18" y2="18"/>
                        </svg>
                        <svg id="icon-close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden">
                            <path d="M18 6 6 18"/>
                            <path d="m6 6 12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Mobile Navigation Menu -->
            <div id="mobile-menu" class="fixed inset-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-lg flex-col pt-24 px-6 pb-6 hidden opacity-0 transition-opacity duration-300 md:hidden">
                <nav class="flex flex-col gap-2">
                    ${mobileLinksHtml}
                </nav>
            </div>
        </header>
    `;

    // Inject HTML into the container
    container.innerHTML = navHtml;

    // DOM Elements
    const cartBtn = container.querySelector('#nav-cart-btn');
    const cartBadge = container.querySelector('#nav-cart-badge');
    const mobileToggle = container.querySelector('#nav-mobile-toggle');
    const mobileMenu = container.querySelector('#mobile-menu');
    const iconMenu = container.querySelector('#icon-menu');
    const iconClose = container.querySelector('#icon-close');
    const mobileNavLinks = container.querySelectorAll('.mobile-nav-link');

    let isMobileMenuOpen = false;

    // Event Listeners
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            if (isMobileMenuOpen) toggleMobileMenu(); // Close mobile menu if open
            onCartClick();
        });
    }

    function toggleMobileMenu() {
        isMobileMenuOpen = !isMobileMenuOpen;
        
        if (isMobileMenuOpen) {
            mobileMenu?.classList.remove('hidden');
            // Small delay to allow display:block to apply before animating opacity
            requestAnimationFrame(() => {
                mobileMenu?.classList.remove('opacity-0');
                mobileMenu?.classList.add('opacity-100');
            });
            iconMenu?.classList.add('hidden');
            iconClose?.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            mobileMenu?.classList.remove('opacity-100');
            mobileMenu?.classList.add('opacity-0');
            setTimeout(() => {
                mobileMenu?.classList.add('hidden');
            }, 300); // Match transition duration
            iconMenu?.classList.remove('hidden');
            iconClose?.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when a link is clicked
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (isMobileMenuOpen) toggleMobileMenu();
        });
    });

    // Return API to update the component state externally
    return {
        updateCartCount: (cart: CartItem[]) => {
            if (!cartBadge) return;
            
            const newCount = calculateCartItemsCount(cart);
            cartBadge.textContent = newCount.toString();
            
            if (newCount > 0) {
                cartBadge.classList.remove('scale-0');
                cartBadge.classList.add('scale-100');
                
                // Add a subtle pop animation when item is added
                cartBadge.classList.add('animate-pulse');
                setTimeout(() => {
                    cartBadge.classList.remove('animate-pulse');
                }, 500);
            } else {
                cartBadge.classList.remove('scale-100');
                cartBadge.classList.add('scale-0');
            }
        }
    };
}