/**
 * State Management Module
 * Centralized state management with event-based updates
 */

import { localStore } from '../utils/storage.js';

/**
 * Creates an observable state store
 * @param {Object} initialState - Initial state object
 * @returns {Object} State store with get, set, subscribe methods
 */
export function createStore(initialState = {}) {
    let state = { ...initialState };
    const listeners = new Map();
    let listenerIdCounter = 0;

    return {
        /**
         * Gets the current state or a specific property
         * @param {string} [key] - Optional property key
         * @returns {*} State or property value
         */
        get(key) {
            if (key) {
                return state[key];
            }
            return { ...state };
        },

        /**
         * Sets state properties
         * @param {Object|string} keyOrUpdates - Property key or updates object
         * @param {*} [value] - Value if key is string
         */
        set(keyOrUpdates, value) {
            const prevState = { ...state };

            if (typeof keyOrUpdates === 'string') {
                state[keyOrUpdates] = value;
            } else {
                state = { ...state, ...keyOrUpdates };
            }

            // Notify listeners
            listeners.forEach((callback, id) => {
                try {
                    callback(state, prevState);
                } catch (e) {
                    console.error('State listener error:', e);
                }
            });
        },

        /**
         * Subscribes to state changes
         * @param {Function} callback - Called with (newState, prevState)
         * @returns {Function} Unsubscribe function
         */
        subscribe(callback) {
            const id = listenerIdCounter++;
            listeners.set(id, callback);
            return () => listeners.delete(id);
        },

        /**
         * Resets state to initial values
         */
        reset() {
            this.set(initialState);
        }
    };
}

/**
 * Editor state store with persistence
 */
export const editorState = createStore({
    // Current editing state
    currentPage: null,
    originalHtml: null,
    hasUnsavedChanges: false,
    isLoading: false,
    isOnline: navigator.onLine,

    // Selection and editing
    selectedElement: null,
    editMode: 'visual', // 'visual' | 'code'

    // History
    undoStack: [],
    redoStack: [],

    // Version history
    versions: [],
    currentVersion: null,

    // Pending changes
    pendingChanges: [],

    // Feedback items
    feedbackItems: [],

    // Trash
    trash: [],

    // Notes
    notes: [],

    // UI state
    sidebarOpen: false,
    previewMode: false,
    mobilePreview: false
});

/**
 * Persists specific state keys to localStorage
 * @param {Object} store - Store instance
 * @param {string[]} keys - Keys to persist
 * @param {string} storageKey - localStorage key
 */
export function persistState(store, keys, storageKey) {
    // Load persisted state
    const saved = localStore.get(storageKey, {});
    const updates = {};

    keys.forEach(key => {
        if (saved[key] !== undefined) {
            updates[key] = saved[key];
        }
    });

    if (Object.keys(updates).length > 0) {
        store.set(updates);
    }

    // Subscribe to save changes
    store.subscribe((state) => {
        const toSave = {};
        keys.forEach(key => {
            toSave[key] = state[key];
        });
        localStore.set(storageKey, toSave);
    });
}

/**
 * Blog editor state
 */
export const blogState = createStore({
    // Current post
    currentPost: null,
    posts: [],
    drafts: [],

    // Queue
    queue: [],

    // Media
    mediaLibrary: [],

    // UI
    isLoading: false,
    activeTab: 'editor'
});

/**
 * Global app state
 */
export const appState = createStore({
    // Authentication
    isAuthenticated: false,
    token: null,

    // Network
    isOnline: navigator.onLine,

    // Notifications
    notifications: [],

    // Modals
    activeModal: null
});

// Track online/offline status
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        appState.set('isOnline', true);
        editorState.set('isOnline', true);
    });

    window.addEventListener('offline', () => {
        appState.set('isOnline', false);
        editorState.set('isOnline', false);
    });
}

/**
 * Action creators for common state operations
 */
export const actions = {
    /**
     * Adds a pending change
     * @param {Object} change - Change object
     */
    addPendingChange(change) {
        const changes = editorState.get('pendingChanges');
        editorState.set('pendingChanges', [...changes, {
            ...change,
            timestamp: Date.now()
        }]);
        editorState.set('hasUnsavedChanges', true);
    },

    /**
     * Clears pending changes
     */
    clearPendingChanges() {
        editorState.set('pendingChanges', []);
        editorState.set('hasUnsavedChanges', false);
    },

    /**
     * Pushes to undo stack
     * @param {Object} state - State snapshot
     */
    pushUndo(state) {
        const stack = editorState.get('undoStack');
        const maxSteps = 50;

        editorState.set('undoStack', [
            ...stack.slice(-maxSteps + 1),
            { ...state, timestamp: Date.now() }
        ]);
        editorState.set('redoStack', []);
    },

    /**
     * Performs undo
     * @returns {Object|null} Previous state or null
     */
    undo() {
        const undoStack = editorState.get('undoStack');
        if (undoStack.length === 0) return null;

        const redoStack = editorState.get('redoStack');
        const current = undoStack[undoStack.length - 1];

        editorState.set({
            undoStack: undoStack.slice(0, -1),
            redoStack: [...redoStack, current]
        });

        return undoStack[undoStack.length - 2] || null;
    },

    /**
     * Performs redo
     * @returns {Object|null} Next state or null
     */
    redo() {
        const redoStack = editorState.get('redoStack');
        if (redoStack.length === 0) return null;

        const undoStack = editorState.get('undoStack');
        const next = redoStack[redoStack.length - 1];

        editorState.set({
            undoStack: [...undoStack, next],
            redoStack: redoStack.slice(0, -1)
        });

        return next;
    },

    /**
     * Adds item to trash
     * @param {Object} item - Deleted item
     */
    addToTrash(item) {
        const trash = editorState.get('trash');
        const maxItems = 20;

        editorState.set('trash', [
            ...trash.slice(-maxItems + 1),
            { ...item, deletedAt: Date.now() }
        ]);
    },

    /**
     * Shows a notification
     * @param {string} message - Notification message
     * @param {string} [type='info'] - Type: info, success, error, warning
     */
    notify(message, type = 'info') {
        const notifications = appState.get('notifications');
        const id = Date.now();

        appState.set('notifications', [
            ...notifications,
            { id, message, type, timestamp: Date.now() }
        ]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const current = appState.get('notifications');
            appState.set('notifications', current.filter(n => n.id !== id));
        }, 5000);
    }
};
