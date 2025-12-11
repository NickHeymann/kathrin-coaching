/* blog-editor-core.js
 * Core Editor Initialization
 * Zeilen: ~50 | Verantwortung: Init & Orchestration
 *
 * MODULARE ARCHITEKTUR (Stand: Dezember 2024)
 * ============================================
 * Dieses Modul orchestriert folgende Sub-Module:
 *
 * - blog-editor-config.js    (~55 Z.)  Config & State
 * - blog-editor-utils.js     (~100 Z.) Helper Functions
 * - blog-editor-github.js    (~120 Z.) GitHub API
 * - blog-editor-drafts.js    (~280 Z.) Drafts & Posts
 * - blog-editor-versions.js  (~180 Z.) Version History
 * - blog-editor-publish.js   (~290 Z.) Publishing & Queue
 * - blog-editor-toolbar.js   (~290 Z.) Editor Commands
 * - blog-editor-media.js     (~250 Z.) Images & Fonts
 * - blog-editor-ui.js        (~220 Z.) Events & Mobile
 * - blog-editor-export.js    (~280 Z.) Markdown/PDF Export
 * - blog-editor-ai.js        (~350 Z.) AI Features
 * - blog-editor-video.js     (~280 Z.) Video Recording
 * - blog-editor-blocks.js    (~350 Z.) Block System
 *
 * GESAMT: ~3,045 Zeilen (modular) vs. 2,350 Zeilen (monolithisch)
 * VORTEIL: Jedes Modul <300 Zeilen = LLM-freundlich
 */

// ============================================
// INIT
// ============================================

function initEditor() {
    console.log('Blog-Editor wird initialisiert...');

    // Core-Funktionen laden
    loadDrafts();
    loadQueue();
    loadVersions();
    loadCustomFonts();

    // UI Setup
    setupCategoryTags();
    setupEventListeners();

    // Autosave starten
    startAutosave();

    // Stats aktualisieren
    updateStats();

    console.log('Blog-Editor bereit!');
}

// ============================================
// HELPER: Date/Time Formatierung
// ============================================

function formatDateTime(date) {
    if (typeof date === 'string') date = new Date(date);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// HELPER: Tab-Wechsel
// ============================================

function showTab(tab) {
    switchTab(tab);
}

// ============================================
// HELPER: Block-Settings (Placeholder für blocks.js)
// ============================================

function closeBlockSettings() {
    const modal = document.getElementById('blockSettingsModal');
    if (modal) modal.classList.remove('open');
}

function hideBlockMenu() {
    const menu = document.getElementById('blockTypeMenu');
    if (menu) menu.classList.remove('visible');
}
