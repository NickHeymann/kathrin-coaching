/**
 * Shared UI - Offline Status Module
 * Zeilen: ~85 | Verantwortung: Sync-Status-Anzeige
 * @version 2.0.0 (Modular)
 */

(function(SharedUI) {
    'use strict';

    SharedUI.offlineStatus = {
        element: null,
        pendingCount: 0,

        init() {
            this.createStatusBar();
            this.bindEvents();
            this.updateStatus();
        },

        createStatusBar() {
            if (document.getElementById('syncStatusBar')) return;

            const bar = document.createElement('div');
            bar.id = 'syncStatusBar';
            bar.className = 'sync-status-bar';
            bar.innerHTML = `
                <div class="sync-status-indicator">
                    <span class="sync-dot"></span>
                    <span class="sync-text">Verbunden</span>
                </div>
                <div class="sync-pending" style="display:none;">
                    <span class="pending-count">0</span> ausstehend
                </div>
                <button class="sync-btn" onclick="SharedUI.offlineStatus.syncNow()" style="display:none;">
                    Jetzt synchronisieren
                </button>
            `;
            document.body.appendChild(bar);
            this.element = bar;
        },

        bindEvents() {
            window.addEventListener('online', () => this.updateStatus());
            window.addEventListener('offline', () => this.updateStatus());
        },

        updateStatus(pendingChanges = 0) {
            if (!this.element) return;

            const isOnline = navigator.onLine;
            const dot = this.element.querySelector('.sync-dot');
            const text = this.element.querySelector('.sync-text');
            const pending = this.element.querySelector('.sync-pending');
            const syncBtn = this.element.querySelector('.sync-btn');

            this.pendingCount = pendingChanges;

            if (!isOnline) {
                dot.className = 'sync-dot offline';
                text.textContent = 'Offline';
                this.element.classList.add('offline');
            } else if (pendingChanges > 0) {
                dot.className = 'sync-dot pending';
                text.textContent = 'Ausstehend';
                pending.style.display = 'flex';
                pending.querySelector('.pending-count').textContent = pendingChanges;
                syncBtn.style.display = 'block';
                this.element.classList.remove('offline');
            } else {
                dot.className = 'sync-dot online';
                text.textContent = 'Synchronisiert';
                pending.style.display = 'none';
                syncBtn.style.display = 'none';
                this.element.classList.remove('offline');
            }
        },

        setSyncing(isSyncing) {
            if (!this.element) return;
            const dot = this.element.querySelector('.sync-dot');
            const text = this.element.querySelector('.sync-text');

            if (isSyncing) {
                dot.className = 'sync-dot syncing';
                text.textContent = 'Synchronisiere...';
            }
        },

        syncNow() {
            // Wird von CMS/Blog überschrieben
            if (typeof window.CMS !== 'undefined' && window.CMS.syncOfflineQueue) {
                window.CMS.syncOfflineQueue();
            }
        }
    };

})(window.SharedUI = window.SharedUI || {});
