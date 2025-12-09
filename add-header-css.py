#!/usr/bin/env python3
"""
Add Header CSS
Fügt die benötigten Header-CSS-Styles zu allen Seiten hinzu
"""

import re
from pathlib import Path

# CSS für Contact Dropdown und Mobile Navigation
HEADER_CSS = '''
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

        /* Mobile Navigation */
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
            nav.mobile-open .nav-dropdown,
            nav.mobile-open .contact-dropdown {
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

            nav.mobile-open .contact-dropdown .contact-dropdown-menu {
                position: static;
                transform: none;
                opacity: 1;
                visibility: visible;
                box-shadow: none;
                display: none;
                background: var(--color-cream);
                border-radius: 8px;
                margin-top: 10px;
                min-width: 100%;
            }

            nav.mobile-open .contact-dropdown .contact-dropdown-menu.active {
                display: block;
            }

            .menu-toggle {
                display: flex;
            }
        }
'''

def add_css_to_file(filepath):
    """Fügt Header-CSS zu einer HTML-Datei hinzu"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Prüfe ob Contact Dropdown CSS bereits vorhanden ist
    if '.contact-dropdown .contact-dropdown-menu {' in content:
        print(f"  CSS bereits vorhanden in {filepath}")
        return False

    # Finde </style> im <head> und füge CSS davor ein
    pattern = r'(</style>)\s*</head>'
    match = re.search(pattern, content, re.IGNORECASE)

    if match:
        insert_pos = match.start()
        new_content = content[:insert_pos] + HEADER_CSS + '\n    ' + content[insert_pos:]

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"  ✓ CSS hinzugefügt in {filepath}")
        return True

    print(f"  Konnte CSS nicht einfügen in {filepath}")
    return False

def main():
    """Hauptfunktion"""
    pages_to_update = [
        'quiz-hochsensibel.html',
        'quiz-hochbegabt.html',
        'quiz-beziehung.html',
        'quiz-lebenskrise.html',
        'quiz-midlife.html',
        'quiz-paar-kompass.html',
        'paar-retreat.html',
        'pferdegestuetztes-coaching.html',
        'casinha.html',
        'kathrin.html',
        'impressum.html',
        'datenschutzerklaerung.html',
        'media.html',
        'blog.html',
    ]

    base_path = Path(__file__).parent
    updated_count = 0

    print("Header-CSS-Update gestartet...")
    print("-" * 50)

    for page in pages_to_update:
        filepath = base_path / page
        if filepath.exists():
            if add_css_to_file(filepath):
                updated_count += 1
        else:
            print(f"  Datei nicht gefunden: {page}")

    print("-" * 50)
    print(f"Fertig! {updated_count} Seiten aktualisiert.")

if __name__ == '__main__':
    main()
