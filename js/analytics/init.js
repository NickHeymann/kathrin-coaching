/* analytics/init.js
 * Analytics Bundle Loader | ~40 Zeilen
 * Dieses Script in alle HTML-Seiten einbinden
 */

(function() {
    'use strict';

    // Umami Script laden (async, non-blocking)
    const umamiScript = document.createElement('script');
    umamiScript.defer = true;
    umamiScript.dataset.websiteId = ''; // Nach Setup eintragen
    umamiScript.src = 'https://analytics.kathrinstahl.com/script.js';
    document.head.appendChild(umamiScript);

    // Analytics Module laden nach DOM ready
    function loadAnalyticsModules() {
        const modules = [
            'js/analytics/config.js',
            'js/analytics/tracker.js',
            'js/analytics/scroll-tracker.js',
            'js/analytics/lead-funnel.js'
        ];

        modules.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            document.body.appendChild(script);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAnalyticsModules);
    } else {
        loadAnalyticsModules();
    }
})();
