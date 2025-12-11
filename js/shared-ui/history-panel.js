/**
 * Shared UI - History Panel Module
 * Zeilen: ~140 | Verantwortung: Undo/Redo-Verlauf
 * @version 2.0.0 (Modular)
 */

(function(SharedUI) {
    'use strict';

    SharedUI.historyPanel = {
        element: null,
        history: [],
        currentIndex: -1,

        init(container) {
            this.createPanel(container);
        },

        createPanel(container) {
            const panel = document.createElement('div');
            panel.id = 'historyPanel';
            panel.className = 'history-panel';
            panel.innerHTML = `
                <div class="history-header">
                    <h4>Änderungsverlauf</h4>
                    <button class="history-close" onclick="SharedUI.historyPanel.hide()">&times;</button>
                </div>
                <div class="history-list" id="historyList">
                    <p class="history-empty">Noch keine Änderungen</p>
                </div>
            `;

            (container || document.body).appendChild(panel);
            this.element = panel;
        },

        add(entry) {
            // Bei neuem Eintrag: Alles nach currentIndex verwerfen
            if (this.currentIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.currentIndex + 1);
            }

            this.history.push({
                ...entry,
                timestamp: Date.now(),
                id: Date.now()
            });

            this.currentIndex = this.history.length - 1;

            // Max 50 Einträge
            if (this.history.length > 50) {
                this.history.shift();
                this.currentIndex--;
            }

            this.render();
        },

        undo() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                return this.history[this.currentIndex];
            }
            return null;
        },

        redo() {
            if (this.currentIndex < this.history.length - 1) {
                this.currentIndex++;
                return this.history[this.currentIndex];
            }
            return null;
        },

        goTo(index) {
            if (index >= 0 && index < this.history.length) {
                this.currentIndex = index;
                this.render();
                return this.history[index];
            }
            return null;
        },

        render() {
            if (!this.element) return;

            const list = this.element.querySelector('#historyList');
            if (this.history.length === 0) {
                list.innerHTML = '<p class="history-empty">Noch keine Änderungen</p>';
                return;
            }

            list.innerHTML = this.history.map((entry, i) => `
                <div class="history-entry ${i === this.currentIndex ? 'current' : ''} ${i > this.currentIndex ? 'future' : ''}"
                     onclick="SharedUI.historyPanel.goTo(${i})">
                    <span class="history-icon">${this.getIcon(entry.type)}</span>
                    <div class="history-info">
                        <span class="history-action">${entry.action}</span>
                        <span class="history-time">${this.formatTime(entry.timestamp)}</span>
                    </div>
                </div>
            `).reverse().join('');
        },

        getIcon(type) {
            const icons = {
                text: '✏️',
                image: '🖼️',
                video: '🎬',
                delete: '🗑️',
                format: '🎨',
                add: '➕',
                default: '📝'
            };
            return icons[type] || icons.default;
        },

        formatTime(timestamp) {
            return new Date(timestamp).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        show() {
            if (this.element) {
                this.element.classList.add('open');
                this.render();
            }
        },

        hide() {
            if (this.element) {
                this.element.classList.remove('open');
            }
        },

        toggle() {
            if (this.element?.classList.contains('open')) {
                this.hide();
            } else {
                this.show();
            }
        }
    };

})(window.SharedUI = window.SharedUI || {});
