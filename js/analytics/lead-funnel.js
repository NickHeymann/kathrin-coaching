/* analytics/lead-funnel.js
 * CTA & Conversion Tracking | ~120 Zeilen
 */

const LeadFunnelTracker = {
    /**
     * Initialisierung
     */
    init() {
        this.trackCTAs();
        this.trackExternalLinks();
        this.trackNewsletterForms();
        this.trackQuizzes();

        if (ANALYTICS_CONFIG?.debug) {
            console.log('🎯 LeadFunnelTracker initialisiert');
        }
    },

    /**
     * CTA-Buttons automatisch tracken
     */
    trackCTAs() {
        // Alle CTA-Buttons finden
        const ctaSelectors = [
            '.cta-button',
            '.btn-cta',
            '[data-cta]',
            'a[href*="calendly"]',
            'a[href*="booking"]',
            'a[href*="termin"]'
        ];

        document.querySelectorAll(ctaSelectors.join(', ')).forEach(el => {
            el.addEventListener('click', (e) => {
                const ctaType = el.dataset.cta || el.textContent.trim().slice(0, 30);
                const fromPage = window.location.pathname;
                AnalyticsTracker.ctaClicked(ctaType, fromPage);
            });
        });
    },

    /**
     * Externe Links tracken
     */
    trackExternalLinks() {
        document.querySelectorAll('a[href^="http"]').forEach(el => {
            // Nur externe Links (nicht eigene Domain)
            if (!el.href.includes(window.location.hostname)) {
                el.addEventListener('click', () => {
                    AnalyticsTracker.externalLinkClick(el.href, window.location.pathname);
                });
            }
        });
    },

    /**
     * Newsletter-Formulare tracken
     */
    trackNewsletterForms() {
        const formSelectors = [
            'form[data-newsletter]',
            '.newsletter-form',
            'form[action*="newsletter"]',
            'form[action*="subscribe"]'
        ];

        document.querySelectorAll(formSelectors.join(', ')).forEach(form => {
            const location = form.dataset.location || this.getFormLocation(form);

            // View Event (einmal pro Session)
            const viewKey = `newsletter_view_${location}`;
            if (!sessionStorage.getItem(viewKey)) {
                AnalyticsTracker.newsletterView(location);
                sessionStorage.setItem(viewKey, '1');
            }

            // Submit Event
            form.addEventListener('submit', () => {
                AnalyticsTracker.newsletterSignup(location);
            });
        });
    },

    /**
     * Quiz-Interaktionen tracken
     */
    trackQuizzes() {
        // Quiz-Start Buttons
        document.querySelectorAll('[data-quiz-start], .quiz-start').forEach(el => {
            el.addEventListener('click', () => {
                const quizType = el.dataset.quizType || 'default';
                AnalyticsTracker.quizStarted(quizType);
            });
        });

        // Quiz-Ende (muss manuell aufgerufen werden)
        window.trackQuizComplete = (quizType, result) => {
            AnalyticsTracker.quizCompleted(quizType, result);
        };
    },

    /**
     * Related Post Klicks tracken
     */
    trackRelatedPosts() {
        document.querySelectorAll('.related-posts a, [data-related-post]').forEach(el => {
            el.addEventListener('click', () => {
                const fromSlug = ScrollTracker?.slug || window.location.pathname;
                const toSlug = el.dataset.slug || el.href.split('/').pop().replace('.html', '');
                AnalyticsTracker.relatedPostClick(fromSlug, toSlug);
            });
        });
    },

    /**
     * Formular-Position ermitteln
     */
    getFormLocation(form) {
        if (form.closest('footer')) return 'footer';
        if (form.closest('header')) return 'header';
        if (form.closest('.sidebar')) return 'sidebar';
        if (form.closest('article')) return 'article';
        return 'page';
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    LeadFunnelTracker.init();
    LeadFunnelTracker.trackRelatedPosts();
});

console.log('✓ analytics/lead-funnel.js geladen');
