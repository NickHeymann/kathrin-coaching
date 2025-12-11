// global.js - Globale JavaScript-Funktionen für alle Seiten
// Version 2.0 - 2025-12-11 (WCAG 2.1 AA ARIA Support)

// ===== ARIA SETUP (run on DOMContentLoaded) =====
document.addEventListener('DOMContentLoaded', function() {
    // Add ARIA attributes to all dropdowns
    document.querySelectorAll('.nav-dropdown').forEach((dropdown, index) => {
        const trigger = dropdown.querySelector('.nav-link');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (trigger && menu) {
            const menuId = 'dropdown-menu-' + index;
            trigger.setAttribute('role', 'button');
            trigger.setAttribute('aria-haspopup', 'true');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-controls', menuId);
            trigger.setAttribute('tabindex', '0');
            menu.setAttribute('id', menuId);
            menu.setAttribute('aria-hidden', 'true');
        }
    });

    // Contact dropdown ARIA
    const contactDropdown = document.querySelector('.contact-dropdown');
    if (contactDropdown) {
        const trigger = contactDropdown.querySelector('.contact-dropdown-trigger');
        const menu = contactDropdown.querySelector('.contact-dropdown-menu');
        if (trigger && menu) {
            trigger.setAttribute('aria-haspopup', 'true');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-controls', 'contact-menu');
            menu.setAttribute('id', 'contact-menu');
            menu.setAttribute('role', 'menu');
            menu.setAttribute('aria-hidden', 'true');
            menu.querySelectorAll('a').forEach(link => link.setAttribute('role', 'menuitem'));
        }
    }

    // Mobile menu button ARIA
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.getElementById('mainNav');
    if (menuToggle && mainNav) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-controls', 'mainNav');
    }
});

// ===== MOBILE NAVIGATION =====
function toggleMobileNav() {
    const nav = document.getElementById('mainNav');
    const menuToggle = document.querySelector('.menu-toggle');
    if (nav && menuToggle) {
        const isOpen = nav.classList.toggle('mobile-open');
        menuToggle.setAttribute('aria-expanded', isOpen.toString());
        menuToggle.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
    }
}

// ===== DROPDOWN TOGGLE (Mobile) with ARIA =====
function toggleDropdown(element, event) {
    if (window.innerWidth <= 992) {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = element.classList.toggle('open');
        const trigger = element.querySelector('.nav-link');
        const menu = element.querySelector('.dropdown-menu');
        if (trigger) {
            trigger.setAttribute('aria-expanded', isOpen.toString());
        }
        if (menu) {
            menu.setAttribute('aria-hidden', (!isOpen).toString());
        }
    }
}

// ===== CONTACT DROPDOWN with ARIA =====
function toggleContactDropdown(btn, event) {
    event.preventDefault();
    event.stopPropagation();
    const dropdown = btn.closest('.contact-dropdown');
    const menu = dropdown.querySelector('.contact-dropdown-menu');
    const isActive = menu.classList.toggle('active');
    btn.setAttribute('aria-expanded', isActive.toString());
    menu.setAttribute('aria-hidden', (!isActive).toString());
}

// ===== BOOK CALL =====
function bookCall() {
    window.open('https://cal.com/kathrinstahl', '_blank');
}

// ===== CLOSE MENUS ON OUTSIDE CLICK =====
document.addEventListener('click', function(e) {
    // Close contact dropdown
    const contactDropdowns = document.querySelectorAll('.contact-dropdown-menu');
    contactDropdowns.forEach(menu => {
        if (menu && menu.closest('.contact-dropdown') && !menu.closest('.contact-dropdown').contains(e.target)) {
            menu.classList.remove('active');
        }
    });

    // Close mobile menu
    const nav = document.getElementById('mainNav');
    const menuToggle = document.querySelector('.menu-toggle');
    if (nav && menuToggle && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
        nav.classList.remove('mobile-open');
    }
});

// ===== HEADER SCROLL BEHAVIOR =====
let lastScrollY = 0;
const header = document.querySelector('header');

if (header) {
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // Hide header on scroll down, show on scroll up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    });
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId !== '#') {
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const nav = document.getElementById('mainNav');
                if (nav) nav.classList.remove('mobile-open');
            }
        }
    });
});

