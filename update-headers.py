#!/usr/bin/env python3
"""
Update Headers Script
Überträgt den vollständigen Header von index.html auf alle anderen HTML-Seiten
"""

import os
import re
from pathlib import Path

# Header HTML aus index.html (vollständig mit Dropdowns)
FULL_HEADER_HTML = '''<!-- Header -->
<header>
<div class="container header-inner">
<a class="logo" href="index.html">KATHRIN STAHL</a>
<nav id="mainNav">
<div class="nav-dropdown" onclick="toggleDropdown(this, event)">
<span class="nav-link">Angebote</span>
<div aria-label="Angebote" class="dropdown-menu" role="menu">
<a href="index.html#angebote" role="menuitem">
<span class="dropdown-icon">👤</span>
<span class="dropdown-text">
<strong>1:1 Coaching</strong>
<span>Einzelbegleitung online &amp; vor Ort</span>
</span>
</a>
<a href="index.html#angebote" role="menuitem">
<span class="dropdown-icon beziehung">♥</span>
<span class="dropdown-text">
<strong>Paar-Coaching</strong>
<span>Beziehungskrisen gemeinsam meistern</span>
</span>
</a>
<a href="paar-retreat.html" role="menuitem">
<span class="dropdown-icon">♥♥</span>
<span class="dropdown-text">
<strong>Paar-Retreat Portugal</strong>
<span>5 Tage für eure Beziehung</span>
</span>
</a>
<a href="index.html#angebote" role="menuitem">
<span class="dropdown-icon">🌿</span>
<span class="dropdown-text">
<strong>Retreats in Portugal</strong>
<span>Auszeit im Alentejo</span>
</span>
</a>
<a href="pferdegestuetztes-coaching.html" role="menuitem">
<span class="dropdown-icon">🐴</span>
<span class="dropdown-text">
<strong>Pferdegestütztes Coaching</strong>
<span>Meine Methode erklärt</span>
</span>
</a>
<a href="casinha.html" role="menuitem">
<span class="dropdown-icon">🏡</span>
<span class="dropdown-text">
<strong>Die Casinha</strong>
<span>Deine Unterkunft im Alentejo</span>
</span>
</a>
</div>
</div>
<div class="nav-dropdown" onclick="toggleDropdown(this, event)">
<span class="nav-link">Selbsttests</span>
<div aria-label="Selbsttests" class="dropdown-menu" role="menu">
<a href="quiz-hochsensibel.html" role="menuitem">
<span class="dropdown-icon hsp">HSP</span>
<span class="dropdown-text">
<strong>Hochsensibel?</strong>
<span>HSPS-Test nach Elaine Aron</span>
</span>
</a>
<a href="quiz-hochbegabt.html" role="menuitem">
<span class="dropdown-icon iq">OE</span>
<span class="dropdown-text">
<strong>Intensitäts-Profil</strong>
<span>Overexcitabilities nach Dabrowski</span>
</span>
</a>
<a href="quiz-beziehung.html" role="menuitem">
<span class="dropdown-icon beziehung">♥</span>
<span class="dropdown-text">
<strong>Beziehungs-Check</strong>
<span>Four Horsemen nach Gottman</span>
</span>
</a>
<a href="quiz-lebenskrise.html" role="menuitem">
<span class="dropdown-icon burnout">CBI</span>
<span class="dropdown-text">
<strong>Burnout-Test</strong>
<span>Copenhagen Burnout Inventory</span>
</span>
</a>
<a href="quiz-midlife.html" role="menuitem">
<span class="dropdown-icon midlife">40+</span>
<span class="dropdown-text">
<strong>Midlife Crisis</strong>
<span>CMCM-Fragebogen</span>
</span>
</a>
<a href="quiz-paar-kompass.html" role="menuitem">
<span class="dropdown-icon beziehung">♥♥</span>
<span class="dropdown-text">
<strong>Paar-Kompass</strong>
<span>Wo steht eure Beziehung?</span>
</span>
</a>
</div>
</div>
<a href="index.html#blog">Blog</a>
<a href="media.html">Videos</a>
<a href="index.html#ueber">Über mich</a>
<div class="contact-dropdown">
<a class="contact-dropdown-trigger" href="index.html#kontakt" onclick="toggleContactDropdown(this, event)">Kontakt</a>
<div class="contact-dropdown-menu">
<a class="contact-item" href="https://wa.me/4915140436795" target="_blank">
<span class="contact-icon">💬</span>
<span>WhatsApp</span>
</a>
<a class="contact-item" href="mailto:kathrin@kathrinstahl.com">
<span class="contact-icon">✉️</span>
<span>E-Mail</span>
</a>
<a class="contact-item" href="https://cal.com/kathrinstahl" target="_blank">
<span class="contact-icon">📅</span>
<span>Erstgespräch buchen</span>
</a>
</div>
</div>
<a class="nav-cta" href="#" onclick="bookCall(); return false;">Gespräch buchen</a>
</nav>
<button aria-label="Menu öffnen" class="menu-toggle" onclick="toggleMobileNav()">
<span></span>
<span></span>
<span></span>
</button>
</div>
</header>'''

