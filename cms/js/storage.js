/**
 * Local Storage Backup System
 * Offline-Backup und Wiederherstellung von Änderungen
 * @module storage
 */

import { state } from './state.js';

const BACKUP_KEY = 'cms_backup';
const BACKUP_TIME_KEY = 'cms_backup_time';
const TOKEN_KEY = 'github_token';

/**
 * Speichert aktuellen State in LocalStorage
 */
export function saveToLocalBackup() {
    const backup = {
        timestamp: Date.now(),
        page: state.currentPage,
        pendingChanges: state.pendingChanges,
        trash: state.trash,
        stickyNotes: state.stickyNotes,
        elementHistory: state.elementHistory,
        offlineQueue: state.offlineQueue
    };

    try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
        localStorage.setItem(BACKUP_TIME_KEY, new Date().toLocaleString('de'));
    } catch (e) {
        console.warn('LocalStorage Backup fehlgeschlagen:', e);
    }
}

/**
 * Lädt Backup aus LocalStorage
 * @returns {boolean} True wenn Backup wiederhergestellt wurde
 */
export function loadFromLocalBackup() {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) return false;

    try {
        const data = JSON.parse(backup);

        if (data.pendingChanges?.length > 0 || data.offlineQueue?.length > 0) {
            const backupTime = localStorage.getItem(BACKUP_TIME_KEY) || 'unbekannt';

            if (confirm(`Es gibt ein lokales Backup von ${backupTime}.\nMöchtest du es wiederherstellen?`)) {
                state.trash = data.trash || [];
                state.stickyNotes = data.stickyNotes || [];
                state.elementHistory = data.elementHistory || {};
                state.offlineQueue = data.offlineQueue || [];

                if (data.page && data.pendingChanges?.length > 0) {
                    state.pendingChanges = data.pendingChanges;
                    state.hasUnsavedChanges = true;
                    return true;
                }
            }
        }
    } catch (e) {
        console.error('Backup laden fehlgeschlagen:', e);
    }

    return false;
}

/**
 * Löscht lokales Backup
 */
export function clearLocalBackup() {
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(BACKUP_TIME_KEY);
}

/**
 * Token-Management (sessionStorage für Sicherheit)
 */
export const tokenStorage = {
    /**
     * Speichert Token in sessionStorage
     * @param {string} token - GitHub Token
     */
    save(token) {
        sessionStorage.setItem(TOKEN_KEY, token);
        // Sicherstellen dass kein Token in localStorage verbleibt
        localStorage.removeItem(TOKEN_KEY);
    },

    /**
     * Lädt Token aus sessionStorage (mit Migration von localStorage)
     * @returns {string|null} Token oder null
     */
    load() {
        let token = sessionStorage.getItem(TOKEN_KEY);

        // Migration von localStorage (einmalig)
        if (!token) {
            const oldToken = localStorage.getItem(TOKEN_KEY);
            if (oldToken) {
                sessionStorage.setItem(TOKEN_KEY, oldToken);
                localStorage.removeItem(TOKEN_KEY);
                token = oldToken;
                console.log('Token von localStorage zu sessionStorage migriert');
            }
        }

        return token;
    },

    /**
     * Entfernt Token
     */
    clear() {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }
};

/**
 * Page Cache für schnelleres Laden
 */
export const pageCache = new Map();

/**
 * Speichert Seite im Cache
 * @param {string} page - Seitenname
 * @param {string} content - Seiteninhalt
 */
export function cachePage(page, content) {
    pageCache.set(page, content);
}

/**
 * Holt Seite aus Cache
 * @param {string} page - Seitenname
 * @returns {string|undefined}
 */
export function getCachedPage(page) {
    return pageCache.get(page);
}
