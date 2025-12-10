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

// Feature Imports
import { startAutosave, saveNow, setupOfflineDetection } from './autosave.js';
import { loadVersions, toggleVersionsSidebar, selectVersion, closeSidebar } from './versions.js';
import { createStickyNote, removeStickyNote, toggleNotesSidebar, filterNotes, scrollToNote, renderNoteMarkers, updateNoteText, toggleNoteMinimize } from './notes.js';
import { setupKeyboardShortcuts } from './keyboard.js';
import { initEmojiPicker, initColorPicker, formatText, setTextColor, insertEmoji, showColorPicker, showEmojiPicker, hideFormatToolbar } from './format-toolbar.js';
import { showContextMenu, hideContextMenu, createNoteFromContext, showElementHistoryFromContext, restoreElementValue } from './context-menu.js';
import { toggleRecording, closeRecordModal, startRecording, stopRecording, discardRecording, saveRecording, showRecordSettings, toggleWebcamPreview, updatePreviewResolution, initRecordingControls, toggleBackgroundBlur, updateBlurStrength } from './video-recording.js';

/**
 * Globales CMS-Objekt für HTML-onclick-Handler
 */
window.CMS = {
    // Page Loading
    loadPage: (page) => loadPage(page, true, setupFrameEditing),
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
    toast
};

/**
 * Prüft und lädt Token
 */
function checkSetup() {
    const savedToken = tokenStorage.load();

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
    checkSetup();
}

// App starten
init();

// Export für Tests
export { init, setupToken, startEditor };
