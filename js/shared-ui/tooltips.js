/**
 * Shared UI - Tooltips Module
 * Zeilen: ~60 | Verantwortung: Tooltip-System
 * @version 2.0.0 (Modular)
 */

(function(SharedUI) {
    'use strict';

    SharedUI.tooltips = {
        init() {
            // Event Delegation für Tooltips
            document.addEventListener('mouseenter', (e) => {
                const target = e.target.closest('[data-tooltip]');
                if (target) this.show(target);
            }, true);

            document.addEventListener('mouseleave', (e) => {
                const target = e.target.closest('[data-tooltip]');
                if (target) this.hide();
            }, true);
        },

        show(element) {
            this.hide(); // Vorherigen Tooltip entfernen

            const text = element.getAttribute('data-tooltip');
            const shortcut = element.getAttribute('data-shortcut');
            if (!text) return;

            const tooltip = document.createElement('div');
            tooltip.className = 'ui-tooltip';
            tooltip.innerHTML = `
                <span class="tooltip-text">${text}</span>
                ${shortcut ? `<span class="tooltip-shortcut">${shortcut}</span>` : ''}
            `;

            document.body.appendChild(tooltip);

            // Positionieren
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            let top = rect.bottom + 8;
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

            // Rand-Korrektur
            if (left < 8) left = 8;
            if (left + tooltipRect.width > window.innerWidth - 8) {
                left = window.innerWidth - tooltipRect.width - 8;
            }
            if (top + tooltipRect.height > window.innerHeight - 8) {
                top = rect.top - tooltipRect.height - 8;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.classList.add('visible');
        },

        hide() {
            const existing = document.querySelector('.ui-tooltip');
            if (existing) existing.remove();
        }
    };

})(window.SharedUI = window.SharedUI || {});
