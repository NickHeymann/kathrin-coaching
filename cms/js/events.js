/**
 * CMS Event Delegation
 * CSP-safe implementation for data-action attributes
 */
(function() {
    'use strict';

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        e.preventDefault();

        // CMS Actions
        const cmsActions = {
            'openSidebar': () => {
                const sidebar = btn.dataset.sidebar;
                if (sidebar && window.SharedUI?.mobileSidebar?.open) {
                    SharedUI.mobileSidebar.open(sidebar);
                }
            },
            'closeSidebar': () => {
                const sidebar = btn.dataset.sidebar;
                if (sidebar && typeof CMS !== 'undefined') CMS.closeSidebar(sidebar);
            },
            'filterNotes': () => {
                const filter = btn.dataset.filter;
                if (filter && typeof CMS !== 'undefined') CMS.filterNotes(filter);
            },
            'switchVideoTab': () => {
                const tab = btn.dataset.tab;
                if (tab && typeof CMS !== 'undefined') CMS.switchVideoTab(tab);
            },
            'formatText': () => {
                const format = btn.dataset.format;
                if (format && typeof CMS !== 'undefined') CMS.formatText(format);
            },
            'loadPage': () => {
                const page = btn.dataset.page;
                if (page && typeof CMS !== 'undefined') CMS.loadPage(page);
            },
            'restoreVersion': () => {
                const version = btn.dataset.version;
                if (version && typeof CMS !== 'undefined') CMS.restoreVersion(version);
            }
        };

        // Direct CMS method calls
        if (action.startsWith('CMS.')) {
            const method = action.replace('CMS.', '');
            if (typeof CMS !== 'undefined' && typeof CMS[method] === 'function') {
                CMS[method]();
            }
            return;
        }

        // Execute mapped action
        if (cmsActions[action]) {
            cmsActions[action]();
            return;
        }

        // Global function fallback
        if (typeof window[action] === 'function') {
            window[action]();
        }
    });
})();
