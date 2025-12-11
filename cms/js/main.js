/**
 * CMS Editor - Main Entry Point
 * Initialisiert alle Module und stellt globale API bereit
 * @module main
 */

// Core Imports
import { CONFIG } from './config.js';
import { state, subscribe } from './state.js';
import { tokenStorage, saveToLocalBackup, loadFromLocalBackup } from './storage.js';
import { github } from './github-api.js';
import { isValidTokenFormat } from './security.js';

// UI Imports
import { toast, updateStatus, updateChangesList, showLoading, showStartScreen, showSetupScreen, closeAllPopups, domReady } from './ui.js';

// Editor Imports
import { loadPage, preloadPages } from './page-loader.js';
import { setupFrameEditing } from './frame-setup.js';
import { editText, undo, redo } from './text-editor.js';
import { editImage, closeImageModal, handleImageFile, confirmImage } from './image-editor.js';
import { editVideo, closeVideoModal, handleVideoFile, confirmVideo, switchVideoTab } from './video-editor.js';
import { editBackground, closeBackgroundModal, handleBackgroundFile, confirmBackground } from './background-editor.js';
import { editSectionColor, closeColorModal, confirmSectionColor, updateGradientColor } from './section-color-editor.js';

// Feature Imports
import { startAutosave, saveNow, setupOfflineDetection } from './autosave.js';
import { loadVersions, toggleVersionsSidebar, selectVersion, closeSidebar } from './versions.js';
import { createStickyNote, removeStickyNote, toggleNotesSidebar, filterNotes, scrollToNote, renderNoteMarkers, updateNoteText, toggleNoteMinimize } from './notes.js';
import { setupKeyboardShortcuts } from './keyboard.js';
import { initEmojiPicker, initColorPicker, formatText, setTextColor, insertEmoji, showColorPicker, showEmojiPicker, hideFormatToolbar } from './format-toolbar.js';
import { showContextMenu, hideContextMenu, createNoteFromContext, showElementHistoryFromContext, restoreElementValue, editBackgroundFromContext } from './context-menu.js';
import { toggleRecording, closeRecordModal, startRecording, stopRecording, discardRecording, saveRecording, showRecordSettings, toggleWebcamPreview, updatePreviewResolution, initRecordingControls, toggleBackgroundBlur, updateBlurStrength } from './video-recording.js';

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
        // Falls Supabase Auth aktiv, auch dort ausloggen
        if (typeof window.supabase !== 'undefined') {
            try {
                await window.supabase.auth.signOut();
            } catch (e) {
                console.warn('Supabase logout fehlgeschlagen:', e);
            }
        }
        window.location.href = '../admin/';
    },

    // Recent Items Dropdown
    toggleRecentDropdown: () => {
        const dropdown = document.getElementById('recentDropdown');
        if (dropdown) {
            dropdown.classList.toggle('open');
            if (dropdown.classList.contains('open')) {
                renderRecentItems();
            }
        }
    },

    // History Panel Toggle
    toggleHistoryPanel: () => {
        if (typeof window.SharedUI !== 'undefined') {
            window.SharedUI.historyPanel.toggle();
        }
    }
};

/**
 * Rendert die "Zuletzt bearbeitet" Liste
 */
function renderRecentItems() {
    if (typeof window.SharedUI === 'undefined') return;

    const container = document.getElementById('recentItemsContent');
    if (!container) return;

    window.SharedUI.recentItems.render(container, (pageId) => {
        window.CMS.loadPage(pageId);
        document.getElementById('recentDropdown')?.classList.remove('open');
        // Update select
        const select = document.getElementById('pageSelect');
        if (select) select.value = pageId;
    });
}

/**
 * Fügt Seite zu "Zuletzt bearbeitet" hinzu
 */
function addToRecentItems(page) {
    if (typeof window.SharedUI === 'undefined' || !page) return;

    const pageNames = {
        'index.html': 'Startseite',
        'kathrin.html': 'Über mich',
        'paar-retreat.html': 'Paar-Retreat',
        'pferdegestuetztes-coaching.html': 'Pferdegestütztes Coaching',
        'casinha.html': 'Casinha',
        'quiz-hochsensibel.html': 'Quiz: Hochsensibel',
        'quiz-hochbegabt.html': 'Quiz: Hochbegabt',
        'quiz-beziehung.html': 'Quiz: Beziehung',
        'quiz-lebenskrise.html': 'Quiz: Lebenskrise',
        'quiz-midlife.html': 'Quiz: Midlife',
        'quiz-paar-kompass.html': 'Quiz: Paar-Kompass',
        'impressum.html': 'Impressum',
        'datenschutzerklaerung.html': 'Datenschutz'
    };

    window.SharedUI.recentItems.add({
        id: page,
        name: pageNames[page] || page,
        icon: page.startsWith('quiz-') ? '📝' : '📄'
    });
}

