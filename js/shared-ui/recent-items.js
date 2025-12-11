/**
 * Shared UI - Recent Items Module
 * Zeilen: ~65 | Verantwortung: Letzte bearbeitete Elemente
 * @version 2.0.0 (Modular)
 */

(function(SharedUI) {
    'use strict';

    SharedUI.recentItems = {
        storageKey: 'recent_edited_items',
        maxItems: 5,

        add(item) {
            const items = this.getAll();
            // Duplikat entfernen
            const filtered = items.filter(i => i.id !== item.id);
            // Vorne einfügen
            filtered.unshift({
                ...item,
                timestamp: Date.now()
            });
            // Begrenzen
            const limited = filtered.slice(0, this.maxItems);
            localStorage.setItem(this.storageKey, JSON.stringify(limited));
        },

        getAll() {
            try {
                return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            } catch {
                return [];
            }
        },

        render(container, onClick) {
            const items = this.getAll();
            if (items.length === 0) {
                container.innerHTML = '<p class="recent-empty">Noch keine bearbeiteten Seiten</p>';
                return;
            }

            container.innerHTML = items.map(item => `
                <button class="recent-item" data-id="${item.id}">
                    <span class="recent-icon">${item.icon || '📄'}</span>
                    <span class="recent-name">${item.name}</span>
                    <span class="recent-time">${this.formatTime(item.timestamp)}</span>
                </button>
            `).join('');

            container.querySelectorAll('.recent-item').forEach(btn => {
                btn.onclick = () => onClick(btn.dataset.id);
            });
        },

        formatTime(timestamp) {
            const diff = Date.now() - timestamp;
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1) return 'Gerade';
            if (minutes < 60) return `vor ${minutes}m`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `vor ${hours}h`;
            return `vor ${Math.floor(hours / 24)}d`;
        }
    };

})(window.SharedUI = window.SharedUI || {});
