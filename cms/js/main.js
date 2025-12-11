/**
 * Website Editor - Main Entry Point
 * Initialisiert alle Module und stellt globale API bereit
 * @module main
 */

// Core Imports
import { CONFIG } from './config.js';
import { state } from './state.js';
import { tokenStorage, saveToLocalBackup, loadFromLocalBackup } from './storage.js';
import { github } from './github-api.js';
import { isValidTokenFormat } from './security.js';

// UI Imports
import { toast, showLoading, showSetupScreen, closeAllPopups, domReady } from './ui.js';

// Editor Imports
import { loadPage, preloadPages } from './page-loader.js';
import { setupFrameEditing } from './frame-setup.js';
import { undo, redo } from './text-editor.js';
import { closeImageModal, confirmImage } from './image-editor.js';
import { closeVideoModal, confirmVideo, switchVideoTab } from './video-editor.js';
import { closeBackgroundModal, confirmBackground } from './background-editor.js';
import { closeColorModal, confirmSectionColor, updateGradientColor } from './section-color-editor.js';

// Feature Imports
import { startAutosave, saveNow, setupOfflineDetection } from './autosave.js';
import { loadVersions, toggleVersionsSidebar, selectVersion, closeSidebar } from './versions.js';
import { createStickyNote, removeStickyNote, toggleNotesSidebar, filterNotes, scrollToNote, updateNoteText, toggleNoteMinimize } from './notes.js';
import { setupKeyboardShortcuts } from './keyboard.js';
import { initEmojiPicker, initColorPicker, formatText, setTextColor, insertEmoji, showColorPicker, showEmojiPicker } from './format-toolbar.js';
import { createNoteFromContext, showElementHistoryFromContext, restoreElementValue, editBackgroundFromContext } from './context-menu.js';
import { toggleRecording, closeRecordModal, startRecording, stopRecording, discardRecording, saveRecording, showRecordSettings, toggleWebcamPreview, updatePreviewResolution, initRecordingControls, toggleBackgroundBlur, updateBlurStrength, setupPipInteraction } from './video-recording.js';

// Setup Imports
import { setupEventHandlers } from './event-handlers.js';
import { initSharedUI, renderRecentItems, toggleRecentDropdown, selectRecentItem, addToRecentItems } from './shared-ui-init.js';

/**
 * Globales CMS-Objekt für HTML-onclick-Handler
 */
window.CMS = {
    // Page Loading
    loadPage: (page) => {
        loadPage(page, true, setupFrameEditing);
        addToRecentItems(page);
    },
    forceReload: () => loadPage(state.currentPage, true, setupFrameEditing),

    // Saving
    saveNow,

    // Text Editing
    undo,
    redo,

    // Image Modal
    closeImgModal: closeImageModal,
    confirmImg: confirmImage,

    // Video Modal
    closeVideoModal,
    confirmVideo,
    switchVideoTab,

    // Background Image Modal
    closeBgModal: closeBackgroundModal,
    confirmBg: confirmBackground,

    // Section Color Modal
    closeColorModal,
    confirmSectionColor,
    updateGradientColor,

    // Versions
    showVersions: toggleVersionsSidebar,
    selectVersion,
    closeSidebar,

    // Notes
    createStickyNote,
    removeStickyNote,
    toggleNotesSidebar,
    filterNotes,
    scrollToNote,
    updateNoteText,
    toggleNoteMinimize,

    // Context Menu
    createNoteFromContext,
    showElementHistoryFromContext,
    restoreElementValue,
    editBackgroundFromContext,

    // Format Toolbar
    formatText,
    setTextColor,
    insertEmoji,
    showColorPicker,
    showEmojiPicker,

    // Video Recording
    toggleRecording,
    closeRecordModal,
    startRecording,
    stopRecording,
    discardRecording,
    saveRecording,
    showRecordSettings,
    toggleWebcamPreview,
    updatePreviewResolution,
    toggleBackgroundBlur,
    updateBlurStrength,

    // Feedback Dropdown
    toggleFeedbackDropdown: () => {
        const dropdown = document.getElementById('feedbackDropdown');
        if (dropdown) dropdown.classList.toggle('open');
    },
    closeFeedbackDropdown: () => {
        const dropdown = document.getElementById('feedbackDropdown');
        if (dropdown) dropdown.classList.remove('open');
    },

    // UI
    closeAllPopups,
    toast,

    // Auth
    logout: async () => {
        tokenStorage.clear();
        state.token = null;
        if (typeof window.supabase !== 'undefined') {
            try {
                await window.supabase.auth.signOut();
            } catch (e) {}
        }
        window.location.href = '../admin/';
    },

    // Recent Items
    toggleRecentDropdown: () => {
        toggleRecentDropdown();
        if (document.getElementById('recentDropdown')?.classList.contains('open')) {
            renderRecentItems();
        }
    },
    selectRecentItem: (pageId) => selectRecentItem(pageId, (page) => loadPage(page, true, setupFrameEditing)),

    // History Panel
    toggleHistoryPanel: () => {
        if (typeof window.SharedUI !== 'undefined') {
            window.SharedUI.historyPanel.toggle();
        }
    }
};

/**
 * Prüft und lädt Token (async für Supabase-Unterstützung)
 */
async function checkSetup() {
    const savedToken = await tokenStorage.loadAsync();

    if (savedToken) {
        state.token = savedToken;
        showSetupScreen(false);
        startEditor();
    }
}

/**
 * Setup mit neuem Token
 */
async function setupToken() {
    const input = document.getElementById('tokenInput');
    const token = input?.value?.trim();

    if (!token) {
        toast('Bitte Token eingeben', 'error');
        return;
    }

    if (!isValidTokenFormat(token)) {
        toast('Ungültiges Token-Format. GitHub Tokens beginnen mit ghp_ oder github_pat_', 'error');
        return;
    }

    const btn = document.getElementById('setupBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Prüfe Token...';
    }

    try {
        state.token = token;

        const isValid = await github.validateAccess();
        if (!isValid) {
            throw new Error('Invalid token');
        }

        tokenStorage.save(token);
        showSetupScreen(false);
        toast('Erfolgreich eingerichtet!', 'success');
        startEditor();

    } catch (e) {
        toast('Token ungültig oder keine Berechtigung', 'error');
        state.token = null;
    }

    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Editor starten';
    }
}

/**
 * Startet den Editor
 */
function startEditor() {
    loadVersions();
    startAutosave();
    preloadPages();
    loadFromLocalBackup();
    setupOfflineDetection();
    setupKeyboardShortcuts();
    initEmojiPicker();
    initColorPicker();
    initRecordingControls();
    setupPipInteraction();
    initSharedUI();

    // Regelmäßiges lokales Backup
    setInterval(saveToLocalBackup, CONFIG.localBackupInterval);

    // Schließe Feedback-Dropdown bei Klick außerhalb
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.feedback-dropdown')) {
            window.CMS.closeFeedbackDropdown();
        }
    });
}

/**
 * App-Initialisierung
 */
async function init() {
    await domReady();

    setupEventHandlers(setupToken, (page) => loadPage(page, true, setupFrameEditing));
    await checkSetup();
}

// App starten
init();
