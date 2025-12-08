/**
 * Event Handlers Module
 * Centralized event handling with delegation pattern
 *
 * This module provides a migration path from inline onclick handlers
 * to proper event delegation. Use data-action attributes in HTML
 * and register handlers here.
 */

// Action handlers registry
const actionHandlers = new Map();

/**
 * Registers an action handler
 * @param {string} action - Action name (matches data-action attribute)
 * @param {Function} handler - Handler function (receives event, element)
 */
export function registerAction(action, handler) {
    actionHandlers.set(action, handler);
}

/**
 * Registers multiple action handlers
 * @param {Object} handlers - Object mapping action names to handlers
 */
export function registerActions(handlers) {
    Object.entries(handlers).forEach(([action, handler]) => {
        registerAction(action, handler);
    });
}

/**
 * Initializes event delegation for data-action attributes
 * Call this once on DOMContentLoaded
 */
export function initEventDelegation() {
    // Click delegation
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (target) {
            const action = target.dataset.action;
            const handler = actionHandlers.get(action);
            if (handler) {
                e.preventDefault();
                handler(e, target);
            }
        }
    });

    // Change delegation (for selects, inputs)
    document.addEventListener('change', (e) => {
        const target = e.target.closest('[data-action-change]');
        if (target) {
            const action = target.dataset.actionChange;
            const handler = actionHandlers.get(action);
            if (handler) {
                handler(e, target);
            }
        }
    });

    // Input delegation (for real-time updates)
    document.addEventListener('input', (e) => {
        const target = e.target.closest('[data-action-input]');
        if (target) {
            const action = target.dataset.actionInput;
            const handler = actionHandlers.get(action);
            if (handler) {
                handler(e, target);
            }
        }
    });

    // Submit delegation (for forms)
    document.addEventListener('submit', (e) => {
        const target = e.target.closest('[data-action-submit]');
        if (target) {
            const action = target.dataset.actionSubmit;
            const handler = actionHandlers.get(action);
            if (handler) {
                e.preventDefault();
                handler(e, target);
            }
        }
    });

    // Event delegation initialized
}

/**
 * Creates a debounced version of a handler
 * @param {Function} handler - Original handler
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced handler
 */
export function debounce(handler, delay = 300) {
    let timeout;
    return function(e, target) {
        clearTimeout(timeout);
        timeout = setTimeout(() => handler(e, target), delay);
    };
}

/**
 * Creates a throttled version of a handler
 * @param {Function} handler - Original handler
 * @param {number} limit - Minimum time between calls in ms
 * @returns {Function} Throttled handler
 */
export function throttle(handler, limit = 100) {
    let inThrottle;
    return function(e, target) {
        if (!inThrottle) {
            handler(e, target);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Keyboard shortcut handler
 */
const shortcuts = new Map();

/**
 * Registers a keyboard shortcut
 * @param {string} combo - Key combination (e.g., 'ctrl+s', 'cmd+shift+z')
 * @param {Function} handler - Handler function
 * @param {Object} [options] - Options
 * @param {boolean} [options.preventDefault=true] - Prevent default behavior
 */
export function registerShortcut(combo, handler, options = {}) {
    shortcuts.set(combo.toLowerCase(), { handler, ...options });
}

/**
 * Initializes keyboard shortcut handling
 */
export function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const parts = [];

        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');

        // Add the key
        const key = e.key.toLowerCase();
        if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
            parts.push(key);
        }

        const combo = parts.join('+');
        const shortcut = shortcuts.get(combo);

        if (shortcut) {
            if (shortcut.preventDefault !== false) {
                e.preventDefault();
            }
            shortcut.handler(e);
        }
    });

    // Keyboard shortcuts initialized
}

// Common editor shortcuts
export const editorShortcuts = {
    'ctrl+s': 'save',
    'ctrl+z': 'undo',
    'ctrl+shift+z': 'redo',
    'ctrl+y': 'redo',
    'escape': 'closeModal'
};

/**
 * Helper to get data from element
 * @param {HTMLElement} element - Element with data attributes
 * @param {string} key - Data key (without 'data-' prefix)
 * @returns {string|null}
 */
export function getData(element, key) {
    return element?.dataset?.[key] ?? null;
}

/**
 * Helper to get numeric data from element
 * @param {HTMLElement} element - Element with data attributes
 * @param {string} key - Data key (without 'data-' prefix)
 * @param {number} defaultValue - Default if not found or invalid
 * @returns {number}
 */
export function getNumericData(element, key, defaultValue = 0) {
    const value = getData(element, key);
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}
