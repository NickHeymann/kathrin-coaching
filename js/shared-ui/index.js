/**
 * Shared UI - Index Module
 * Zeilen: ~35 | Verantwortung: Initialisierung
 * @version 2.0.0 (Modular)
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
 *
 * GESAMT: ~635 Zeilen (modular) vs. 1,168 Zeilen (monolithisch)
 * VORTEIL: Jedes Modul <200 Zeilen = LLM-freundlich
 * ============================================
 */

(function(SharedUI) {
    'use strict';

    SharedUI.init = function() {
        if (SharedUI.tooltips) SharedUI.tooltips.init();
        if (SharedUI.mobileSidebar) SharedUI.mobileSidebar.init();
        if (SharedUI.keyboard) SharedUI.keyboard.init();

        // Offline Status nur wenn gewünscht
        if (document.body.dataset.showSyncStatus !== 'false' && SharedUI.offlineStatus) {
            SharedUI.offlineStatus.init();
        }

        console.log('SharedUI initialized (modular)');
    };

    // Auto-Init wenn DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SharedUI.init());
    } else {
        SharedUI.init();
    }

})(window.SharedUI = window.SharedUI || {});
