/* analytics/config.js
 * Umami Configuration | ~30 Zeilen
 */

const ANALYTICS_CONFIG = {
    // Umami Settings
    umamiUrl: 'https://analytics.kathrinstahl.com',
    websiteId: '', // Wird nach Umami-Setup eingetragen

    // Scheduling API
    schedulingApiUrl: 'https://analytics.kathrinstahl.com/api',

    // Scroll Tracking
    scrollMilestones: [25, 50, 75, 100],

    // Read Time
    minReadTimeSeconds: 5,

    // Debug Mode (nur Development)
    debug: window.location.hostname === 'localhost'
};

// Export für Module
if (typeof module !== 'undefined') {
    module.exports = ANALYTICS_CONFIG;
}

console.log('✓ analytics/config.js geladen');
