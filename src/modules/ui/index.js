/**
 * UI Components Index
 * Re-exports all UI components for easy importing
 */

export * from './toast.js';
export * from './modal.js';

// Additional common UI utilities

/**
 * Shows/hides a loading spinner
 * @param {boolean} show - Whether to show or hide
 * @param {string} [message='Laden...'] - Loading message
 */
export function setLoading(show, message = 'Laden...') {
    let loader = document.getElementById('global-loader');

    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <p class="loader-text">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loader-text').textContent = message;
            loader.classList.remove('hidden');
        }
    } else if (loader) {
        loader.classList.add('hidden');
    }
}

/**
 * Updates status badge
 * @param {string} status - Status: saved, unsaved, saving, error, offline
 * @param {HTMLElement} [element] - Status badge element (optional)
 */
export function updateStatus(status, element) {
    const badge = element || document.getElementById('status-badge');
    if (!badge) return;

    const statusConfig = {
        saved: { text: 'Gespeichert', class: 'status-saved' },
        unsaved: { text: 'Ungespeichert', class: 'status-unsaved' },
        saving: { text: 'Speichert...', class: 'status-saving' },
        error: { text: 'Fehler', class: 'status-error' },
        offline: { text: 'Offline', class: 'status-offline' }
    };

    const config = statusConfig[status] || statusConfig.saved;

    badge.textContent = config.text;
    badge.className = `status-badge ${config.class}`;
}

// Inject global loader styles
const loaderStyles = `
.global-loader {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.95);
    z-index: 100003;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;
}

.global-loader.hidden {
    opacity: 0;
    pointer-events: none;
}

.loader-content {
    text-align: center;
}

.loader-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #2C4A47;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loader-text {
    color: #666;
    font-size: 0.95rem;
}
`;

if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = loaderStyles;
    document.head.appendChild(styleEl);
}
