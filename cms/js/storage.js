/**
 * Local Storage Backup System
 * Offline-Backup und Wiederherstellung von Änderungen
 * @module storage
 */

import { state } from './state.js';

const BACKUP_KEY = 'cms_backup';
const BACKUP_TIME_KEY = 'cms_backup_time';
const TOKEN_KEY = 'cms_encrypted_token';
const TOKEN_KEY_OLD = 'github_token';

/**
 * Einfache XOR-Verschlüsselung für lokale Token-Speicherung
 * (Kein Ersatz für echte Kryptografie, aber verhindert direktes Auslesen)
 */
const crypto = {
    /**
     * Generiert einen geräte-spezifischen Schlüssel
     */
    getDeviceKey() {
        const parts = [
            navigator.userAgent.slice(0, 50),
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset().toString()
        ];
        return parts.join('|');
    },

    /**
     * XOR-Verschlüsselung
     */
    xorEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(result);
    },

    /**
     * XOR-Entschlüsselung
     */
    xorDecrypt(encoded, key) {
        try {
            const text = atob(encoded);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(
                    text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            return result;
        } catch {
            return null;
        }
    }
};

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
 * Token-Management mit verschlüsselter localStorage-Speicherung
 * Der Token wird mit einem geräte-spezifischen Schlüssel verschlüsselt,
 * sodass er auf einem anderen Gerät nicht verwendbar ist.
 */
export const tokenStorage = {
    /**
     * Speichert Token verschlüsselt in localStorage
     * @param {string} token - GitHub Token
     */
    save(token) {
        const key = crypto.getDeviceKey();
        const encrypted = crypto.xorEncrypt(token, key);
        localStorage.setItem(TOKEN_KEY, encrypted);

        // Alte Schlüssel aufräumen
        sessionStorage.removeItem(TOKEN_KEY_OLD);
        localStorage.removeItem(TOKEN_KEY_OLD);
    },

    /**
     * Lädt und entschlüsselt Token aus localStorage (synchron)
     * @returns {string|null} Token oder null
     */
    load() {
        const key = crypto.getDeviceKey();

        // Versuche verschlüsselten Token zu laden
        const encrypted = localStorage.getItem(TOKEN_KEY);
        if (encrypted) {
            const token = crypto.xorDecrypt(encrypted, key);
            // Validiere dass es ein gültiger Token ist
            if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
                return token;
            }
        }

        // Migration von alten Speicherorten (einmalig)
        const oldTokenSession = sessionStorage.getItem(TOKEN_KEY_OLD);
        const oldTokenLocal = localStorage.getItem(TOKEN_KEY_OLD);
        const oldToken = oldTokenSession || oldTokenLocal;

        if (oldToken && (oldToken.startsWith('ghp_') || oldToken.startsWith('github_pat_'))) {
            // Migriere zu neuer verschlüsselter Speicherung
            this.save(oldToken);
            sessionStorage.removeItem(TOKEN_KEY_OLD);
            localStorage.removeItem(TOKEN_KEY_OLD);
            return oldToken;
        }

        return null;
    },

    /**
     * Lädt Token aus Supabase (falls eingeloggt) oder localStorage
     * @returns {Promise<string|null>} Token oder null
     */
    async loadAsync() {
        // Versuche zuerst von Supabase zu laden (falls auth-check.js geladen)
        if (typeof window.loadGithubToken === 'function') {
            try {
                const supabaseToken = await window.loadGithubToken();
                if (supabaseToken) {
                    return supabaseToken;
                }
            } catch (e) {
                console.warn('Supabase Token-Loading fehlgeschlagen:', e);
            }
        }

        // Fallback: localStorage
        return this.load();
    },

    /**
     * Entfernt Token aus allen Speicherorten
     */
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY_OLD);
        localStorage.removeItem(TOKEN_KEY_OLD);
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
