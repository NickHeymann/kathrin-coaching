/* analytics/scroll-tracker.js
 * Scroll-Depth & Read-Time Tracking | ~100 Zeilen
 */

const ScrollTracker = {
    milestones: ANALYTICS_CONFIG?.scrollMilestones || [25, 50, 75, 100],
    reached: new Set(),
    slug: null,
    startTime: null,
    isActive: false,

    /**
     * Tracker für einen Artikel initialisieren
     */
    init(articleSlug) {
        if (!articleSlug) {
            console.warn('ScrollTracker: Kein Artikel-Slug angegeben');
            return;
        }

        this.slug = articleSlug;
        this.startTime = Date.now();
        this.reached.clear();
        this.isActive = true;

        // Event Listeners
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        window.addEventListener('beforeunload', this.sendReadTime.bind(this));
        document.addEventListener('visibilitychange', this.handleVisibility.bind(this));

        if (ANALYTICS_CONFIG?.debug) {
            console.log(`📜 ScrollTracker gestartet für: ${articleSlug}`);
        }
    },

    /**
     * Scroll-Event Handler
     */
    handleScroll() {
        if (!this.isActive) return;

        const scrollPercent = this.calculateScrollPercent();

        this.milestones.forEach(milestone => {
            if (scrollPercent >= milestone && !this.reached.has(milestone)) {
                this.reached.add(milestone);
                AnalyticsTracker.scrollDepth(this.slug, milestone);

                if (milestone === 100) {
                    AnalyticsTracker.articleFinished(this.slug);
                }
            }
        });
    },

    /**
     * Scroll-Prozent berechnen
     */
    calculateScrollPercent() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollTop = window.scrollY;

        // Artikel-Container berücksichtigen falls vorhanden
        const articleEl = document.querySelector('.article-content, article, main');
        if (articleEl) {
            const articleRect = articleEl.getBoundingClientRect();
            const articleBottom = articleRect.bottom + scrollTop;
            return Math.min(100, Math.round((scrollTop + winHeight) / articleBottom * 100));
        }

        return Math.min(100, Math.round((scrollTop + winHeight) / docHeight * 100));
    },

    /**
     * Tab-Wechsel behandeln
     */
    handleVisibility() {
        if (document.hidden) {
            this.sendReadTime();
        }
    },

    /**
     * Lesezeit senden
     */
    sendReadTime() {
        if (!this.isActive || !this.startTime) return;

        const seconds = Math.round((Date.now() - this.startTime) / 1000);
        const minTime = ANALYTICS_CONFIG?.minReadTimeSeconds || 5;

        if (seconds >= minTime) {
            AnalyticsTracker.readTime(this.slug, seconds);
        }
    },

    /**
     * Tracker stoppen und aufräumen
     */
    destroy() {
        this.sendReadTime();
        this.isActive = false;
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('beforeunload', this.sendReadTime);
        document.removeEventListener('visibilitychange', this.handleVisibility);
    }
};

// Auto-Init für Blog-Artikel
document.addEventListener('DOMContentLoaded', () => {
    // Prüfe ob wir auf einer Blog-Seite sind
    const articleMeta = document.querySelector('[data-article-slug]');
    if (articleMeta) {
        ScrollTracker.init(articleMeta.dataset.articleSlug);
    } else if (window.location.pathname.includes('/blog/')) {
        // Fallback: Slug aus URL
        const slug = window.location.pathname.split('/').pop().replace('.html', '');
        if (slug && slug !== 'blog') {
            ScrollTracker.init(slug);
        }
    }
});

console.log('✓ analytics/scroll-tracker.js geladen');
