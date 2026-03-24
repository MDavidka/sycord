import { ComponentProps } from '../types';

export interface Feature {
    id: string;
    title: string;
    description: string;
    icon: string;
}

export interface FeatureGridProps extends ComponentProps {
    title?: string;
    subtitle?: string;
    features?: Feature[];
}

/**
 * Default premium features for the modern phone brand.
 */
const defaultFeatures: Feature[] = [
    {
        id: 'camera',
        title: 'Pro-Grade Camera',
        description: 'Capture cinematic moments with our advanced triple-lens system and AI-powered computational photography.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`
    },
    {
        id: 'battery',
        title: 'All-Day Battery',
        description: 'A high-density silicon-carbon battery that easily powers through your busiest days, with 120W ultra-fast charging.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/><line x1="10" x2="10" y1="11" y2="13"/><line x1="14" x2="14" y1="11" y2="13"/></svg>`
    },
    {
        id: 'display',
        title: 'Super Retina XDR',
        description: 'Experience true-to-life colors and infinite contrast on a 120Hz adaptive OLED display that peaks at 2500 nits.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`
    },
    {
        id: 'processor',
        title: 'Bionic Processing',
        description: 'Desktop-class performance in your pocket. The custom 3nm silicon handles intensive gaming and multitasking effortlessly.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`
    }
];

/**
 * Renders a grid of technical features highlighting the advantages of the products.
 * Includes scroll-triggered entrance animations for a premium feel.
 * 
 * @param props Configuration for the feature grid component.
 */
export function renderFeatureGrid({ 
    container, 
    title = "Innovation in every detail.", 
    subtitle = "Engineered to push the boundaries of what a smartphone can do.",
    features = defaultFeatures 
}: FeatureGridProps): void {
    
    const featuresHtml = features.map((feature, index) => `
        <div class="feature-card group relative flex flex-col p-8 rounded-2xl glass-panel hover:bg-white/[0.02] transition-colors duration-500 opacity-0 translate-y-8" style="transition-delay: ${index * 100}ms;">
            
            <!-- Subtle hover glow -->
            <div class="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
            
            <!-- Icon Container -->
            <div class="w-14 h-14 rounded-xl bg-[var(--color-bg-tertiary)] border border-white/10 flex items-center justify-center text-[var(--color-accent)] mb-6 group-hover:scale-110 group-hover:border-[var(--color-accent)]/30 transition-all duration-500 relative z-10">
                ${feature.icon}
            </div>
            
            <!-- Content -->
            <div class="relative z-10">
                <h3 class="text-xl font-semibold text-white mb-3 tracking-tight">${feature.title}</h3>
                <p class="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                    ${feature.description}
                </p>
            </div>
        </div>
    `).join('');

    const gridHtml = `
        <section class="py-24 md:py-32 relative overflow-hidden bg-[var(--color-bg-primary)]">
            
            <!-- Background Decoration -->
            <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <div class="container-custom relative z-10">
                
                <!-- Section Header -->
                <div class="max-w-3xl mb-16 md:mb-24 feature-header opacity-0 translate-y-8 transition-all duration-700">
                    <h2 class="text-3xl md:text-5xl font-bold tracking-tighter mb-6 text-balance">
                        <span class="text-gradient">${title}</span>
                    </h2>
                    <p class="text-lg md:text-xl text-[var(--color-text-secondary)] text-balance">
                        ${subtitle}
                    </p>
                </div>

                <!-- Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    ${featuresHtml}
                </div>
                
            </div>
        </section>
    `;

    container.innerHTML = gridHtml;

    // --- Intersection Observer for Scroll Animations ---
    
    // We only want to run this in the browser environment
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add classes to trigger the CSS transitions
                    entry.target.classList.remove('opacity-0', 'translate-y-8');
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    
                    // Stop observing once animated
                    obs.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe the header
        const header = container.querySelector('.feature-header');
        if (header) observer.observe(header);

        // Observe each feature card
        const cards = container.querySelectorAll('.feature-card');
        cards.forEach(card => observer.observe(card));
    } else {
        // Fallback for environments without IntersectionObserver (or SSR)
        // Just show everything immediately
        const header = container.querySelector('.feature-header');
        if (header) {
            header.classList.remove('opacity-0', 'translate-y-8');
            header.classList.add('opacity-100', 'translate-y-0');
        }
        
        const cards = container.querySelectorAll('.feature-card');
        cards.forEach(card => {
            card.classList.remove('opacity-0', 'translate-y-8');
            card.classList.add('opacity-100', 'translate-y-0');
        });
    }
}