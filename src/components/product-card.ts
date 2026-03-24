import { Product, ProductCardProps } from '../types';
import { formatCurrency } from '../utils';

/**
 * Renders a reusable product card displaying phone image, name, price, 
 * color selection, and an add-to-cart button.
 * 
 * @param props Configuration and callbacks for the product card.
 */
export function renderProductCard({ container, product, onAddToCart }: ProductCardProps): void {
    if (!product) {
        console.warn('ProductCard requires a product to render.');
        return;
    }

    // Default to the first available color
    let selectedColor = product.colors && product.colors.length > 0 
        ? product.colors[0] 
        : { name: 'Standard', hex: '#cccccc' };

    const formattedPrice = formatCurrency(product.price);
    const shortDescription = product.tagline || 
        (product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description);

    // Generate color picker HTML if colors are available
    const colorPickerHtml = product.colors && product.colors.length > 0 ? `
        <div class="mb-6">
            <span class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2 block font-medium">
                Color: <span class="color-name-display text-white ml-1">${selectedColor.name}</span>
            </span>
            <div class="flex items-center gap-2 color-picker-container">
                ${product.colors.map((color, index) => `
                    <button 
                        type="button"
                        data-color-index="${index}"
                        class="color-btn w-6 h-6 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] ${index === 0 ? 'border-white scale-110' : 'border-transparent hover:border-white/50'}"
                        style="background-color: ${color.hex};"
                        aria-label="Select ${color.name} color"
                        title="${color.name}"
                    ></button>
                `).join('')}
            </div>
        </div>
    ` : '<div class="mb-6 h-[52px]"></div>'; // Spacer if no colors

    const cardHtml = `
        <div class="group relative flex flex-col bg-[var(--color-bg-secondary)] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 h-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50">
            
            <!-- Image Area -->
            <div class="relative aspect-[4/5] p-8 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent overflow-hidden">
                ${product.isFlagship ? `
                    <span class="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)] text-white px-3 py-1 rounded-full shadow-lg">
                        Flagship
                    </span>
                ` : ''}
                
                <!-- Subtle background glow behind the phone -->
                <div class="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <img 
                    src="${product.imageUrl}" 
                    alt="${product.name}" 
                    class="relative z-10 w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
            </div>

            <!-- Content Area -->
            <div class="p-6 flex flex-col flex-grow bg-[var(--color-bg-secondary)] relative z-20">
                <div class="mb-2 flex justify-between items-start gap-4">
                    <h3 class="text-lg font-semibold text-white leading-tight">${product.name}</h3>
                    <span class="text-lg font-medium text-white whitespace-nowrap">${formattedPrice}</span>
                </div>
                
                <p class="text-sm text-[var(--color-text-secondary)] mb-6 flex-grow">
                    ${shortDescription}
                </p>

                ${colorPickerHtml}

                <!-- Action Button -->
                <button 
                    type="button"
                    class="add-to-cart-btn w-full btn-secondary py-3 group-hover:bg-[var(--color-accent)] group-hover:text-white group-hover:border-transparent transition-all duration-300 relative overflow-hidden"
                >
                    <span class="relative z-10 flex items-center justify-center gap-2 btn-text">
                        Add to Cart
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-1">
                            <path d="M5 12h14"/>
                            <path d="m12 5 7 7-7 7"/>
                        </svg>
                    </span>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = cardHtml;

    // --- Interactivity & Event Listeners ---

    const colorBtns = container.querySelectorAll('.color-btn');
    const colorNameDisplay = container.querySelector('.color-name-display');
    const addToCartBtn = container.querySelector('.add-to-cart-btn');
    const btnText = container.querySelector('.btn-text');

    // Handle Color Selection
    if (colorBtns.length > 0 && product.colors) {
        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                const index = parseInt(target.getAttribute('data-color-index') || '0', 10);
                
                if (product.colors && product.colors[index]) {
                    selectedColor = product.colors[index];
                    
                    // Update display name
                    if (colorNameDisplay) {
                        colorNameDisplay.textContent = selectedColor.name;
                    }

                    // Update button styles (active state)
                    colorBtns.forEach(b => {
                        b.classList.remove('border-white', 'scale-110');
                        b.classList.add('border-transparent');
                    });
                    target.classList.remove('border-transparent');
                    target.classList.add('border-white', 'scale-110');
                }
            });
        });
    }

    // Handle Add to Cart
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            // Trigger callback
            onAddToCart(product, selectedColor);

            // Visual feedback
            if (btnText) {
                const originalHtml = btnText.innerHTML;
                btnText.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Added
                `;
                addToCartBtn.classList.add('bg-[var(--color-success)]', 'text-white');
                addToCartBtn.classList.remove('group-hover:bg-[var(--color-accent)]');

                // Reset after 2 seconds
                setTimeout(() => {
                    btnText.innerHTML = originalHtml;
                    addToCartBtn.classList.remove('bg-[var(--color-success)]', 'text-white');
                    addToCartBtn.classList.add('group-hover:bg-[var(--color-accent)]');
                }, 2000);
            }
        });
    }
}