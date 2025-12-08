/**
 * Toast Notification Component
 * Displays temporary notification messages
 */

import { escapeHtml } from '../../utils/security.js';

let toastContainer = null;
let toastQueue = [];
let activeToasts = 0;
const MAX_TOASTS = 3;

/**
 * Ensures toast container exists
 * @returns {HTMLElement}
 */
function getContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.setAttribute('role', 'alert');
        toastContainer.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * Creates and shows a toast notification
 * @param {string} message - Message to display
 * @param {string} [type='info'] - Type: info, success, error, warning
 * @param {number} [duration=3000] - Duration in milliseconds
 * @returns {HTMLElement} Toast element
 */
export function toast(message, type = 'info', duration = 3000) {
    // Queue if too many active toasts
    if (activeToasts >= MAX_TOASTS) {
        toastQueue.push({ message, type, duration });
        return null;
    }

    const container = getContainer();
    const toastEl = document.createElement('div');

    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = escapeHtml(message);

    // Icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    if (icons[type]) {
        toastEl.innerHTML = `<span class="toast-icon">${icons[type]}</span> ${escapeHtml(message)}`;
    }

    container.appendChild(toastEl);
    activeToasts++;

    // Animate in
    requestAnimationFrame(() => {
        toastEl.classList.add('toast-visible');
    });

    // Auto-remove
    const removeToast = () => {
        toastEl.classList.remove('toast-visible');
        toastEl.classList.add('toast-hiding');

        setTimeout(() => {
            toastEl.remove();
            activeToasts--;

            // Process queue
            if (toastQueue.length > 0) {
                const next = toastQueue.shift();
                toast(next.message, next.type, next.duration);
            }
        }, 300);
    };

    // Click to dismiss
    toastEl.addEventListener('click', removeToast);

    // Auto dismiss
    if (duration > 0) {
        setTimeout(removeToast, duration);
    }

    return toastEl;
}

/**
 * Shows a success toast
 * @param {string} message - Message to display
 * @param {number} [duration=3000] - Duration in milliseconds
 */
export function success(message, duration = 3000) {
    return toast(message, 'success', duration);
}

/**
 * Shows an error toast
 * @param {string} message - Message to display
 * @param {number} [duration=5000] - Duration in milliseconds (longer for errors)
 */
export function error(message, duration = 5000) {
    return toast(message, 'error', duration);
}

/**
 * Shows a warning toast
 * @param {string} message - Message to display
 * @param {number} [duration=4000] - Duration in milliseconds
 */
export function warning(message, duration = 4000) {
    return toast(message, 'warning', duration);
}

/**
 * Shows an info toast
 * @param {string} message - Message to display
 * @param {number} [duration=3000] - Duration in milliseconds
 */
export function info(message, duration = 3000) {
    return toast(message, 'info', duration);
}

/**
 * Clears all active toasts
 */
export function clearAll() {
    const container = getContainer();
    container.innerHTML = '';
    activeToasts = 0;
    toastQueue = [];
}

// Inject styles
const styles = `
.toast-container {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100001;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
}

.toast {
    background: #333;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    pointer-events: auto;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
}

.toast-visible {
    opacity: 1;
    transform: translateY(0);
}

.toast-hiding {
    opacity: 0;
    transform: translateY(-10px);
}

.toast-success { background: #4CAF50; }
.toast-error { background: #f44336; }
.toast-warning { background: #ff9800; }
.toast-info { background: #2196F3; }

.toast-icon {
    font-size: 1.1rem;
    font-weight: bold;
}

@media (max-width: 600px) {
    .toast-container {
        left: 1rem;
        right: 1rem;
        transform: none;
    }
    .toast {
        font-size: 0.85rem;
        padding: 0.6rem 1rem;
    }
}
`;

if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
}