/**
 * Prüft und lädt Token (async für Supabase-Unterstützung)
 */
async function checkSetup() {
    // Versuche Token von Supabase oder localStorage zu laden
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

        // Test API-Zugriff
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
 * Initialisiert SharedUI Komponenten
 */
function initSharedUI() {
    if (typeof window.SharedUI === 'undefined') {
        console.warn('SharedUI not loaded');
        return;
    }

    // Recent Items Storage-Key für CMS (prüfe ob bereits geladen)
    if (window.SharedUI.recentItems) {
        window.SharedUI.recentItems.storageKey = 'cms_recent_pages';
    }

    // Füge "Zuletzt bearbeitet" Bereich zur Toolbar hinzu
    const pageSelect = document.getElementById('pageSelect');
    if (pageSelect) {
        const recentContainer = document.createElement('div');
        recentContainer.className = 'recent-items-dropdown';
        recentContainer.innerHTML = `
            <button class="btn btn-ghost recent-trigger" onclick="CMS.toggleRecentDropdown()">
                🕐 Zuletzt
            </button>
            <div class="recent-dropdown-menu" id="recentDropdown">
                <div class="recent-dropdown-content" id="recentItemsContent"></div>
            </div>
        `;
        pageSelect.parentNode.insertBefore(recentContainer, pageSelect.nextSibling);

        // Render recent items
        renderRecentItems();
    }

    // History Panel initialisieren
    window.SharedUI.historyPanel.init();
}

/**
 * Event-Handler Setup
 */
function setupEventHandlers() {
    // Setup Button
    const setupBtn = document.getElementById('setupBtn');
    if (setupBtn) {
        setupBtn.addEventListener('click', setupToken);
    }

    // Token Input Enter-Taste
    const tokenInput = document.getElementById('tokenInput');
    if (tokenInput) {
        tokenInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') setupToken();
        });
    }

    // Page Select
    const pageSelect = document.getElementById('pageSelect');
    if (pageSelect) {
        pageSelect.addEventListener('change', (e) => {
            window.CMS.loadPage(e.target.value);
        });
    }

    // Image Upload
    const imgInput = document.getElementById('imgInput');
    if (imgInput) {
        imgInput.addEventListener('change', (e) => {
            handleImageFile(e.target.files[0]);
        });
    }

    // Image Drag & Drop
    const imgUploadZone = document.getElementById('imgUploadZone');
    if (imgUploadZone) {
        imgUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            imgUploadZone.classList.add('dragover');
        });

        imgUploadZone.addEventListener('dragleave', () => {
            imgUploadZone.classList.remove('dragover');
        });

        imgUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            imgUploadZone.classList.remove('dragover');
            handleImageFile(e.dataTransfer.files[0]);
        });
    }

    // Video Upload
    const videoFileInput = document.getElementById('videoFileInput');
    if (videoFileInput) {
        videoFileInput.addEventListener('change', (e) => {
            handleVideoFile(e.target.files[0]);
        });
    }

    // Video Drag & Drop
    const videoUploadZone = document.getElementById('videoUploadZone');
    if (videoUploadZone) {
        videoUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            videoUploadZone.classList.add('dragover');
        });

        videoUploadZone.addEventListener('dragleave', () => {
            videoUploadZone.classList.remove('dragover');
        });

        videoUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            videoUploadZone.classList.remove('dragover');
            handleVideoFile(e.dataTransfer.files[0]);
        });
    }

    // Background Image Upload
    const bgInput = document.getElementById('bgInput');
    if (bgInput) {
        bgInput.addEventListener('change', (e) => {
            handleBackgroundFile(e.target.files[0]);
        });
    }

    // Background Drag & Drop
    const bgUploadZone = document.getElementById('bgUploadZone');
    if (bgUploadZone) {
        bgUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            bgUploadZone.classList.add('dragover');
        });

        bgUploadZone.addEventListener('dragleave', () => {
            bgUploadZone.classList.remove('dragover');
        });

        bgUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            bgUploadZone.classList.remove('dragover');
            handleBackgroundFile(e.dataTransfer.files[0]);
        });
    }

    // Beforeunload Warning
    window.addEventListener('beforeunload', (e) => {
        if (state.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

/**
 * App-Initialisierung
 */
async function init() {
    await domReady();

    console.log('CMS Editor v2.0 - Modular Edition');
    console.log('Modules loaded:', Object.keys(window.CMS).length, 'functions');

    setupEventHandlers();
    await checkSetup();
}

// App starten
init();

// Export für Tests
export { init, setupToken, startEditor };
