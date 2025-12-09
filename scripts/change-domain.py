#!/usr/bin/env python3
"""
Domain-Wechsel Script für Kathrin Coaching Website.

Ersetzt die alte Domain durch die neue in allen HTML-Dateien.
Betrifft: canonical URLs, og:url, og:image Meta-Tags.

Verwendung:
    python3 scripts/change-domain.py neue-domain.de

Beispiel:
    python3 scripts/change-domain.py kathrinstahl.com
"""

import os
import sys
import re
from pathlib import Path

OLD_DOMAIN = "nickheymann.github.io/kathrin-coaching"

def replace_domain(filepath, old_domain, new_domain):
    """Ersetzt Domain in einer Datei."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Prüfen ob alte Domain vorhanden
    if old_domain not in content:
        return 0

    # Ersetzen
    new_content = content.replace(f"https://{old_domain}", f"https://{new_domain}")
    new_content = new_content.replace(f"http://{old_domain}", f"https://{new_domain}")

    # Speichern
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    count = content.count(old_domain)
    return count

def main():
    if len(sys.argv) != 2:
        print("Verwendung: python3 scripts/change-domain.py NEUE_DOMAIN")
        print("Beispiel: python3 scripts/change-domain.py kathrinstahl.com")
        sys.exit(1)

    new_domain = sys.argv[1]

    # Entferne http(s):// falls angegeben
    new_domain = new_domain.replace("https://", "").replace("http://", "")

    print(f"Domain-Wechsel: {OLD_DOMAIN} -> {new_domain}")
    print("=" * 60)

    base_path = Path(__file__).parent.parent
    total_replacements = 0
    files_changed = 0

    # Alle HTML-Dateien im Root-Verzeichnis
    for html_file in base_path.glob("*.html"):
        if "_archive" in str(html_file):
            continue

        count = replace_domain(str(html_file), OLD_DOMAIN, new_domain)
        if count > 0:
            print(f"  {html_file.name}: {count} Ersetzungen")
            total_replacements += count
            files_changed += 1

    # JS-Dateien (falls dort URLs sind)
    for js_file in base_path.glob("js/*.js"):
        count = replace_domain(str(js_file), OLD_DOMAIN, new_domain)
        if count > 0:
            print(f"  js/{js_file.name}: {count} Ersetzungen")
            total_replacements += count
            files_changed += 1

    print("=" * 60)
    print(f"Fertig: {total_replacements} Ersetzungen in {files_changed} Dateien")
    print(f"\nNeue Domain: https://{new_domain}")
    print("\nVergiss nicht:")
    print("  1. git add -A && git commit -m 'Domain-Wechsel zu {}'".format(new_domain))
    print("  2. git push origin main")
    print("  3. DNS-Einstellungen bei deinem Domain-Anbieter konfigurieren")
    print("  4. GitHub Pages Custom Domain einrichten")

if __name__ == '__main__':
    main()
