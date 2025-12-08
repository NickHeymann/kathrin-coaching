/**
 * Modal Component
 * Reusable modal dialog component
 */

import { escapeHtml } from '../../utils/security.js';
import { $, createElement } from '../../utils/dom.js';

let activeModal = null;
let modalOverlay = null;

/**
 * Creates modal overlay if needed
 * @returns {HTMLElement}
 */
function getOverlay() {
    if (!modalOverlay) {
        modalOverlay = createElement('div', { className: 'modal-overlay' });
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay && activeModal?.closable !== false) {
                closeModal();
            }
        });
        document.body.appendChild(modalOverlay);
    }
    return modalOverlay;
}

/**
 * Opens a modal dialog
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string|HTMLElement} options.content - Modal content (HTML string or element)
 * @param {Array} [options.buttons] - Array of button configs
 * @param {boolean} [options.closable=true] - Can be closed by clicking outside
 * @param {string} [options.size='medium'] - Size: small, medium, large
 * @param {Function} [options.onClose] - Called when modal closes
 * @returns {Object} Modal controller with close method
 */
export function openModal(options) {
    const {
        title,
        content,
        buttons = [],
        closable = true,
        size = 'medium',
        onClose
    } = options;

    // Close any existing modal
    if (activeModal) {
        closeModal();
    }

    const overlay = getOverlay();

    // Create modal element
    const modal = createElement('div', {
        className: `modal modal-${size}`,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'modal-title'
    });

    // Header
    const header = createElement('div', { className: 'modal-header' });
    const titleEl = createElement('h3', { id: 'modal-title' }, [escapeHtml(title)]);
    header.appendChild(titleEl);

    if (closable) {
        const closeBtn = createElement('button', {
            className: 'modal-close',
            'aria-label': 'Schließen',
            onClick: closeModal
        }, ['×']);
        header.appendChild(closeBtn);
    }

    modal.appendChild(header);

    // Body
    const body = createElement('div', { className: 'modal-body' });
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        body.appendChild(content);
    }
    modal.appendChild(body);

    // Footer with buttons
    if (buttons.length > 0) {
        const footer = createElement('div', { className: 'modal-footer' });

        buttons.forEach(btn => {
            const buttonEl = createElement('button', {
                className: `btn ${btn.className || 'btn-secondary'}`,
                onClick: () => {
                    if (btn.onClick) {
                        const result = btn.onClick();
                        if (result !== false) {
                            closeModal();
                        }
                    } else {
                        closeModal();
                    }
                }
            }, [escapeHtml(btn.text)]);

            footer.appendChild(buttonEl);
        });

        modal.appendChild(footer);
    }

    // Add to DOM
    overlay.appendChild(modal);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus management
    const focusable = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) {
        focusable[0].focus();
    }

    // Trap focus in modal
    const trapFocus = (e) => {
        if (e.key === 'Tab' && focusable.length > 0) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        if (e.key === 'Escape' && closable) {
            closeModal();
        }
    };

    document.addEventListener('keydown', trapFocus);

    activeModal = {
        element: modal,
        overlay,
        closable,
        onClose,
        trapFocus
    };

    return {
        close: closeModal,
        element: modal
    };
}

/**
 * Closes the active modal
 */
export function closeModal() {
    if (!activeModal) return;

    const { element, overlay, onClose, trapFocus } = activeModal;

    // Remove focus trap
    document.removeEventListener('keydown', trapFocus);

    // Animate out
    element.classList.add('modal-closing');
    overlay.classList.add('modal-overlay-closing');

    setTimeout(() => {
        element.remove();
        overlay.classList.remove('active', 'modal-overlay-closing');
        document.body.style.overflow = '';

        if (onClose) {
            onClose();
        }

        activeModal = null;
    }, 200);
}

/**
 * Shows a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {Object} [options] - Additional options
 * @returns {Promise<boolean>} Resolves to true if confirmed
 */
export function confirm(title, message, options = {}) {
    return new Promise((resolve) => {
        openModal({
            title,
            content: `<p>${escapeHtml(message)}</p>`,
            size: 'small',
            buttons: [
                {
                    text: options.cancelText || 'Abbrechen',
                    className: 'btn-secondary',
                    onClick: () => {
                        resolve(false);
                    }
                },
                {
                    text: options.confirmText || 'Bestätigen',
                    className: options.danger ? 'btn-danger' : 'btn-primary',
                    onClick: () => {
                        resolve(true);
                    }
                }
            ],
            onClose: () => resolve(false)
        });
    });
}

/**
 * Shows an alert dialog
 * @param {string} title - Dialog title
 * @param {string} message - Alert message
 * @returns {Promise<void>}
 */
export function alert(title, message) {
    return new Promise((resolve) => {
        openModal({
            title,
            content: `<p>${escapeHtml(message)}</p>`,
            size: 'small',
            buttons: [
                {
                    text: 'OK',
                    className: 'btn-primary',
                    onClick: () => resolve()
                }
            ],
            onClose: () => resolve()
        });
    });
}

/**
 * Shows a prompt dialog
 * @param {string} title - Dialog title
 * @param {string} message - Prompt message
 * @param {string} [defaultValue=''] - Default input value
 * @returns {Promise<string|null>} Resolves to input value or null if cancelled
 */
export function prompt(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        const input = createElement('input', {
            type: 'text',
            className: 'modal-input',
            value: defaultValue
        });

        const content = createElement('div', {}, [
            createElement('p', {}, [escapeHtml(message)]),
            input
        ]);

        openModal({
            title,
            content,
            size: 'small',
            buttons: [
                {
                    text: 'Abbrechen',
                    className: 'btn-secondary',
                    onClick: () => {
                        resolve(null);
                    }
                },
                {
                    text: 'OK',
                    className: 'btn-primary',
                    onClick: () => {
                        resolve(input.value);
                    }
                }
            ],
            onClose: () => resolve(null)
        });

        // Focus input and select text
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);
    });
}

// Inject styles
const styles = `
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100002;
    display: none;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.modal-overlay.active {
    display: flex;
    opacity: 1;
}

.modal-overlay-closing {
    opacity: 0;
}

.modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transform: scale(0.95);
    opacity: 0;
    animation: modalIn 0.2s ease forwards;
}

@keyframes modalIn {
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.modal-closing {
    animation: modalOut 0.2s ease forwards;
}

@keyframes modalOut {
    to {
        transform: scale(0.95);
        opacity: 0;
    }
}

.modal-small { width: 90%; max-width: 400px; }
.modal-medium { width: 90%; max-width: 600px; }
.modal-large { width: 90%; max-width: 900px; }

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #eee;
}

.modal-header h3 {
    margin: 0;
    color: #2C4A47;
    font-size: 1.1rem;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.modal-close:hover {
    background: #f5f5f5;
    color: #333;
}

.modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
}

.modal-body p {
    margin: 0 0 1rem;
    color: #555;
}

.modal-body p:last-child {
    margin-bottom: 0;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #eee;
    background: #fafafa;
}

.modal-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    margin-top: 0.5rem;
}

.modal-input:focus {
    outline: none;
    border-color: #2C4A47;
}

.btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: #2C4A47;
    color: white;
}

.btn-primary:hover {
    background: #1e3533;
}

.btn-secondary {
    background: #eee;
    color: #333;
}

.btn-secondary:hover {
    background: #ddd;
}

.btn-danger {
    background: #f44336;
    color: white;
}

.btn-danger:hover {
    background: #d32f2f;
}

@media (max-width: 600px) {
    .modal {
        margin: 1rem;
        max-height: calc(100vh - 2rem);
    }
}
`;

if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
}
