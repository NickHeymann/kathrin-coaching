/**
 * Event Handlers Setup Module
 * Initialisiert DOM-Event-Listener für Editor-Komponenten
 * @module event-handlers
 */

import { state } from './state.js';
import { handleImageFile } from './image-editor.js';
import { handleVideoFile } from './video-editor.js';
import { handleBackgroundFile } from './background-editor.js';

/**
 * Event-Handler Setup
 * Wird beim App-Start aufgerufen
 */
export function setupEventHandlers(setupToken, loadPage) {
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
            loadPage(e.target.value);
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

    // Video Recording Settings (CSP-safe)
    const recordCam = document.getElementById('recordCam');
    if (recordCam) {
        recordCam.addEventListener('change', (e) => {
            if (typeof window.CMS?.toggleWebcamPreview === 'function') {
                window.CMS.toggleWebcamPreview(e.target.checked);
            }
        });
    }

    const camResolution = document.getElementById('camResolution');
    if (camResolution) {
        camResolution.addEventListener('change', () => {
            if (typeof window.CMS?.updatePreviewResolution === 'function') {
                window.CMS.updatePreviewResolution();
            }
        });
    }

    const bgBlur = document.getElementById('bgBlur');
    if (bgBlur) {
        bgBlur.addEventListener('change', (e) => {
            if (typeof window.CMS?.toggleBackgroundBlur === 'function') {
                window.CMS.toggleBackgroundBlur(e.target.checked);
            }
        });
    }
}