# Header CSS (zusätzliche Styles die evtl. fehlen)
HEADER_CSS = '''
        /* ===== HEADER ===== */
        header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0,0,0,0.05);
            transition: transform 0.3s ease;
        }

        .header-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 80px;
        }

        .logo {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 500;
            color: var(--color-primary);
            letter-spacing: 0.05em;
            text-decoration: none;
        }

        nav {
            display: flex;
            align-items: center;
            gap: 35px;
        }

        nav > a, .nav-dropdown > .nav-link {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--color-text);
            text-decoration: none;
            transition: color 0.2s;
        }

        nav > a:hover, .nav-dropdown:hover > .nav-link {
            color: var(--color-primary);
        }

        /* Dropdown Navigation */
        .nav-dropdown {
            position: relative;
        }

        .nav-dropdown > .nav-link {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            padding: 8px 0;
        }

        .nav-dropdown > .nav-link::after {
            content: '';
            border: solid var(--color-text);
            border-width: 0 1.5px 1.5px 0;
            display: inline-block;
            padding: 2.5px;
            transform: rotate(45deg);
            transition: transform 0.2s, border-color 0.2s;
            margin-top: -2px;
        }

        .nav-dropdown:hover > .nav-link::after {
            transform: rotate(-135deg);
            border-color: var(--color-primary);
        }

        .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            background: var(--color-white);
            min-width: 300px;
            max-width: 340px;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
            border-radius: 12px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.2);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
            z-index: 9999;
            padding: 12px 0;
            border: 1px solid rgba(0,0,0,0.08);
        }

        .nav-dropdown:last-of-type .dropdown-menu,
        .nav-dropdown:nth-last-of-type(2) .dropdown-menu {
            left: auto;
            right: 0;
            transform: translateY(10px);
        }

        .nav-dropdown:last-of-type:hover .dropdown-menu,
        .nav-dropdown:nth-last-of-type(2):hover .dropdown-menu {
            transform: translateY(0);
        }

        .nav-dropdown:hover .dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
        }

        .dropdown-menu a {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 20px;
            font-size: 0.9rem;
            color: var(--color-text);
            text-decoration: none;
            transition: background 0.2s, color 0.2s;
            white-space: nowrap;
        }

        .dropdown-menu a:hover {
            background: var(--color-cream);
            color: var(--color-primary);
        }

        /* Contact Dropdown in Header */
        .contact-dropdown {
            position: relative;
            display: inline-block;
        }

        .contact-dropdown-trigger {
            cursor: pointer;
        }

        .contact-dropdown .contact-dropdown-menu {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            background: white;
            border-radius: 16px;
            padding: 10px 0;
            min-width: 220px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.15);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
        }

        .contact-dropdown .contact-dropdown-menu.active {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
        }

        .contact-dropdown .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            color: var(--color-text);
            text-decoration: none;
            transition: all 0.2s ease;
        }

        .contact-dropdown .contact-item:hover {
            background: var(--color-cream);
            color: var(--color-primary);
        }

        .contact-dropdown .contact-icon {
            font-size: 1.2rem;
        }

        .dropdown-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.75rem;
            color: #fff;
            flex-shrink: 0;
        }

        .dropdown-icon.hsp { background: linear-gradient(135deg, #D2AB74, #c9a066); }
        .dropdown-icon.iq { background: linear-gradient(135deg, #1a5276, #2471a3); }
        .dropdown-icon.beziehung { background: linear-gradient(135deg, #e74c3c, #c0392b); }
        .dropdown-icon.burnout { background: linear-gradient(135deg, #2c3e50, #34495e); }
        .dropdown-icon.midlife { background: linear-gradient(135deg, #6c3483, #8e44ad); }

        .dropdown-text {
            display: flex;
            flex-direction: column;
            min-width: 0;
            flex: 1;
        }

        .dropdown-text strong {
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--color-text);
            line-height: 1.3;
        }

        .dropdown-text span {
            font-size: 0.75rem;
            color: var(--color-text-light);
            margin-top: 3px;
            line-height: 1.3;
            white-space: normal;
        }

        .nav-cta {
            background: var(--color-accent);
            color: var(--color-white) !important;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.2s, transform 0.2s;
        }

        .nav-cta:hover {
            background: var(--color-accent-dark);
            transform: translateY(-1px);
        }

        /* Mobile Menu */
        .menu-toggle {
            display: none;
            flex-direction: column;
            gap: 5px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 10px;
        }

        .menu-toggle span {
            width: 24px;
            height: 2px;
            background: var(--color-text);
            transition: 0.3s;
        }

        /* Tablet Portrait - Mobile Navigation */
        @media (max-width: 992px) {
            nav {
                display: none;
            }

            nav.mobile-open {
                display: flex;
                position: absolute;
                top: 80px;
                left: 0;
                right: 0;
                flex-direction: column;
                background: white;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                gap: 0;
            }

            nav.mobile-open > a,
            nav.mobile-open .nav-dropdown {
                padding: 15px 0;
                border-bottom: 1px solid rgba(0,0,0,0.05);
            }

            nav.mobile-open .nav-dropdown > .nav-link {
                padding: 0;
            }

            nav.mobile-open .dropdown-menu {
                position: static;
                transform: none;
                opacity: 1;
                visibility: visible;
                box-shadow: none;
                border: none;
                padding: 10px 0 0 0;
                min-width: 100%;
                max-width: 100%;
                max-height: none;
                overflow-y: visible;
                display: none;
                background: var(--color-cream);
                border-radius: 8px;
                margin-top: 10px;
            }

            nav.mobile-open .nav-dropdown.open .dropdown-menu {
                display: block;
            }

            nav.mobile-open .dropdown-menu a {
                padding: 14px 15px;
                border-bottom: 1px solid rgba(0,0,0,0.05);
            }

            nav.mobile-open .dropdown-menu a:last-child {
                border-bottom: none;
            }

            nav.mobile-open .dropdown-icon {
                width: 40px;
                height: 40px;
                font-size: 0.8rem;
            }

            nav.mobile-open .dropdown-text strong {
                font-size: 0.95rem;
            }

            nav.mobile-open .dropdown-text span {
                font-size: 0.8rem;
                line-height: 1.4;
            }

            nav.mobile-open .nav-cta {
                margin-top: 15px;
                text-align: center;
            }

            .menu-toggle {
                display: flex;
            }
        }
'''

