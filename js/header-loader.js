/**
 * Header Loader - Lädt den Master-Header in alle Seiten
 *
 * Verwendung:
 * 1. Im HTML: <div id="header-placeholder"></div>
 * 2. Am Ende der Seite: <script src="js/header-loader.js"></script>
 *
 * Oder automatisch: Ersetzt vorhandene <header> Tags
 */

(function() {
    'use strict';

    // Header-Datei Pfad (relativ zum Root)
    const HEADER_PATH = 'components/header.html';

    // Navigation Functions
    window.toggleMobileNav = function() {
        const nav = document.getElementById('mainNav');
        if (nav) {
            nav.classList.toggle('mobile-open');
        }
    };

    window.toggleDropdown = function(element, event) {
        if (window.innerWidth <= 992) {
            event.preventDefault();
            event.stopPropagation();
            element.classList.toggle('open');
        }
    };

    window.toggleContactDropdown = function(element, event) {
        event.preventDefault();
        event.stopPropagation();
        const menu = element.nextElementSibling;
        if (menu) {
            menu.classList.toggle('active');
        }
    };

    window.bookCall = function() {
        window.open('https://cal.com/kathrinstahl', '_blank');
    };

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        const nav = document.getElementById('mainNav');
        const menuToggle = document.querySelector('.menu-toggle');

        if (nav && menuToggle && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
            nav.classList.remove('mobile-open');
            // Close all open dropdowns
            document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }

        // Close contact dropdown
        document.querySelectorAll('.contact-dropdown-menu.active').forEach(menu => {
            if (!menu.parentElement.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    });

    // Header laden
    async function loadHeader() {
        try {
            // Prüfe ob Placeholder existiert
            let placeholder = document.getElementById('header-placeholder');
            let existingHeader = document.querySelector('header');

            if (!placeholder && !existingHeader) {
                console.warn('Header-Loader: Kein header-placeholder oder <header> gefunden');
                return;
            }

            const response = await fetch(HEADER_PATH);
            if (!response.ok) {
                throw new Error(`Header konnte nicht geladen werden: ${response.status}`);
            }

            const headerHTML = await response.text();

            if (placeholder) {
                placeholder.outerHTML = headerHTML;
            } else if (existingHeader) {
                existingHeader.outerHTML = headerHTML;
            }

            console.log('Header erfolgreich geladen');
        } catch (error) {
            console.error('Header-Loader Fehler:', error);
        }
    }

    // Header laden wenn DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeader);
    } else {
        loadHeader();
    }
})();
