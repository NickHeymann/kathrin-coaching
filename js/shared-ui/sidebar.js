/**
 * Shared UI - Sidebar Module
 * Zeilen: ~45 | Verantwortung: Mobile Sidebar
 * @version 2.0.0 (Modular)
 */

(function(SharedUI) {
    'use strict';

    SharedUI.mobileSidebar = {
        init() {
            this.createOverlay();
        },

        createOverlay() {
            if (document.getElementById('sidebarOverlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.className = 'sidebar-overlay';
            overlay.onclick = () => this.close();
            document.body.appendChild(overlay);
        },

        open(sidebarId) {
            const sidebar = document.getElementById(sidebarId);
            const overlay = document.getElementById('sidebarOverlay');
            if (sidebar) {
                sidebar.classList.add('open', 'mobile-open');
                if (overlay) overlay.classList.add('active');
                document.body.classList.add('sidebar-open');
            }
        },

        close() {
            document.querySelectorAll('.sidebar').forEach(s => {
                s.classList.remove('open', 'mobile-open');
            });
            const overlay = document.getElementById('sidebarOverlay');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    };

})(window.SharedUI = window.SharedUI || {});
