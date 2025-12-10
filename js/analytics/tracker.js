/* analytics/tracker.js
 * Custom Event Tracking für Umami | ~150 Zeilen
 */

const AnalyticsTracker = {
    /**
     * Initialisierung
     */
    init() {
        if (typeof umami === 'undefined') {
            if (ANALYTICS_CONFIG.debug) {
                console.warn('Umami nicht geladen - Events werden geloggt');
            }
            return;
        }
        this.trackPageView();
    },

    /**
     * Basis Page View
     */
    trackPageView() {
        if (typeof umami !== 'undefined') {
            umami.track();
        }
    },

    /**
     * Generisches Event senden
     */
    track(eventName, data = {}) {
        if (typeof umami !== 'undefined') {
            umami.track(eventName, data);
        }
        if (ANALYTICS_CONFIG.debug) {
            console.log(`📊 Event: ${eventName}`, data);
        }
    },

    // ==========================================
    // Blog-spezifische Events
    // ==========================================

    /**
     * Artikel wurde gelesen (Page View)
     */
    articleRead(slug, title, category) {
        this.track('article_read', { slug, title, category });
    },

    /**
     * Scroll-Tiefe erreicht (25%, 50%, 75%, 100%)
     */
    scrollDepth(slug, percent) {
        this.track('scroll_depth', { slug, percent: `${percent}%` });
    },

    /**
     * Lesezeit am Ende
     */
    readTime(slug, seconds) {
        this.track('read_time', { slug, seconds, minutes: Math.round(seconds / 60) });
    },

    /**
     * Artikel zu Ende gelesen
     */
    articleFinished(slug) {
        this.track('article_finished', { slug });
    },

    // ==========================================
    // Lead-Funnel Events
    // ==========================================

    /**
     * CTA Button geklickt
     */
    ctaClicked(ctaType, fromPage) {
        this.track('cta_click', { type: ctaType, from: fromPage });
    },

    /**
     * Buchung gestartet
     */
    bookingStarted(service) {
        this.track('booking_started', { service });
    },

    /**
     * Buchung abgeschlossen
     */
    bookingCompleted(service) {
        this.track('booking_completed', { service });
    },

    /**
     * Quiz gestartet
     */
    quizStarted(quizType) {
        this.track('quiz_started', { type: quizType });
    },

    /**
     * Quiz abgeschlossen
     */
    quizCompleted(quizType, result) {
        this.track('quiz_completed', { type: quizType, result });
    },

    // ==========================================
    // Newsletter Events
    // ==========================================

    /**
     * Newsletter-Formular angezeigt
     */
    newsletterView(formLocation) {
        this.track('newsletter_view', { location: formLocation });
    },

    /**
     * Newsletter angemeldet
     */
    newsletterSignup(formLocation) {
        this.track('newsletter_signup', { location: formLocation });
    },

    // ==========================================
    // Engagement Events
    // ==========================================

    /**
     * Social Share geklickt
     */
    socialShare(platform, slug) {
        this.track('social_share', { platform, slug });
    },

    /**
     * Related Post angeklickt
     */
    relatedPostClick(fromSlug, toSlug) {
        this.track('related_click', { from: fromSlug, to: toSlug });
    },

    /**
     * Externer Link geklickt
     */
    externalLinkClick(url, fromPage) {
        this.track('external_click', { url, from: fromPage });
    },

    /**
     * Video abgespielt
     */
    videoPlay(videoId, title) {
        this.track('video_play', { videoId, title });
    },

    /**
     * Video zu Ende geschaut
     */
    videoComplete(videoId) {
        this.track('video_complete', { videoId });
    }
};

// Auto-Init wenn DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AnalyticsTracker.init());
} else {
    AnalyticsTracker.init();
}

console.log('✓ analytics/tracker.js geladen');
