#!/usr/bin/env python3
"""
Add Header JavaScript Functions
Fügt die benötigten Header-Navigation-Funktionen zu allen Seiten hinzu
"""

import re
from pathlib import Path

# JavaScript-Code der hinzugefügt werden muss
HEADER_JS = '''
// ===== HEADER NAVIGATION FUNCTIONS =====
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
        if (menu && menu.closest('.contact-dropdown') && !menu.closest('.contact-dropdown').contains(e.target)) {
            menu.classList.remove('active');
        }
    });
});

// Mobile menu toggle (falls noch nicht vorhanden)
if (typeof toggleMobileNav === 'undefined') {
    function toggleMobileNav() {
        const nav = document.getElementById('mainNav');
        if (nav) nav.classList.toggle('mobile-open');
    }
}

// Dropdown toggle for mobile (falls noch nicht vorhanden)
if (typeof toggleDropdown === 'undefined') {
    function toggleDropdown(element, event) {
        if (window.innerWidth <= 992) {
            event.preventDefault();
            event.stopPropagation();
            element.classList.toggle('open');
        }
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

// Book call function (falls noch nicht vorhanden)
if (typeof bookCall === 'undefined') {
    function bookCall() {
        window.open('https://cal.com/kathrinstahl', '_blank');
    }
}
'''

def add_js_to_file(filepath):
    """Fügt Header-JS zu einer HTML-Datei hinzu"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Prüfe ob die Funktion toggleContactDropdown bereits DEFINIERT ist (nicht nur aufgerufen)
    if 'function toggleContactDropdown' in content:
        print(f"  JS bereits vorhanden in {filepath}")
        return False

    # Finde das letzte </script> vor </body>
    # Suche nach </script> gefolgt von </body>
    pattern = r'(</script>)\s*(</body>)'
    match = re.search(pattern, content, re.IGNORECASE)

    if match:
        # Füge JS vor dem letzten </script> ein
        insert_pos = match.start()
        new_content = content[:insert_pos] + HEADER_JS + '\n' + content[insert_pos:]

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"  ✓ JS hinzugefügt in {filepath}")
        return True
    else:
        # Versuche vor </body> ein neues Script-Tag einzufügen
        body_pattern = r'(</body>)'
        match = re.search(body_pattern, content, re.IGNORECASE)

        if match:
            insert_pos = match.start()
            new_content = content[:insert_pos] + f'\n<script>{HEADER_JS}\n</script>\n' + content[insert_pos:]

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

            print(f"  ✓ JS (neues Script) hinzugefügt in {filepath}")
            return True

    print(f"  Konnte JS nicht einfügen in {filepath}")
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

    print("Header-JS-Update gestartet...")
    print("-" * 50)

    for page in pages_to_update:
        filepath = base_path / page
        if filepath.exists():
            if add_js_to_file(filepath):
                updated_count += 1
        else:
            print(f"  Datei nicht gefunden: {page}")

    print("-" * 50)
    print(f"Fertig! {updated_count} Seiten aktualisiert.")

if __name__ == '__main__':
    main()
