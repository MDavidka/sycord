export interface HeroProps {
    container: HTMLElement;
    onCtaClick: () => void;
}

/**
 * Renders the sycord hero section with a two-column layout:
 * left column has brand identity, heading, auth buttons and CTA;
 * right column shows the halftone blueprint illustration.
 * The left background uses a vertical metallic-stripe texture that
 * fades to the page background color.
 *
 * @param props Configuration and callbacks for the hero component.
 */
export function renderHero({ container, onCtaClick }: HeroProps): void {
    const heroHtml = `
        <section class="hero-section">

            <!-- Vertical metallic stripe background (fades right & bottom) -->
            <div class="hero-stripe-bg" aria-hidden="true"></div>

            <!-- Content -->
            <div class="relative z-10 container-custom">
                <div class="hero-layout">

                    <!-- ── Left Column ── -->
                    <div class="hero-left-col">

                        <!-- Logo -->
                        <div class="hero-logo">
                            <!-- Sycord icon: stylised speech-bubble / envelope shape -->
                            <svg width="32" height="26" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <rect x="0" y="0" width="32" height="20" rx="4" fill="white"/>
                                <polyline points="0,2 16,13 32,2" fill="none" stroke="#080808" stroke-width="1.5" stroke-linejoin="round"/>
                                <polygon points="12,20 16,26 20,20" fill="white"/>
                            </svg>
                            <span>sycord</span>
                        </div>

                        <!-- Heading -->
                        <h1 class="hero-heading">
                            ship your website <strong>under</strong><br><strong>5 minutes</strong>
                        </h1>

                        <!-- Social auth row -->
                        <div class="hero-auth-row">
                            <!-- GitHub -->
                            <button class="hero-auth-btn" aria-label="Sign in with GitHub">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                                </svg>
                                <span>GitHub</span>
                            </button>

                            <!-- Google -->
                            <button class="hero-auth-btn" aria-label="Sign in with Google">
                                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span>Google</span>
                            </button>
                        </div>

                        <!-- CTA button -->
                        <button id="hero-cta-btn" class="hero-cta-btn">
                            Get Started
                        </button>

                    </div>

                    <!-- ── Right Column – Illustration ── -->
                    <div class="hero-right-col" aria-hidden="true">
                        <img
                            src="https://github.com/user-attachments/assets/690d5593-0f32-4fa5-abba-1222b3fab900"
                            alt="Halftone blueprint illustration"
                            class="hero-illustration"
                            loading="eager"
                        />
                    </div>

                </div>
            </div>
        </section>
    `;

    container.innerHTML = heroHtml;

    const ctaBtn = container.querySelector('#hero-cta-btn');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', onCtaClick);
    }
}