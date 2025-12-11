/**
 * Shared UI - Modals Module
 * Zeilen: ~175 | Verantwortung: Error Recovery, Confirm Modal, Progress
 * @version 2.0.0 (Modular)
 */

(function(SharedUI) {
    'use strict';

    // ================================
    // ERROR RECOVERY
    // ================================
    SharedUI.errorRecovery = {
        show(options) {
            const { message, details, onRetry, onDismiss } = options;

            const existing = document.getElementById('errorRecoveryModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'errorRecoveryModal';
            modal.className = 'error-recovery-modal';
            modal.innerHTML = `
                <div class="error-recovery-content">
                    <div class="error-icon">⚠️</div>
                    <h3>Fehler aufgetreten</h3>
                    <p class="error-message">${this.escapeHtml(message)}</p>
                    ${details ? `<details class="error-details"><summary>Details</summary><pre>${this.escapeHtml(details)}</pre></details>` : ''}
                    <div class="error-actions">
                        ${onRetry ? '<button class="btn btn-primary error-retry">Erneut versuchen</button>' : ''}
                        <button class="btn btn-ghost error-dismiss">Schließen</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            if (onRetry) {
                modal.querySelector('.error-retry').onclick = () => {
                    modal.remove();
                    onRetry();
                };
            }

            modal.querySelector('.error-dismiss').onclick = () => {
                modal.remove();
                if (onDismiss) onDismiss();
            };

            // Escape schließt Modal
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        },

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    // ================================
    // CONFIRMATION MODAL
    // ================================
    SharedUI.confirm = {
        show(options) {
            return new Promise((resolve) => {
                const { title, message, confirmText = 'Bestätigen', cancelText = 'Abbrechen', type = 'default', details } = options;

                const modal = document.createElement('div');
                modal.className = 'confirm-modal-overlay';
                modal.innerHTML = `
                    <div class="confirm-modal ${type}">
                        <h3>${title}</h3>
                        <p>${message}</p>
                        ${details ? `<div class="confirm-details">${details}</div>` : ''}
                        <div class="confirm-actions">
                            <button class="btn btn-ghost confirm-cancel">${cancelText}</button>
                            <button class="btn btn-primary confirm-ok">${confirmText}</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);

                // Focus auf Confirm-Button
                setTimeout(() => modal.querySelector('.confirm-ok').focus(), 50);

                modal.querySelector('.confirm-ok').onclick = () => {
                    modal.remove();
                    resolve(true);
                };

                modal.querySelector('.confirm-cancel').onclick = () => {
                    modal.remove();
                    resolve(false);
                };

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                        resolve(false);
                    }
                });

                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        modal.remove();
                        document.removeEventListener('keydown', escHandler);
                        resolve(false);
                    }
                };
                document.addEventListener('keydown', escHandler);
            });
        }
    };

    // ================================
    // PROGRESS INDICATOR
    // ================================
    SharedUI.progress = {
        element: null,

        show(options = {}) {
            const { message = 'Wird hochgeladen...', showPercent = true } = options;

            this.hide();

            const el = document.createElement('div');
            el.id = 'uploadProgressOverlay';
            el.className = 'upload-progress-overlay';
            el.innerHTML = `
                <div class="upload-progress-card">
                    <div class="upload-progress-header">
                        <span class="upload-progress-message">${message}</span>
                        <span class="upload-progress-percent" ${!showPercent ? 'style="display:none"' : ''}>0%</span>
                    </div>
                    <div class="upload-progress-bar">
                        <div class="upload-progress-fill"></div>
                    </div>
                    <div class="upload-progress-details">
                        <span class="upload-progress-size"></span>
                        <span class="upload-progress-time"></span>
                    </div>
                </div>
            `;

            document.body.appendChild(el);
            this.element = el;
        },

        update(percent, details = {}) {
            if (!this.element) return;

            const fill = this.element.querySelector('.upload-progress-fill');
            const percentText = this.element.querySelector('.upload-progress-percent');
            const sizeText = this.element.querySelector('.upload-progress-size');
            const timeText = this.element.querySelector('.upload-progress-time');

            fill.style.width = `${percent}%`;
            percentText.textContent = `${Math.round(percent)}%`;

            if (details.loaded && details.total) {
                sizeText.textContent = `${this.formatBytes(details.loaded)} / ${this.formatBytes(details.total)}`;
            }
            if (details.remaining) {
                timeText.textContent = `~${details.remaining}s verbleibend`;
            }
        },

        hide() {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        },

        formatBytes(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    };

})(window.SharedUI = window.SharedUI || {});