# Header JavaScript
HEADER_JS = '''
    // Mobile menu toggle
    function toggleMobileNav() {
        const nav = document.getElementById('mainNav');
        nav.classList.toggle('mobile-open');
    }

    // Dropdown toggle for mobile
    function toggleDropdown(element, event) {
        if (window.innerWidth <= 992) {
            event.preventDefault();
            event.stopPropagation();
            element.classList.toggle('open');
        }
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        const nav = document.getElementById('mainNav');
        const menuToggle = document.querySelector('.menu-toggle');
        if (nav && menuToggle && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
            nav.classList.remove('mobile-open');
        }
    });

    // Contact dropdown toggle
    function toggleContactDropdown(btn, event) {
        event.preventDefault();
        event.stopPropagation();
        const dropdown = btn.closest('.contact-dropdown');
        const menu = dropdown.querySelector('.contact-dropdown-menu');
        menu.classList.toggle('active');
    }

    // Close contact dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.contact-dropdown-menu');
        dropdowns.forEach(menu => {
            if (!menu.closest('.contact-dropdown').contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    });

    // Book call function
    function bookCall() {
        window.open('https://cal.com/kathrinstahl', '_blank');
    }
'''

def update_header_in_file(filepath):
    """Ersetzt den Header in einer HTML-Datei"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern um den Header zu finden und zu ersetzen
    # Sucht nach <!-- Header --> oder <header> bis </header>
    header_pattern = r'(?:<!-- Header -->[\s\n]*)?<header>.*?</header>'

    if not re.search(header_pattern, content, re.DOTALL):
        print(f"  Kein Header gefunden in {filepath}")
        return False

    # Header ersetzen
    new_content = re.sub(header_pattern, FULL_HEADER_HTML, content, flags=re.DOTALL)

    if new_content == content:
        print(f"  Keine Änderung nötig in {filepath}")
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  ✓ Header aktualisiert in {filepath}")
    return True

def main():
    """Hauptfunktion"""
    # Seiten die aktualisiert werden sollen
    pages_to_update = [
        # Quiz-Seiten
        'quiz-hochsensibel.html',
        'quiz-hochbegabt.html',
        'quiz-beziehung.html',
        'quiz-lebenskrise.html',
        'quiz-midlife.html',
        'quiz-paar-kompass.html',
        # Portugal-Seiten
        'paar-retreat.html',
        'pferdegestuetztes-coaching.html',
        'casinha.html',
        # Weitere Seiten
        'kathrin.html',
        'impressum.html',
        'datenschutzerklaerung.html',
        'media.html',
        'blog.html',
    ]

    base_path = Path(__file__).parent
    updated_count = 0

    print("Header-Update gestartet...")
    print("-" * 50)

    for page in pages_to_update:
        filepath = base_path / page
        if filepath.exists():
            if update_header_in_file(filepath):
                updated_count += 1
        else:
            print(f"  Datei nicht gefunden: {page}")

    print("-" * 50)
    print(f"Fertig! {updated_count} Seiten aktualisiert.")
    print("\nHinweis: Stelle sicher, dass die Header-CSS und JS auf allen Seiten vorhanden sind!")

if __name__ == '__main__':
    main()
