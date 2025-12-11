/**
 * Blog Editor Event Delegation
 * CSP-safe implementation - no inline onclick handlers needed
 */
(function() {
    'use strict';

    // ==========================================
    // EVENT DELEGATION
    // ==========================================

    document.addEventListener('click', function(e) {
        const target = e.target;
        const btn = target.closest('button, [data-action]');
        if (!btn) return;

        const action = btn.dataset.action || btn.getAttribute('onclick')?.match(/^(\w+)/)?.[1];
        if (!action) return;

        e.preventDefault();

        // Map actions to functions
        const actions = {
            // Setup & Auth
            'setupToken': () => typeof setupToken === 'function' && setupToken(),
            'logout': () => typeof logout === 'function' && logout(),

            // Mobile & UI
            'toggleMobileSidebar': () => typeof toggleMobileSidebar === 'function' && toggleMobileSidebar(),
            'closeMobileSidebar': () => typeof closeMobileSidebar === 'function' && closeMobileSidebar(),
            'toggleAIPanel': () => typeof toggleAIPanel === 'function' && toggleAIPanel(),
            'toggleQueue': () => typeof toggleQueue === 'function' && toggleQueue(),
            'openShortcutsModal': () => typeof openShortcutsModal === 'function' && openShortcutsModal(),
            'closeShortcutsModal': () => typeof closeShortcutsModal === 'function' && closeShortcutsModal(),

            // Post Management
            'createNewPost': () => typeof createNewPost === 'function' && createNewPost(),
            'saveDraft': () => typeof saveDraft === 'function' && saveDraft(),
            'publishPost': () => typeof publishPost === 'function' && publishPost(),
            'openPreview': () => typeof openPreview === 'function' && openPreview(),
            'openExportModal': () => typeof openExportModal === 'function' && openExportModal(),
            'closeExportModal': () => typeof closeExportModal === 'function' && closeExportModal(),
            'openScheduleModal': () => typeof openScheduleModal === 'function' && openScheduleModal(),
            'closeScheduleModal': () => typeof closeScheduleModal === 'function' && closeScheduleModal(),
            'confirmSchedule': () => typeof confirmSchedule === 'function' && confirmSchedule(),

            // Tabs
            'showTab': () => {
                const tab = btn.dataset.tab;
                if (tab && typeof showTab === 'function') showTab(tab);
            },

            // Toolbar
            'toggleToolbarDropdown': () => typeof toggleToolbarDropdown === 'function' && toggleToolbarDropdown(btn),
            'setBlockType': () => {
                const type = btn.dataset.type;
                const label = btn.dataset.label;
                if (type && typeof setBlockType === 'function') setBlockType(type, label);
            },

            // Formatting
            'formatBold': () => typeof formatBold === 'function' && formatBold(),
            'formatItalic': () => typeof formatItalic === 'function' && formatItalic(),
            'formatUnderline': () => typeof formatUnderline === 'function' && formatUnderline(),
            'formatStrikethrough': () => typeof formatStrikethrough === 'function' && formatStrikethrough(),
            'formatQuote': () => typeof formatQuote === 'function' && formatQuote(),
            'formatBulletList': () => typeof formatBulletList === 'function' && formatBulletList(),
            'formatNumberedList': () => typeof formatNumberedList === 'function' && formatNumberedList(),
            'insertHr': () => typeof insertHr === 'function' && insertHr(),
            'insertLink': () => typeof insertLink === 'function' && insertLink(),
            'insertImage': () => typeof insertImage === 'function' && insertImage(),
            'insertVideo': () => typeof insertVideo === 'function' && insertVideo(),
            'removeFormat': () => typeof removeFormat === 'function' && removeFormat(),

            // Blocks
            'moveBlockUp': () => {
                const block = btn.closest('.content-block');
                if (block && typeof moveBlockUp === 'function') moveBlockUp(block);
            },
            'moveBlockDown': () => {
                const block = btn.closest('.content-block');
                if (block && typeof moveBlockDown === 'function') moveBlockDown(block);
            },
            'duplicateBlock': () => {
                const block = btn.closest('.content-block');
                if (block && typeof duplicateBlock === 'function') duplicateBlock(block);
            },
            'deleteBlock': () => {
                const block = btn.closest('.content-block');
                if (block && typeof deleteBlock === 'function') deleteBlock(block);
            },
            'addBlockAfter': () => {
                const block = btn.closest('.content-block');
                const type = btn.dataset.type || 'text';
                if (typeof addBlockAfter === 'function') addBlockAfter(block, type);
            },

            // AI Panel
            'aiSuggestTitle': () => typeof aiSuggestTitle === 'function' && aiSuggestTitle(),
            'aiSuggestMeta': () => typeof aiSuggestMeta === 'function' && aiSuggestMeta(),
            'aiImproveText': () => typeof aiImproveText === 'function' && aiImproveText(),
            'aiCategorize': () => typeof aiCategorize === 'function' && aiCategorize(),
            'startVoiceInput': () => typeof startVoiceInput === 'function' && startVoiceInput(),
            'stopVoiceInput': () => typeof stopVoiceInput === 'function' && stopVoiceInput(),

            // Video Recording
            'openVideoRecordModal': () => typeof openVideoRecordModal === 'function' && openVideoRecordModal(),
            'closeVideoRecordModal': () => typeof closeVideoRecordModal === 'function' && closeVideoRecordModal(),
            'startScreenRecording': () => typeof startScreenRecording === 'function' && startScreenRecording(),
            'startWebcamRecording': () => typeof startWebcamRecording === 'function' && startWebcamRecording(),
            'stopRecording': () => typeof stopRecording === 'function' && stopRecording(),
            'pauseRecording': () => typeof pauseRecording === 'function' && pauseRecording(),
            'resumeRecording': () => typeof resumeRecording === 'function' && resumeRecording(),

            // Export
            'exportAsHtml': () => typeof exportAsHtml === 'function' && exportAsHtml(),
            'exportAsMarkdown': () => typeof exportAsMarkdown === 'function' && exportAsMarkdown(),
            'copyToClipboard': () => typeof copyToClipboard === 'function' && copyToClipboard(),

            // Image Modal
            'openImageModal': () => typeof openImageModal === 'function' && openImageModal(),
            'closeImageModal': () => typeof closeImageModal === 'function' && closeImageModal(),
            'confirmImage': () => typeof confirmImage === 'function' && confirmImage(),

            // Category/Tag Selection
            'toggleCategory': () => {
                if (typeof toggleCategory === 'function') toggleCategory(btn);
            },
            'selectAllCategories': () => typeof selectAllCategories === 'function' && selectAllCategories(),
            'clearAllCategories': () => typeof clearAllCategories === 'function' && clearAllCategories()
        };

        // Execute the action
        if (actions[action]) {
            actions[action]();
        }
    });

    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.toolbar-dropdown')) {
            document.querySelectorAll('.toolbar-dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
                const btn = menu.previousElementSibling;
                if (btn) btn.setAttribute('aria-expanded', 'false');
            });
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close modals
            if (typeof closeShortcutsModal === 'function') closeShortcutsModal();
            if (typeof closeExportModal === 'function') closeExportModal();
            if (typeof closeScheduleModal === 'function') closeScheduleModal();
            if (typeof closeImageModal === 'function') closeImageModal();
            if (typeof closeVideoRecordModal === 'function') closeVideoRecordModal();
        }
    });

    console.log('Blog Editor Events loaded (CSP-safe)');
})();
