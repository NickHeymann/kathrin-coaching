/**
 * CMS Editor State Management
 * Zentraler, reaktiver State für den Editor
 * @module state
 */

// State-Objekt mit Proxy für reaktive Updates
const initialState = {
    token: null,
    currentPage: null,
    changes: [],
    pendingChanges: [],
    images: [],
    versions: [],
    originalContent: {},
    fileSha: {},
    isSaving: false,
    hasUnsavedChanges: false,
    autosaveTimer: null,
    selectedVersion: null,
    trash: [],
    elementHistory: {},
    stickyNotes: [],
    undoStack: [],
    redoStack: [],
    isOffline: false,
    offlineQueue: [],
    isPreviewMode: false,
    isMobilePreview: false,
    feedbackItems: []
};

// Subscriber für State-Changes
const subscribers = new Set();

// Proxy-Handler für reaktive Updates
const handler = {
    set(target, property, value) {
        const oldValue = target[property];
        target[property] = value;

        // Notifiziere Subscriber bei Änderungen
        if (oldValue !== value) {
            notifySubscribers(property, value, oldValue);
        }
        return true;
    }
};

function notifySubscribers(property, newValue, oldValue) {
    subscribers.forEach(callback => {
        try {
            callback(property, newValue, oldValue);
        } catch (e) {
            console.error('State subscriber error:', e);
        }
    });
}

// Exportiere reaktiven State
export const state = new Proxy({ ...initialState }, handler);

/**
 * Registriert einen Subscriber für State-Änderungen
 * @param {Function} callback - Callback(property, newValue, oldValue)
 * @returns {Function} Unsubscribe-Funktion
 */
export function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

/**
 * Setzt den State auf Initialwerte zurück
 */
export function resetState() {
    Object.assign(state, initialState);
}

/**
 * Fügt eine Änderung zum pendingChanges-Array hinzu
 * @param {Object} change - Das Change-Objekt
 */
export function addPendingChange(change) {
    state.pendingChanges = [...state.pendingChanges, change];
    state.hasUnsavedChanges = true;
}

/**
 * Leert die pending Changes nach erfolgreichem Speichern
 */
export function clearPendingChanges() {
    state.changes = [...state.changes, ...state.pendingChanges];
    state.pendingChanges = [];
    state.hasUnsavedChanges = false;
}
