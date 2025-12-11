/**
 * Blog Bookmark/Library Component
 * CSP-safe - no inline scripts required
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'kathrin-blog-library';

    function getLibrary() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveLibrary(library) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    }

    function getCurrentSlug() {
        // Get current page filename
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    }

    function updateUI() {
        const library = getLibrary();
        const btn = document.getElementById('bookmarkBtn');
        const count = document.getElementById('libraryCount');
        const currentSlug = getCurrentSlug();

        if (btn) {
            btn.classList.toggle('saved', library.includes(currentSlug));
        }
        if (count) {
            count.textContent = library.length;
        }
    }

    function toggleBookmark() {
        const library = getLibrary();
        const currentSlug = getCurrentSlug();
        const index = library.indexOf(currentSlug);

        if (index > -1) {
            library.splice(index, 1);
        } else {
            library.push(currentSlug);
        }

        saveLibrary(library);
        updateUI();
    }

    // Initialize when DOM ready
    function init() {
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', toggleBookmark);
            updateUI();
        }
    }

    // Run on DOMContentLoaded or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for manual use if needed
    window.BlogBookmark = {
        getLibrary,
        saveLibrary,
        toggleBookmark,
        updateUI
    };
})();
