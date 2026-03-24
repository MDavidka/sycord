import { Product } from '../types';
import { formatCurrency } from '../utils';

export interface HeroProps {
    container: HTMLElement;
    product: Product;
    onBuyClick: (product: Product) => void;
    onLearnMoreClick: (product: Product) => void;
}

/**
 * Renders the high-impact hero section showcasing the flagship phone.
 * 
 * @param props Configuration and callbacks for the hero component.
 */
export function renderHero({ container, product, onBuyClick, onLearnMoreClick }: HeroProps): void {
    // Ensure we have a product to display
    if (!product) {
        console.warn('Hero component requires a product to render.');
        return;
    }

    const formattedPrice = formatCurrency(product.price);
    const tagline = product.tagline || 'The future is here.';

    const heroHtml = `
        <section class="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-16 overflow-hidden bg-[var(--color-bg-primary)]">
            
            <!-- Background Glow Effects -->
            <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-accent)]/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div class="container-custom relative z-10 flex flex-col items-center text-center">
                
                <!-- Tagline -->
                <span class="text-[var(--color-accent)] font-semibold tracking-wider uppercase text-sm mb-4 animate-fade-in-up" style="animation-delay: 0.1s;">
                    ${tagline}
                </span>

                <!-- Product Name -->
                <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-balance">
                    <span class="text-gradient">${product.name}</span>
                </h1>

                <!-- Description -->
                <p class="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mb-8 text-balance animate-fade-in-up" style="animation-delay: 0.2s;">
                    ${product.description}
                </p>

                <!-- Price -->
                <div class="text-2xl font-medium text-white mb-10 animate-fade-in-up" style="animation-delay: 0.3s;">
                    From ${formattedPrice}
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row items-center gap-4 mb-16 animate-fade-in-up" style="animation-delay: 0.4s;">
                    <button id="hero-buy-btn" class="btn-primary w-full sm:w-auto text-lg px-8 py-4">
                        Buy Now
                    </button>
                    <button id="hero-learn-btn" class="btn-secondary w-full sm:w-auto text-lg px-8 py-4 group">
                        Learn More
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-1">
                            <path d="M5 12h14"/>
                            <path d="m12 5 7 7-7 7"/>
                        </svg>
                    </button>
                </div>

                <!-- Product Image -->
                <div class="relative w-full max-w-4xl mx-auto animate-fade-in-up" style="animation-delay: 0.5s;">
                    <div class="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden glass-panel p-2 md:p-4">
                        <img 
                            src="${product.imageUrl}" 
                            alt="${product.name}" 
                            class="w-full h-full object-cover rounded-xl shadow-2xl transition-transform duration-[2000ms] hover:scale-105"
                            loading="eager"
                        />
                        
                        <!-- Reflection/Gloss Overlay -->
                        <div class="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-xl"></div>
                    </div>
                    
                    <!-- Floating Specs Badges (Decorative) -->
                    ${product.specs ? `
                        <div class="hidden md:flex absolute -left-12 top-1/4 glass-panel px-4 py-2 rounded-full items-center gap-2 shadow-lg animate-bounce" style="animation-duration: 3s;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent)]"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            <span class="text-sm font-medium text-white">${product.specs.processor}</span>
                        </div>
                        <div class="hidden md:flex absolute -right-8 bottom-1/4 glass-panel px-4 py-2 rounded-full items-center gap-2 shadow-lg animate-bounce" style="animation-duration: 4s; animation-delay: 1s;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent)]"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                            <span class="text-sm font-medium text-white">${product.specs.camera}</span>
                        </div>
                    ` : ''}
                </div>

            </div>
        </section>
    `;

    container.innerHTML = heroHtml;

    // Attach Event Listeners
    const buyBtn = container.querySelector('#hero-buy-btn');
    const learnBtn = container.querySelector('#hero-learn-btn');

    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            onBuyClick(product);
        });
    }

    if (learnBtn) {
        learnBtn.addEventListener('click', () => {
            onLearnMoreClick(product);
        });
    }
}