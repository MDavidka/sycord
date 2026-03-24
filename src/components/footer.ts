import { SiteConfig } from '../types';

export interface FooterProps {
    container: HTMLElement;
    config: SiteConfig;
}

/**
 * Renders the global footer component including navigation links, 
 * newsletter signup, and legal information.
 * 
 * @param props Configuration and container for the footer.
 */
export function renderFooter({ container, config }: FooterProps): void {
    const currentYear = new Date().getFullYear();

    const footerHtml = `
        <footer class="bg-[var(--color-bg-secondary)] border-t border-white/5 pt-16 pb-8 mt-auto">
            <div class="container-custom">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
                    
                    <!-- Brand & Newsletter -->
                    <div class="lg:col-span-2">
                        <a href="/" class="text-2xl font-bold tracking-tighter text-white flex items-center gap-2 mb-6 inline-flex">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-accent)">
                                <path d="M12 2L2 7l10 5 10-5-10-5Z"/>
                                <path d="m2 17 10 5 10-5"/>
                                <path d="m2 12 10 5 10-5"/>
                            </svg>
                            <span>${config.brandName}</span>
                        </a>
                        <p class="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm">
                            Experience the future of mobile technology. Designed for those who demand excellence in every interaction.
                        </p>
                        
                        <form id="newsletter-form" class="flex flex-col sm:flex-row gap-3 max-w-md">
                            <div class="relative flex-grow">
                                <input 
                                    type="email" 
                                    id="newsletter-email"
                                    placeholder="Enter your email" 
                                    class="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-text-muted)]"
                                    required
                                >
                            </div>
                            <button type="submit" class="btn-primary whitespace-nowrap py-3">
                                Subscribe
                            </button>
                        </form>
                        <p id="newsletter-message" class="text-xs text-[var(--color-success)] mt-2 hidden opacity-0 transition-opacity duration-300">
                            Thanks for subscribing!
                        </p>
                    </div>

                    <!-- Shop Links -->
                    <div>
                        <h3 class="text-white font-semibold mb-5 text-sm tracking-wider uppercase">Shop</h3>
                        <ul class="space-y-3 text-sm text-[var(--color-text-secondary)]">
                            <li><a href="#phones" class="hover:text-white transition-colors">Flagship Phones</a></li>
                            <li><a href="#accessories" class="hover:text-white transition-colors">Accessories</a></li>
                            <li><a href="#wearables" class="hover:text-white transition-colors">Wearables</a></li>
                            <li><a href="#compare" class="hover:text-white transition-colors">Compare Models</a></li>
                            <li><a href="#offers" class="hover:text-white transition-colors">Special Offers</a></li>
                        </ul>
                    </div>

                    <!-- Support Links -->
                    <div>
                        <h3 class="text-white font-semibold mb-5 text-sm tracking-wider uppercase">Support</h3>
                        <ul class="space-y-3 text-sm text-[var(--color-text-secondary)]">
                            <li><a href="#help" class="hover:text-white transition-colors">Help Center</a></li>
                            <li><a href="#track" class="hover:text-white transition-colors">Track Order</a></li>
                            <li><a href="#warranty" class="hover:text-white transition-colors">Warranty Info</a></li>
                            <li><a href="#returns" class="hover:text-white transition-colors">Returns & Exchanges</a></li>
                            <li><a href="mailto:${config.supportEmail}" class="hover:text-white transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                    <!-- Company Links -->
                    <div>
                        <h3 class="text-white font-semibold mb-5 text-sm tracking-wider uppercase">Company</h3>
                        <ul class="space-y-3 text-sm text-[var(--color-text-secondary)]">
                            <li><a href="#about" class="hover:text-white transition-colors">About ${config.brandName}</a></li>
                            <li><a href="#careers" class="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#newsroom" class="hover:text-white transition-colors">Newsroom</a></li>
                            <li><a href="#environment" class="hover:text-white transition-colors">Environment</a></li>
                            <li><a href="#privacy" class="hover:text-white transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                </div>

                <!-- Bottom Bar -->
                <div class="pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-muted)]">
                        <span>&copy; ${currentYear} ${config.brandName} Inc. All rights reserved.</span>
                        <span class="hidden md:inline">|</span>
                        <a href="#terms" class="hover:text-white transition-colors">Terms of Service</a>
                        <span class="hidden md:inline">|</span>
                        <a href="#legal" class="hover:text-white transition-colors">Legal</a>
                        <span class="hidden md:inline">|</span>
                        <a href="#sitemap" class="hover:text-white transition-colors">Site Map</a>
                    </div>

                    <!-- Social Icons -->
                    <div class="flex items-center gap-5 text-[var(--color-text-secondary)]">
                        <a href="${config.socialLinks.twitter}" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors" aria-label="Twitter">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                            </svg>
                        </a>
                        <a href="${config.socialLinks.instagram}" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors" aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                            </svg>
                        </a>
                        <a href="${config.socialLinks.facebook}" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors" aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    `;

    container.innerHTML = footerHtml;

    // Attach Newsletter Logic
    const form = container.querySelector('#newsletter-form') as HTMLFormElement;
    const message = container.querySelector('#newsletter-message') as HTMLParagraphElement;
    const emailInput = container.querySelector('#newsletter-email') as HTMLInputElement;

    if (form && message && emailInput) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            if (!email) return;

            // Simulate API call
            const submitBtn = form.querySelector('button');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                    
                    emailInput.value = '';
                    
                    message.classList.remove('hidden');
                    // Small delay to allow display:block to apply before animating opacity
                    requestAnimationFrame(() => {
                        message.classList.remove('opacity-0');
                        message.classList.add('opacity-100');
                    });

                    // Hide message after 3 seconds
                    setTimeout(() => {
                        message.classList.remove('opacity-100');
                        message.classList.add('opacity-0');
                        setTimeout(() => message.classList.add('hidden'), 300);
                    }, 3000);
                }, 1000);
            }
        });
    }
}