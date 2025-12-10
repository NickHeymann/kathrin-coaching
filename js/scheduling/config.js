/* scheduling/config.js
 * Kalender & Scheduling Konfiguration | ~40 Zeilen
 */

const SCHEDULING_CONFIG = {
    // API Endpoint
    apiUrl: 'https://analytics.kathrinstahl.com/api',

    // Fallback für lokale Entwicklung
    localApiUrl: 'http://localhost:3001/api',

    // Status-Farben
    statusColors: {
        scheduled: '#22c55e',   // Grün - wird veröffentlicht
        draft: '#eab308',       // Gelb - Entwurf
        idea: '#3b82f6',        // Blau - Idee/Notiz
        published: '#8b5cf6',   // Lila - bereits veröffentlicht
        failed: '#ef4444'       // Rot - Fehler
    },

    // Status-Labels
    statusLabels: {
        scheduled: 'Geplant',
        draft: 'Entwurf',
        idea: 'Idee',
        published: 'Veröffentlicht',
        failed: 'Fehlgeschlagen'
    },

    // Wochentage (Montag zuerst)
    weekDays: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],

    // Monate
    months: [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ],

    // Auto-Publish Zeit
    publishTime: '09:00'
};

console.log('✓ scheduling/config.js geladen');