// ===== KEYBOARD NAVIGATION (WCAG 2.1 AA) =====
document.addEventListener('keydown', function(e) {
    // Escape closes all menus
    if (e.key === 'Escape') {
        closeAllMenus();
    }

    // Enter/Space on dropdown triggers
    if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target;
        if (target.classList.contains('nav-link') && target.closest('.nav-dropdown')) {
            e.preventDefault();
            const dropdown = target.closest('.nav-dropdown');
            toggleDropdown(dropdown, e);
        }
    }

    // Arrow key navigation in dropdown menus
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const activeElement = document.activeElement;
        const dropdown = activeElement.closest('.dropdown-menu') ||
                         activeElement.closest('.contact-dropdown-menu');
        if (dropdown) {
            e.preventDefault();
            const items = dropdown.querySelectorAll('a[role="menuitem"], a');
            const currentIndex = Array.from(items).indexOf(activeElement);
            let nextIndex;
            if (e.key === 'ArrowDown') {
                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            } else {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            }
            items[nextIndex].focus();
        }
    }
});

// ===== CLOSE ALL MENUS with ARIA updates =====
function closeAllMenus() {
    // Close mobile menu
    const nav = document.getElementById('mainNav');
    const menuToggle = document.querySelector('.menu-toggle');
    if (nav) {
        nav.classList.remove('mobile-open');
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', 'Menü öffnen');
        }
    }

    // Close contact dropdown
    const contactDropdowns = document.querySelectorAll('.contact-dropdown-menu');
    contactDropdowns.forEach(menu => {
        menu.classList.remove('active');
        menu.setAttribute('aria-hidden', 'true');
        const trigger = menu.closest('.contact-dropdown')?.querySelector('.contact-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });

    // Close any open nav dropdowns
    const openDropdowns = document.querySelectorAll('.nav-dropdown.open');
    openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('open');
        const trigger = dropdown.querySelector('.nav-link');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (menu) menu.setAttribute('aria-hidden', 'true');
    });
}

// ===== EVENT DELEGATION (CSP-SAFE - no inline onclick needed) =====
document.addEventListener('click', function(e) {
    const target = e.target;

    // Nav dropdown toggle
    const navDropdown = target.closest('.nav-dropdown');
    if (navDropdown && (target.classList.contains('nav-link') || target.closest('.nav-link'))) {
        toggleDropdown(navDropdown, e);
        return;
    }

    // Contact dropdown toggle
    const contactTrigger = target.closest('.contact-dropdown-trigger');
    if (contactTrigger) {
        toggleContactDropdown(contactTrigger, e);
        return;
    }

    // Mobile menu toggle
    if (target.closest('.menu-toggle')) {
        toggleMobileNav();
        return;
    }

    // Quiz likert options (delegated) - supports multiple quiz function names
    const likertOption = target.closest('.likert-option');
    if (likertOption) {
        const value = parseInt(likertOption.dataset.value || likertOption.querySelector('.likert-value')?.textContent);
        if (!isNaN(value)) {
            // Try different quiz function names
            if (typeof selectLikert === 'function') {
                selectLikert(likertOption, value);
            } else if (typeof selectOption === 'function') {
                selectOption(likertOption, value);
            } else if (typeof selectAnswer === 'function') {
                selectAnswer(likertOption, value);
            }
        }
        return;
    }

    // Quiz frequency options
    const freqOption = target.closest('.frequency-option');
    if (freqOption) {
        const value = parseInt(freqOption.dataset.value || freqOption.querySelector('span')?.textContent);
        if (!isNaN(value)) {
            if (typeof selectFrequency === 'function') {
                selectFrequency(freqOption, value);
            }
        }
        return;
    }

    // Science/Info box toggle
    const scienceBoxHeader = target.closest('.science-box-header');
    if (scienceBoxHeader && typeof toggleScienceBox === 'function') {
        toggleScienceBox();
        return;
    }

    const infoBoxHeader = target.closest('.info-box-header');
    if (infoBoxHeader && typeof toggleInfoBox === 'function') {
        toggleInfoBox();
        return;
    }

    // Book call button
    if (target.closest('[data-action="bookCall"]') || target.closest('.cta-button')) {
        if (typeof bookCall === 'function') {
            bookCall();
        }
        return;
    }
});

// ===== LOG VERSION =====
console.log('Kathrin Coaching - Global JS v2.1 loaded (WCAG 2.1 AA + CSP-safe)');
