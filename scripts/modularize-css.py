#!/usr/bin/env python3
"""
CSS Modularisierung Script
Teilt große CSS-Dateien in logische Module auf
"""

import re
from pathlib import Path

# Pfade
BASE_DIR = Path(__file__).parent.parent
CSS_DIR = BASE_DIR / "css"

# Sektions-Mapping für modern-design.css
SECTION_MAPPING = {
    "CSS VARIABLES": ("core/variables.css", "CSS Custom Properties - Design System"),
    "GLOBAL RESET": ("core/reset.css", "Global Reset & Base Styles"),
    "TYPOGRAPHY": ("core/typography.css", "Typography - Headings, Text, Links"),
    "HEADER & NAVIGATION": ("components/header.css", "Header & Navigation Components"),
    "LAYOUT": ("core/layout.css", "Layout - Container, Grid, Spacing"),
    "BUTTONS": ("components/buttons.css", "Button Styles & CTAs"),
    "CARDS": ("components/cards.css", "Card Components"),
    "FORMS": ("components/forms.css", "Form Elements"),
    "FOOTER": ("components/footer.css", "Footer Styles"),
    "ANIMATIONS": ("utilities/animations.css", "Animations & Transitions"),
    "UTILITIES": ("utilities/helpers.css", "Utility Classes"),
    "RESPONSIVE": ("utilities/responsive.css", "Responsive Breakpoints"),
    "PRINT": ("utilities/print.css", "Print Styles"),
}

def extract_section_name(line):
    """Extrahiert den Sektionsnamen aus einem Kommentar"""
    # Suche nach "/* ----- SECTION NAME -----" Pattern
    match = re.search(r'/\*[\s\-]*([\w\s&]+?)[\s\-]*\*/', line)
    if match:
        return match.group(1).strip().upper()

    # Suche nach "SECTION NAME" in der Zeile
    for key in SECTION_MAPPING.keys():
        if key in line.upper():
            return key
    return None

def parse_css_file(filepath):
    """Parst eine CSS-Datei und identifiziert Sektionen"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    sections = []
    current_section = None
    current_content = []

    for i, line in enumerate(lines):
        # Prüfe auf Sektions-Header
        if line.startswith('/* ---') or line.startswith('/* ==='):
            # Prüfe die nächste Zeile für den Sektionsnamen
            if i + 1 < len(lines):
                section_name = extract_section_name(lines[i + 1] if '---' in lines[i + 1] or '===' in lines[i + 1] else lines[i])
                if not section_name:
                    section_name = extract_section_name(line)

            # Speichere vorherige Sektion
            if current_section and current_content:
                sections.append((current_section, '\n'.join(current_content)))

            current_section = section_name or f"SECTION_{len(sections)}"
            current_content = [line]
        else:
            current_content.append(line)

    # Letzte Sektion speichern
    if current_section and current_content:
        sections.append((current_section, '\n'.join(current_content)))

    return sections

def write_module(filepath, content, description):
    """Schreibt ein CSS-Modul mit Header"""
    header = f"""/* ============================================
   {description}
   Kathrin Coaching Website
   ============================================ */

"""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(header + content.strip() + '\n')
    print(f"  ✓ {filepath.relative_to(BASE_DIR)} ({len(content.split(chr(10)))} Zeilen)")

def modularize_modern_design():
    """Modularisiert modern-design.css"""
    source = BASE_DIR / "modern-design.css"

    if not source.exists():
        print(f"❌ {source} nicht gefunden!")
        return

    print(f"\n📦 Modularisiere {source.name}...")

    with open(source, 'r', encoding='utf-8') as f:
        content = f.read()

    # Manuelles Aufteilen basierend auf Kommentar-Markern
    # Da die automatische Erkennung komplex ist, teilen wir manuell

    sections = {}
    current_section = "HEADER"
    lines = content.split('\n')

    # Finde die Sektionsgrenzen
    section_starts = []
    for i, line in enumerate(lines):
        if '/* ---' in line or '/* ===' in line:
            # Suche den Sektionsnamen in dieser oder der nächsten Zeile
            name = None
            for j in range(max(0, i-1), min(len(lines), i+3)):
                for key in SECTION_MAPPING.keys():
                    if key in lines[j].upper():
                        name = key
                        break
                if name:
                    break
            if name:
                section_starts.append((i, name))

    print(f"  Gefundene Sektionen: {[s[1] for s in section_starts]}")

    # Extrahiere jede Sektion
    for idx, (start, name) in enumerate(section_starts):
        end = section_starts[idx + 1][0] if idx + 1 < len(section_starts) else len(lines)
        section_content = '\n'.join(lines[start:end])

        if name in SECTION_MAPPING:
            target_path, description = SECTION_MAPPING[name]
            target = CSS_DIR / target_path
            write_module(target, section_content, description)

def create_main_css():
    """Erstellt main.css mit allen Imports"""
    imports = """/* ============================================
   MAIN CSS - Imports all modules
   Kathrin Coaching Website
   ============================================ */

/* Core */
@import url('core/variables.css');
@import url('core/reset.css');
@import url('core/typography.css');
@import url('core/layout.css');

/* Components */
@import url('components/header.css');
@import url('components/footer.css');
@import url('components/buttons.css');
@import url('components/cards.css');
@import url('components/forms.css');

/* Utilities */
@import url('utilities/helpers.css');
@import url('utilities/animations.css');

/* Pages - load separately per page */
/* @import url('pages/blog.css'); */
/* @import url('pages/videos.css'); */
/* @import url('pages/quiz.css'); */
"""

    target = CSS_DIR / "main.css"
    with open(target, 'w', encoding='utf-8') as f:
        f.write(imports)
    print(f"\n✓ {target.relative_to(BASE_DIR)} erstellt")

if __name__ == "__main__":
    print("🔧 CSS Modularisierung gestartet...")
    modularize_modern_design()
    create_main_css()
    print("\n✅ Fertig!")
