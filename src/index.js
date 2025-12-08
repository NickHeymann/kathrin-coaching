/**
 * Kathrin Coaching CMS - Main Entry Point
 *
 * This module exports all shared utilities and components
 * for use across the CMS editor, blog editor, and studio.
 */

// Utilities
export { escapeHtml, utf8ToBase64, base64ToUtf8, isValidGitHubToken, sanitizeFilename } from './utils/security.js';
export { RateLimiter, apiRateLimiter } from './utils/rate-limiter.js';
export { $, $$, createElement, clearElement, show, hide, toggle, on, delegate } from './utils/dom.js';
export { localStore, sessionStore, tokenStorage } from './utils/storage.js';

// Configuration
export { CONFIG, getRawUrl, getCdnUrl, getApiUrl } from './modules/config.js';

// GitHub API
export { github } from './modules/github-api.js';

// State Management
export { createStore, editorState, blogState, appState, actions, persistState } from './modules/state.js';

// UI Components
export { toast, success, error, warning, info, clearAll as clearToasts } from './modules/ui/toast.js';
export { openModal, closeModal, confirm, alert, prompt } from './modules/ui/modal.js';
export { setLoading, updateStatus } from './modules/ui/index.js';

/**
 * Initialize the application
 * Sets up global error handling and common functionality
 */
export function initApp() {
    // Global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        // Could show error toast here
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        // Could show error toast here
    });

    // Online/Offline status
    window.addEventListener('online', () => {
        document.body.classList.remove('is-offline');
    });

    window.addEventListener('offline', () => {
        document.body.classList.add('is-offline');
    });

    // Initial offline state
    if (!navigator.onLine) {
        document.body.classList.add('is-offline');
    }

    // CMS initialized
}

// Version info
export const VERSION = '2.0.0';
export const BUILD_DATE = new Date().toISOString().split('T')[0];
