import { CartItem, CartDrawerProps } from '../types';
import { formatCurrency, calculateCartTotal, calculateCartItemsCount } from '../utils';

/**
 * Renders a slide-out cart drawer interface.
 * Manages its own DOM updates efficiently to preserve CSS transitions.
 * 
 * @param props Configuration and callbacks for the cart drawer.
 */
export function renderCartDrawer(props: CartDrawerProps): void {
    // Cast to any internally to safely destructure assumed properties 
    // while maintaining the strict exported signature.
    const {
        container,
        cart = [],
        isOpen = false,
        onClose,
        onUpdateQuantity,
        onRemoveItem,
        onCheckout
    } = props as any;

    if (!container) {
        console.warn('CartDrawer requires a valid container element.');
        return;
    }

    // 1. Initial Setup (Build the shell if it doesn't exist)
    if (!container.querySelector('.cart-overlay')) {
        container.innerHTML = `
            <div class="cart-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 opacity-0 pointer-events-none"></div>
            <div class="cart-panel fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-bg-secondary)] shadow-2xl z-[101] transform transition-transform duration-300 translate-x-full flex flex-col border-l border-white/10">
                
                <!-- Header -->
                <div class="flex items-center justify-between p-6 border-b border-white/10 bg-[var(--color-bg-secondary)] relative z-10">
                    <div class="flex items-center gap-3">
                        <h2 class="text-xl font-semibold text-white tracking-tight">Your Cart</h2>
                        <span class="cart-count-badge bg-[var(--color-accent)] text-white text-xs font-bold px-2.5 py-0.5 rounded-full hidden">0</span>
                    </div>
                    <button class="close-cart-btn p-2 -mr-2 text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 rounded-full transition-all" aria-label="Close cart">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>

                <!-- Body (Scrollable) -->
                <div class="cart-list flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--color-bg-primary)]">
                    <!-- Cart items injected here dynamically -->
                </div>

                <!-- Footer -->
                <div class="cart-footer p-6 border-t border-white/10 bg-[var(--color-bg-secondary)] relative z-10">
                    <div class="space-y-3 mb-6">
                        <div class="flex justify-between text-sm">
                            <span class="text-[var(--color-text-secondary)]">Subtotal</span>
                            <span class="cart-subtotal font-medium text-white">$0.00</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-[var(--color-text-secondary)]">Shipping</span>
                            <span class="text-white">Calculated at checkout</span>
                        </div>
                    </div>
                    <button class="checkout-btn w-full py-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
                        <span>Proceed to Checkout</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                </div>
            </div>
        `;

        // Attach static event listeners once
        const overlayEl = container.querySelector('.cart-overlay');
        const closeBtnEl = container.querySelector('.close-cart-btn');
        const checkoutBtnEl = container.querySelector('.checkout-btn');

        if (overlayEl) overlayEl.addEventListener('click', () => onClose && onClose());
        if (closeBtnEl) closeBtnEl.addEventListener('click', () => onClose && onClose());
        if (checkoutBtnEl) checkoutBtnEl.addEventListener('click', () => onCheckout && onCheckout());
    }

    // 2. Update Visibility State (Slide in/out)
    const overlay = container.querySelector('.cart-overlay');
    const panel = container.querySelector('.cart-panel');

    if (overlay && panel) {
        if (isOpen) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100');
            panel.classList.remove('translate-x-full');
            panel.classList.add('translate-x-0');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            overlay.classList.add('opacity-0', 'pointer-events-none');
            overlay.classList.remove('opacity-100');
            panel.classList.add('translate-x-full');
            panel.classList.remove('translate-x-0');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    // 3. Update Cart Content
    const cartList = container.querySelector('.cart-list');
    const cartCountBadge = container.querySelector('.cart-count-badge');
    const cartSubtotal = container.querySelector('.cart-subtotal');
    const checkoutBtn = container.querySelector('.checkout-btn') as HTMLButtonElement;

    if (cartList) {
        if (!cart || cart.length === 0) {
            // Empty State
            cartList.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-80 py-12">
                    <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-text-muted)]"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    </div>
                    <p class="text-[var(--color-text-secondary)] font-medium">Your cart is empty.</p>
                    <p class="text-sm text-[var(--color-text-muted)] max-w-[200px]">Looks like you haven't added any devices yet.</p>
                    <button class="continue-shopping-btn mt-6 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] text-sm font-medium transition-colors">
                        Continue Shopping
                    </button>
                </div>
            `;

            const continueBtn = cartList.querySelector('.continue-shopping-btn');
            if (continueBtn) {
                continueBtn.addEventListener('click', () => onClose && onClose());
            }
        } else {
            // Populated State
            cartList.innerHTML = cart.map((item: any) => `
                <div class="flex gap-4 bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-white/5 relative group hover:border-white/10 transition-colors">
                    
                    <!-- Product Image -->
                    <div class="w-20 h-24 bg-[var(--color-bg-primary)] rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                        <img src="${item.product.imageUrl}" alt="${item.product.name}" class="w-full h-full object-contain drop-shadow-md" />
                    </div>
                    
                    <!-- Product Details -->
                    <div class="flex flex-col flex-1 justify-between">
                        <div>
                            <div class="flex justify-between items-start gap-2">
                                <h3 class="text-sm font-medium text-white line-clamp-2 leading-tight">${item.product.name}</h3>
                                <button class="remove-item-btn text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors p-1 -mt-1 -mr-1" data-id="${item.id}" aria-label="Remove item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </div>
                            <p class="text-xs text-[var(--color-text-secondary)] mt-1.5 flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded-full inline-block border border-white/20 shadow-sm" style="background-color: ${item.color.hex}"></span>
                                ${item.color.name}
                            </p>
                        </div>
                        
                        <!-- Quantity & Price -->
                        <div class="flex justify-between items-center mt-3">
                            <div class="flex items-center bg-[var(--color-bg-primary)] rounded-lg border border-white/10 h-8">
                                <button class="qty-btn minus w-8 h-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white transition-colors" data-id="${item.id}" data-action="decrease" aria-label="Decrease quantity">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
                                </button>
                                <span class="w-8 text-center text-sm font-medium text-white">${item.quantity}</span>
                                <button class="qty-btn plus w-8 h-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white transition-colors" data-id="${item.id}" data-action="increase" aria-label="Increase quantity">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                </button>
                            </div>
                            <span class="text-sm font-semibold text-white">${formatCurrency(item.product.price * item.quantity)}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Attach dynamic listeners for newly rendered items
            cartList.querySelectorAll('.remove-item-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (id && onRemoveItem) onRemoveItem(id);
                });
            });

            cartList.querySelectorAll('.qty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const action = btn.getAttribute('data-action');
                    if (id && onUpdateQuantity) {
                        const item = cart.find((i: any) => i.id === id);
                        if (item) {
                            const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
                            if (newQty > 0) {
                                onUpdateQuantity(id, newQty);
                            } else if (onRemoveItem) {
                                onRemoveItem(id);
                            }
                        }
                    }
                });
            });
        }
    }

    // 4. Update Totals & Badges
    const totalItems = calculateCartItemsCount(cart);
    const totalPrice = calculateCartTotal(cart);

    if (cartCountBadge) {
        cartCountBadge.textContent = totalItems.toString();
        if (totalItems === 0) {
            cartCountBadge.classList.add('hidden');
        } else {
            cartCountBadge.classList.remove('hidden');
        }
    }

    if (cartSubtotal) {
        cartSubtotal.textContent = formatCurrency(totalPrice);
    }

    if (checkoutBtn) {
        if (!cart || cart.length === 0) {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}