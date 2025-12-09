/**
 * UI Utilities
 * Toast-Notifications, Status-Updates, DOM-Helper
 * @module ui
 */

import { state } from './state.js';
import { escapeHtml } from './security.js';

/**
 * Zeigt Toast-Notification
 * @param {string} message - Nachricht
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {number} duration - Anzeigedauer in ms
 */
export function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 200);
    }, duration);
}

/**
 * Aktualisiert Status-Badge und Autosave-Indikator
 * @param {string} status - 'saved' | 'unsaved' | 'saving' | 'error'
 */
export function updateStatus(status) {
    const badge = document.getElementById('statusBadge');
    const dot = document.getElementById('autosaveDot');
    const text = document.getElementById('autosaveText');

    if (!badge) return;

    badge.className = 'status-badge';
    if (dot) dot.className = 'autosave-dot';

    const statusConfig = {
        saved: {
            badgeClass: 'status-saved',
            badgeText: 'Gespeichert',
            autosaveText: 'Autosave aktiv'
        },
        unsaved: {
            badgeClass: 'status-unsaved',
            badgeText: `${state.pendingChanges.length} Änderung${state.pendingChanges.length > 1 ? 'en' : ''}`,
            autosaveText: 'Nicht gespeichert'
        },
        saving: {
            badgeClass: 'status-saving',
            badgeText: 'Speichert...',
            autosaveText: 'Speichert...',
            dotClass: 'saving'
        },
        error: {
            badgeClass: 'status-error',
            badgeText: 'Fehler',
            autosaveText: 'Speichern fehlgeschlagen'
        }
    };

    const config = statusConfig[status];
    if (!config) return;

    badge.classList.add(config.badgeClass);
    badge.textContent = config.badgeText;

    if (text) text.textContent = config.autosaveText;
    if (dot && config.dotClass) dot.classList.add(config.dotClass);
}

/**
 * Aktualisiert die Änderungsliste in der Sidebar
 */
export function updateChangesList() {
    const container = document.getElementById('changesList');
    if (!container) return;

    if (state.pendingChanges.length === 0) {
        container.innerHTML = '<p style="color:#999;font-size:0.85rem;">Keine ausstehenden Änderungen</p>';
        return;
    }

    container.innerHTML = state.pendingChanges
        .slice(-10)
        .reverse()
        .map(c => {
            const typeClass = c.type === 'image' ? 'image' : c.type === 'video' ? 'video' : '';
            const preview = c.type === 'text'
                ? escapeHtml(c.newVal?.substring(0, 50) || '')
                : c.type === 'image'
                    ? `Neues Bild: ${escapeHtml(c.newFile || '')}`
                    : c.type === 'video'
                        ? 'Video geändert'
                        : escapeHtml(c.newVal?.substring(0, 50) || '');

            return `
                <div class="change-item ${typeClass}">
                    <div class="change-type">${escapeHtml(c.type)}</div>
                    <div class="change-preview">${preview}</div>
                </div>
            `;
        })
        .join('');
}

/**
 * Zeigt/Versteckt Loading-Overlay
 * @param {boolean} show - Anzeigen oder verstecken
 */
export function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
}

/**
 * Zeigt/Versteckt Start-Screen
 * @param {boolean} show - Anzeigen oder verstecken
 */
export function showStartScreen(show) {
    const screen = document.getElementById('startScreen');
    if (screen) {
        screen.classList.toggle('hidden', !show);
    }
}

/**
 * Zeigt/Versteckt Setup-Screen
 * @param {boolean} show - Anzeigen oder verstecken
 */
export function showSetupScreen(show) {
    const screen = document.getElementById('setupScreen');
    if (screen) {
        screen.classList.toggle('hidden', !show);
    }
}

/**
 * Schließt alle Popups
 */
export function closeAllPopups() {
    const popupIds = [
        'colorPicker',
        'emojiPicker',
        'formatToolbar',
        'elementHistory',
        'trashPanel'
    ];

    popupIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
}

/**
 * DOM-Ready Promise
 * @returns {Promise}
 */
export function domReady() {
    return new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
}

/**
 * Holt DOM-Element mit null-Check
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
export function $(id) {
    return document.getElementById(id);
}
