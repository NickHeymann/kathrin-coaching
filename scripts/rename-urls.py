#!/usr/bin/env python3
"""
Umbenennung aller Blog-Posts zu kurzen, prägnanten URLs.
Aktualisiert alle Verlinkungen in allen HTML-Dateien.
"""

import os
import re
import shutil

# Mapping: alte URL → neue URL
URL_MAPPING = {
    # BLOG POSTS - Achtsamkeit
    "angst-achtsamkeit-und-frieden.html": "angst-und-achtsamkeit.html",
    "mit-allen-sinnen-achtsamkeit.html": "achtsamkeit-sinne.html",
    "sonnenuntergang-in-grignan.html": "sonnenuntergang-grignan.html",
    "stille_heilung.html": "stille-heilung.html",
    "qarrtsiluni-neues-entsteht-in-der-stille.html": "qarrtsiluni.html",
    "freude-als-wegweiser.html": "freude-wegweiser.html",

    # BLOG POSTS - Selbstliebe
    "dankbarkeit.html": "dankbarkeit.html",  # bleibt
    "deine-einzigartigkeit.html": "einzigartigkeit.html",
    "ueber-fehler-und-deinen-selbstwert.html": "fehler-selbstwert.html",
    "verlass-dich-nicht.html": "verlass-dich-nicht.html",  # bleibt
    "wer-bist-du-wenn-du-niemand-sein-musst.html": "wer-bist-du.html",
    "wie-du-gesunde-grenzen-setzen-kannst-ohne-schlechtes-gewissen.html": "grenzen-setzen.html",
    "es-ist-okay.html": "es-ist-okay.html",  # bleibt
    "selbstvergessen.html": "selbstvergessen.html",  # bleibt

    # BLOG POSTS - Beziehung
    "beziehungsprobleme.html": "beziehungsprobleme.html",  # bleibt
    "ehe-retten.html": "ehe-retten.html",  # bleibt
    "gehen-oder-bleiben.html": "gehen-oder-bleiben.html",  # bleibt
    "love-letters.html": "love-letters.html",  # bleibt
    "gemeinsam-jammern.html": "gemeinsam-jammern.html",  # bleibt

    # BLOG POSTS - Heldinnenreise
    "gib-deinem-leben-deinen-sinn-eine-heldinnenreise.html": "heldinnenreise.html",
    "herzenswunsch-folge-deiner-sehnsucht.html": "herzenswunsch.html",
    "leben-planen.html": "leben-planen.html",  # bleibt
    "ueber-gewohnheiten-und-das-verlassen-der-komfortzone.html": "komfortzone.html",
    "freiheit-ist-niemals-groesser-als-der-kopf-der-sie-denkt.html": "freiheit.html",
    "was-ist-wirklich-wichtig.html": "was-ist-wichtig.html",
    "wie-fuehlt-sich-ein-erfuelltes-leben-an.html": "erfuelltes-leben.html",
    "wo-ich-bin-will-ich-ganz-sein.html": "ganz-sein.html",
    "wunschlos-gluecklich-schade-eigentlich.html": "wunschlos-gluecklich.html",
    "endlich-innerer-frieden.html": "innerer-frieden.html",
    "deine-vision-noch-schoner-mit-einem-vision-board.html": "vision-board.html",
    "mein-suedfrankreich-happymefree.html": "suedfrankreich.html",
    "letzte-male-abschied.html": "letzte-male.html",

    # BLOG POSTS - Hochbegabung
    "hochbegabt-dein-bunter-weg.html": "hochbegabt.html",
    "hochbegabung-hochsensibilitat.html": "hochbegabung-hochsensibel.html",

    # BLOG POSTS - Körper & Heilung
    "das-geschenk-deiner-wut.html": "geschenk-wut.html",
    "die-angst-vor-deiner-power.html": "angst-vor-power.html",
    "gedankenkarussell.html": "gedankenkarussell.html",  # bleibt
    "glaubenssatzarbeit-hilfe-annehmen.html": "hilfe-annehmen.html",
    "glaubenssatzarbeit-pferdegestuetztescoaching.html": "glaubenssaetze-pferde.html",
    "innere-fuehrung.html": "innere-fuehrung.html",  # bleibt
    "klossgefuehl-im-hals-wie-eine-aufstellung-hilft.html": "kloss-im-hals.html",
    "nackenschmerzen-symptome-als-wegweiser.html": "nackenschmerzen.html",
    "wen-ziehst-du-hinter-dir-her.html": "wen-ziehst-du.html",
    "wie-du-achtsam-mit-deinen-gefuehlen-umgehen-kannst-und-dabei-jede-menge-ueber-dich-erfaehrst.html": "gefuehle-achtsam.html",
    "die-liebe-der-pferde.html": "liebe-der-pferde.html",
    "mit-pferden-sein-und-heilen.html": "pferde-heilen.html",
}

