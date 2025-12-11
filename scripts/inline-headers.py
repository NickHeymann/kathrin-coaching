#!/usr/bin/env python3
"""
Inline Header Script
====================
Ersetzt <div id="header-placeholder"></div> durch den echten Header-HTML
und stellt sicher, dass das Header-CSS im <head> verlinkt ist.

Dies ist die stabilste Lösung:
- Kein dynamisches JavaScript-Laden
- Sofortiges CSS-Rendering
- Bessere Performance und SEO
"""

import os
import re
from pathlib import Path

# Pfade
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
HEADER_FILE = ROOT_DIR / "components" / "header.html"
HEADER_CSS = "css/components/header.css"

# Dateien die übersprungen werden
SKIP_FILES = [
    "components/header.html",
    "templates/blog-post-template.html",
    "_archive",
    "blog-editor-modular.html",
    "cms/",
    "ANLEITUNG"
]

def should_skip(filepath):
    """Prüft ob eine Datei übersprungen werden soll"""
    filepath_str = str(filepath)
    for skip in SKIP_FILES:
        if skip in filepath_str:
            return True
    return False

def read_header():
    """Liest den kanonischen Header"""
    with open(HEADER_FILE, 'r', encoding='utf-8') as f:
        return f.read().strip()

def add_header_css_link(content):
    """Fügt den Header-CSS Link hinzu falls nicht vorhanden"""
    # Prüfe ob header.css schon verlinkt ist
    if 'header.css' in content:
        return content, False

    # Finde </head> und füge CSS-Link davor ein
    head_close = content.find('</head>')
    if head_close == -1:
        return content, False

    css_link = f'\n<link rel="stylesheet" href="{HEADER_CSS}">\n'
    new_content = content[:head_close] + css_link + content[head_close:]
    return new_content, True

def replace_placeholder(content, header_html):
    """Ersetzt den header-placeholder durch echten Header"""
    # Pattern für verschiedene Varianten des Placeholders
    patterns = [
        r'<div id="header-placeholder"></div>',
        r'<div id="header-placeholder">\s*</div>',
        r"<div id='header-placeholder'></div>",
        r'<!-- Header -->\s*<div id="header-placeholder"></div>',
    ]

    for pattern in patterns:
        if re.search(pattern, content):
            # Ersetze mit Header (behalte den Kommentar)
            replacement = f'<!-- Header -->\n{header_html}'
            content = re.sub(pattern, replacement, content)
            return content, True

    return content, False

def remove_header_loader_script(content):
    """Entfernt das header-loader.js Script (optional, da es jetzt unnötig ist)"""
    # Wir behalten es, da es auch Navigation-Funktionen enthält
    # Die loadHeader-Funktion wird einfach nichts tun wenn kein Placeholder existiert
    return content, False

def process_file(filepath, header_html, dry_run=False):
    """Verarbeitet eine einzelne HTML-Datei"""
    if should_skip(filepath):
        return None

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes = []

    # 1. Header-CSS Link hinzufügen
    content, css_added = add_header_css_link(content)
    if css_added:
        changes.append("CSS-Link hinzugefügt")

    # 2. Placeholder ersetzen
    content, placeholder_replaced = replace_placeholder(content, header_html)
    if placeholder_replaced:
        changes.append("Header eingefügt")

    # Nur schreiben wenn Änderungen vorgenommen wurden
    if content != original_content:
        if not dry_run:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        return changes

    return None

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Inline Headers in HTML-Dateien')
    parser.add_argument('--dry-run', action='store_true', help='Zeigt Änderungen ohne zu schreiben')
    args = parser.parse_args()

    print("=" * 60)
    print("Inline Header Script")
    print("=" * 60)

    # Header lesen
    header_html = read_header()
    print(f"Header geladen: {len(header_html)} Zeichen")
    print()

    # HTML-Dateien finden
    html_files = list(ROOT_DIR.glob("*.html"))
    print(f"Gefunden: {len(html_files)} HTML-Dateien im Root")
    print()

    modified_count = 0
    skipped_count = 0
    unchanged_count = 0

    for filepath in sorted(html_files):
        result = process_file(filepath, header_html, args.dry_run)

        if result is None:
            if should_skip(filepath):
                skipped_count += 1
                print(f"  SKIP: {filepath.name}")
            else:
                unchanged_count += 1
        else:
            modified_count += 1
            action = "WÜRDE ÄNDERN" if args.dry_run else "GEÄNDERT"
            print(f"  {action}: {filepath.name} ({', '.join(result)})")

    print()
    print("=" * 60)
    print(f"Zusammenfassung:")
    print(f"  Geändert:    {modified_count}")
    print(f"  Unverändert: {unchanged_count}")
    print(f"  Übersprungen: {skipped_count}")
    print("=" * 60)

    if args.dry_run:
        print("\n[DRY-RUN] Keine Dateien wurden verändert.")
        print("Führe ohne --dry-run aus um Änderungen zu speichern.")

if __name__ == "__main__":
    main()
