/**
 * Shared UI Components - Module Loader
 * BACKWARD COMPATIBILITY WRAPPER
 *
 * Diese Datei lädt die modularen JS-Dateien.
 * Alle Editoren referenzieren diese Datei.
 *
 * MODULARE ARCHITEKTUR (Stand: Dezember 2024)
 * ============================================
 * Siehe js/shared-ui/ für einzelne Module:
 * - offline-status.js  (~85 Z.)  Sync-Status-Anzeige
 * - modals.js          (~175 Z.) Error Recovery, Confirm, Progress
 * - tooltips.js        (~60 Z.)  Tooltip-System
 * - recent-items.js    (~65 Z.)  Letzte bearbeitete Elemente
 * - sidebar.js         (~45 Z.)  Mobile Sidebar
 * - history-panel.js   (~140 Z.) Undo/Redo-Verlauf
 * - keyboard.js        (~30 Z.)  Tastatur-Navigation
 * - index.js           (~35 Z.)  Initialisierung
 *
 * CSS Module in: css/components/shared-ui/
 * - base.css    (~185 Z.) Sync Status, Error Recovery, Animations
 * - modals.css  (~180 Z.) Tooltips, Confirm Modal, Upload Progress
 * - panels.css  (~175 Z.) Recent Items, Sidebar, History Panel
 *
 * GESAMT: ~635 JS + ~540 CSS Zeilen (modular) vs. 1,168 Zeilen (monolithisch)
 * VORTEIL: Jedes Modul <200 Zeilen = LLM-freundlich
 * ============================================
 * @version 2.0.0
 */

(function() {
    'use strict';

    // Globales SharedUI-Objekt initialisieren
    window.SharedUI = window.SharedUI || {};

    // Basis-Pfad ermitteln
    const currentScript = document.currentScript;
    const basePath = currentScript ?
        currentScript.src.substring(0, currentScript.src.lastIndexOf('/') + 1) :
        '/js/';

    // Module in Reihenfolge laden
    const modules = [
        'shared-ui/offline-status.js',
        'shared-ui/modals.js',
        'shared-ui/tooltips.js',
        'shared-ui/recent-items.js',
        'shared-ui/sidebar.js',
        'shared-ui/history-panel.js',
        'shared-ui/keyboard.js',
        'shared-ui/index.js'
    ];

    // CSS laden (falls nicht bereits via <link> eingebunden)
    function loadCSS() {
        const cssPath = basePath.replace('/js/', '/css/') + 'components/shared-ui.css';
        if (!document.querySelector(`link[href*="shared-ui.css"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        }
    }

    // JS-Module sequenziell laden
    function loadScripts(scripts, callback) {
        let index = 0;

        function loadNext() {
            if (index >= scripts.length) {
                if (callback) callback();
                return;
            }

            const script = document.createElement('script');
            script.src = basePath + scripts[index];
            script.onload = () => {
                index++;
                loadNext();
            };
            script.onerror = () => {
                console.error('Failed to load SharedUI module:', scripts[index]);
                index++;
                loadNext();
            };
            document.head.appendChild(script);
        }

        loadNext();
    }

    // Module laden
    loadCSS();
    loadScripts(modules, () => {
        console.log('SharedUI modules loaded');
    });

})();
