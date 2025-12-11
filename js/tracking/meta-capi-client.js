/**
 * Meta Conversion API - Client-Side Helper
 * Sendet Events an Server-API für dedupliziertes Tracking
 * ~80 Zeilen | Verwendung: Script einbinden, dann metaCAPI.track() nutzen
 */

const metaCAPI = (function() {
    // Config - ANPASSEN pro Projekt!
    const API_ENDPOINT = 'https://api-kathrin.91.99.177.238.nip.io/api/meta/track';

    /**
     * Generiert eindeutige Event-ID für Deduplizierung
     * Diese ID muss sowohl an Pixel als auch CAPI gesendet werden
     */
    function generateEventId(eventName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        return `${eventName}_${timestamp}_${random}`;
    }

    /**
     * Liest Meta Cookies (fbc, fbp) für besseres Matching
     */
    function getMetaCookies() {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});

        return {
            fbc: cookies._fbc || null,
            fbp: cookies._fbp || null
        };
    }

    /**
     * Sendet Event an CAPI (und optional auch an Pixel)
     * @param {string} eventName - PageView, Lead, Purchase, etc.
     * @param {Object} options - { userData, customData, sendToPixel }
     */
    async function track(eventName, options = {}) {
        const {
            userData = {},
            customData = {},
            sendToPixel = true
        } = options;

        // Event-ID generieren (für Deduplizierung)
        const eventId = generateEventId(eventName);

        // Meta Cookies hinzufügen
        const metaCookies = getMetaCookies();
        const enrichedUserData = {
            ...userData,
            ...metaCookies
        };

        // 1. An Server-CAPI senden
        try {
            await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_name: eventName,
                    event_id: eventId,
                    event_source_url: window.location.href,
                    user_data: enrichedUserData,
                    custom_data: customData
                })
            });
        } catch (error) {
            console.warn('Meta CAPI Error:', error);
        }

        // 2. Auch an Pixel senden (mit gleicher event_id für Deduplizierung)
        if (sendToPixel && typeof fbq === 'function') {
            fbq('track', eventName, customData, { eventID: eventId });
        }
    }

    // Public API
    return {
        track,
        generateEventId,
        getMetaCookies
    };
})();

// Beispiele:
// metaCAPI.track('PageView');
// metaCAPI.track('Lead', { userData: { email: 'test@test.de' }, customData: { content_name: 'Newsletter' } });
// metaCAPI.track('Purchase', { customData: { value: 99.00, currency: 'EUR' } });
