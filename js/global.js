// global.js - Globale JavaScript-Funktionen für alle Seiten
// Version 1.0 - 2025-12-09

// ===== MOBILE NAVIGATION =====
function toggleMobileNav() {
    const nav = document.getElementById('mainNav');
    if (nav) {
        nav.classList.toggle('mobile-open');
    }
}

// ===== DROPDOWN TOGGLE (Mobile) =====
function toggleDropdown(element, event) {
    if (window.innerWidth <= 992) {
        event.preventDefault();
        event.stopPropagation();
        element.classList.toggle('open');
    }
}

// ===== CONTACT DROPDOWN =====
function toggleContactDropdown(btn, event) {
    event.preventDefault();
    event.stopPropagation();
    const dropdown = btn.closest('.contact-dropdown');
    const menu = dropdown.querySelector('.contact-dropdown-menu');
    menu.classList.toggle('active');
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

// ===== ESCAPE KEY CLOSES MENUS =====
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close mobile menu
        const nav = document.getElementById('mainNav');
        if (nav) nav.classList.remove('mobile-open');

        // Close contact dropdown
        const contactDropdowns = document.querySelectorAll('.contact-dropdown-menu');
        contactDropdowns.forEach(menu => menu.classList.remove('active'));

        // Close any open dropdowns
        const openDropdowns = document.querySelectorAll('.nav-dropdown.open');
        openDropdowns.forEach(dropdown => dropdown.classList.remove('open'));
    }
});

// ===== LOG VERSION =====
console.log('Kathrin Coaching - Global JS v1.0 loaded');