def rename_files(project_dir):
    """Benennt Dateien um."""
    renamed = []
    for old_name, new_name in URL_MAPPING.items():
        if old_name == new_name:
            continue
        old_path = os.path.join(project_dir, old_name)
        new_path = os.path.join(project_dir, new_name)

        if os.path.exists(old_path):
            # Backup in _archive
            archive_dir = os.path.join(project_dir, "_archive", "old-urls")
            os.makedirs(archive_dir, exist_ok=True)

            # Umbenennen
            shutil.move(old_path, new_path)
            renamed.append((old_name, new_name))
            print(f"  {old_name} → {new_name}")

    return renamed

def update_links_in_file(filepath, url_mapping):
    """Aktualisiert alle Links in einer Datei."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return 0

    original = content
    changes = 0

    for old_url, new_url in url_mapping.items():
        if old_url == new_url:
            continue

        # href="alte-url.html"
        pattern1 = f'href="{old_url}"'
        replacement1 = f'href="{new_url}"'
        if pattern1 in content:
            content = content.replace(pattern1, replacement1)
            changes += 1

        # href='alte-url.html'
        pattern2 = f"href='{old_url}'"
        replacement2 = f"href='{new_url}'"
        if pattern2 in content:
            content = content.replace(pattern2, replacement2)
            changes += 1

        # Canonical URLs
        old_canonical = f"kathrin-coaching/{old_url}"
        new_canonical = f"kathrin-coaching/{new_url}"
        if old_canonical in content:
            content = content.replace(old_canonical, new_canonical)
            changes += 1

        # CURRENT_SLUG im JavaScript
        old_slug = f"CURRENT_SLUG = '{old_url}'"
        new_slug = f"CURRENT_SLUG = '{new_url}'"
        if old_slug in content:
            content = content.replace(old_slug, new_slug)
            changes += 1

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    return changes

def update_all_links(project_dir):
    """Aktualisiert Links in allen HTML-Dateien."""
    html_files = []
    for f in os.listdir(project_dir):
        if f.endswith('.html'):
            html_files.append(os.path.join(project_dir, f))

    # Auch in templates
    templates_dir = os.path.join(project_dir, 'templates')
    if os.path.exists(templates_dir):
        for f in os.listdir(templates_dir):
            if f.endswith('.html'):
                html_files.append(os.path.join(templates_dir, f))

    total_changes = 0
    files_changed = 0

    for filepath in html_files:
        changes = update_links_in_file(filepath, URL_MAPPING)
        if changes > 0:
            files_changed += 1
            total_changes += changes
            print(f"  {os.path.basename(filepath)}: {changes} Links aktualisiert")

    return files_changed, total_changes

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)

    print("=" * 60)
    print("URL-Refactoring: Kurze, prägnante Pfade")
    print("=" * 60)

    print("\n1. Dateien umbenennen...")
    renamed = rename_files(project_dir)
    print(f"   → {len(renamed)} Dateien umbenannt")

    print("\n2. Links aktualisieren...")
    files_changed, total_changes = update_all_links(project_dir)
    print(f"   → {total_changes} Links in {files_changed} Dateien aktualisiert")

    print("\n" + "=" * 60)
    print("Fertig! Bitte prüfen und committen.")
    print("=" * 60)

if __name__ == "__main__":
    main()
