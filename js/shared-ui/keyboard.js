/**
 * Shared UI - Keyboard Navigation Module
 * Zeilen: ~30 | Verantwortung: Tastatur-Navigation
 * @version 2.0.0 (Modular)
 */

(function(SharedUI) {
    'use strict';

    SharedUI.keyboard = {
        init() {
            document.addEventListener('keydown', (e) => {
                // Tab-Navigation in Toolbars
                if (e.key === 'Tab') {
                    const toolbar = e.target.closest('.toolbar, .format-toolbar, .editor-toolbar');
                    if (toolbar) {
                        const buttons = toolbar.querySelectorAll('button:not([disabled]), [tabindex="0"]');
                        const currentIndex = Array.from(buttons).indexOf(e.target);

                        if (e.shiftKey && currentIndex > 0) {
                            e.preventDefault();
                            buttons[currentIndex - 1].focus();
                        } else if (!e.shiftKey && currentIndex < buttons.length - 1) {
                            e.preventDefault();
                            buttons[currentIndex + 1].focus();
                        }
                    }
                }
            });
        }
    };

})(window.SharedUI = window.SharedUI || {});
